import { randomBytes, randomUUID } from 'node:crypto';
import { database, json, normalizePhone, rateLimit, validPhone } from '../_lib/nobles.mjs';
import { notifySubmission } from '../_lib/notifications.mjs';

const types = new Set(['enquiry', 'contact', 'complaint', 'membership']);
const maxAttachmentSize = 4 * 1024 * 1024;
const attachmentTypes = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

export async function validateAttachment(file) {
  if (!file || !file.size) return null;
  if (file.size > maxAttachmentSize) throw new Error('Attachment must be 4MB or smaller.');
  const extension = String(file.name || '').toLowerCase().split('.').pop();
  if (!attachmentTypes[extension]) throw new Error('Unsupported attachment type. Use JPG, PNG, GIF, PDF, DOC, DOCX, XLS or XLSX.');
  const buffer = Buffer.from(await file.arrayBuffer());
  const head = buffer.subarray(0, 8).toString('hex');
  const zip = head.startsWith('504b0304') || head.startsWith('504b0506');
  const ole = head.startsWith('d0cf11e0a1b11ae1');
  const valid = {
    jpg: head.startsWith('ffd8ff'), jpeg: head.startsWith('ffd8ff'),
    png: head === '89504e470d0a1a0a', gif: buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a',
    pdf: buffer.subarray(0, 5).toString('ascii') === '%PDF-',
    doc: ole, xls: ole,
    docx: zip && buffer.includes(Buffer.from('word/')),
    xlsx: zip && buffer.includes(Buffer.from('xl/'))
  }[extension];
  if (!valid) throw new Error('The attachment contents do not match its file type.');
  return { buffer, extension, contentType: attachmentTypes[extension], name: String(file.name).slice(0, 150) };
}

function value(form, key, max = 500) {
  const raw = form.get(key);
  return typeof raw === 'string' ? raw.trim().slice(0, max) : '';
}

function required(data, keys) {
  const missing = keys.find(key => !data[key]);
  if (missing) throw new Error('Please complete the ' + missing.replaceAll('_', ' ') + ' field.');
}

export function validateSubmission(form) {
  const type = value(form, 'form_type', 30);
  if (!types.has(type)) throw new Error('Unknown form type.');
  if (value(form, 'website')) throw new Error('Submission could not be accepted.');
  const data = { name: value(form, 'name', 190) };
  if (type === 'enquiry') {
    Object.assign(data, {
      whatsapp: value(form, 'whatsapp', 30), location: value(form, 'location', 160),
      profile: value(form, 'profile', 100), interest: value(form, 'interest', 160),
      followup: value(form, 'followup', 80), channel: value(form, 'channel', 60),
      message: value(form, 'message', 2000), consent: value(form, 'consent', 5)
    });
    required(data, ['name', 'whatsapp', 'location', 'profile', 'interest', 'followup', 'channel']);
    if (data.consent !== '1') throw new Error('Please consent to being contacted.');
  } else if (type === 'contact') {
    Object.assign(data, {
      email: value(form, 'email', 190), whatsapp: value(form, 'whatsapp', 30),
      subject: value(form, 'subject', 160), message: value(form, 'message', 5000)
    });
    required(data, ['name', 'email', 'subject', 'message']);
  } else if (type === 'complaint') {
    Object.assign(data, {
      phone: value(form, 'phone', 30), email: value(form, 'email', 190),
      member_id: value(form, 'member_id', 80), category: value(form, 'category', 100),
      subject: value(form, 'subject', 160), message: value(form, 'message', 5000)
    });
    required(data, ['name', 'phone', 'email', 'category', 'subject', 'message']);
  } else {
    Object.assign(data, {
      whatsapp: value(form, 'whatsapp', 30), phone: value(form, 'phone', 30),
      age: value(form, 'age', 30), state: value(form, 'state', 100),
      lga: value(form, 'lga', 100), town: value(form, 'town', 100),
      product: value(form, 'product', 100), goal: value(form, 'goal', 2000),
      source: value(form, 'source', 100), consent: value(form, 'consent', 5)
    });
    required(data, ['name', 'whatsapp', 'age', 'state', 'lga', 'town', 'product', 'source']);
    if (data.consent !== '1') throw new Error('Please consent to being contacted.');
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Please enter a valid email address.');
  }
  for (const key of ['whatsapp', 'phone']) {
    if (data[key] && !validPhone(data[key])) throw new Error('Please enter a valid phone number.');
    if (data[key]) data[key] = normalizePhone(data[key]);
  }
  return { type, data };
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ success: false, message: 'Cross-site submission is not allowed.' }, 403);
  }
  if (Number(request.headers.get('content-length') || 0) > maxAttachmentSize + 100_000) {
    return json({ success: false, message: 'The form is too large.' }, 413);
  }
  let form;
  try { form = await request.formData(); }
  catch { return json({ success: false, message: 'Invalid form submission.' }, 400); }
  let type, data;
  try { ({ type, data } = validateSubmission(form)); }
  catch (error) { return json({ success: false, message: error.message }, 400); }
  let attachment;
  try {
    if (form.get('attachment')?.size && type !== 'complaint') throw new Error('Attachments are only accepted with complaints.');
    attachment = await validateAttachment(form.get('attachment'));
  } catch (error) { return json({ success: false, message: error.message }, 400); }
  if (attachment) data.attachment_name = attachment.name;

  let db;
  try { db = database(); }
  catch { return json({ success: false, message: 'The form service is not configured yet.' }, 503); }
  try {
    if (!await rateLimit(db, request)) {
      return json({ success: false, message: 'Too many submissions. Please try again later.' }, 429);
    }
  } catch (error) {
    console.error('Nobles rate limit error:', error.message);
    return json({ success: false, message: 'The form service is not ready yet.' }, 503);
  }

  const prefixes = { enquiry: 'ENQ', contact: 'CON', complaint: 'CMP', membership: 'MEM' };
  const reference = 'NB-' + prefixes[type] + '-' +
    new Date().toISOString().slice(0, 10).replaceAll('-', '') + '-' +
    randomBytes(4).toString('hex').toUpperCase();
  const entry = {
    reference_no: reference, form_type: type, name: data.name,
    email: data.email || null, whatsapp: data.whatsapp || null, phone: data.phone || null,
    subject: data.subject || null, category: data.category || data.profile || null,
    product: data.product || data.interest || null, issue: data.message || null,
    payload: data
  };
  if (attachment) {
    entry.attachment_path = `complaints/${randomUUID()}.${attachment.extension}`;
    const { error } = await db.storage.from('nobles-attachments').upload(entry.attachment_path, attachment.buffer, {
      contentType: attachment.contentType, upsert: false
    });
    if (error) {
      console.error('Nobles private attachment upload failed:', error.message);
      return json({ success: false, message: 'Could not securely upload the attachment. Please try again.' }, 503);
    }
  }
  const { data: saved, error } = await db.from('nobles_submissions').insert(entry).select('id').single();
  if (error) {
    if (entry.attachment_path) await db.storage.from('nobles-attachments').remove([entry.attachment_path]);
    console.error('Nobles submission save failed:', error.message);
    return json({ success: false, message: 'Could not save your request. Please try again.' }, 503);
  }
  try { await notifySubmission(db, { id: saved.id, form_type: type, reference_no: reference }, data); }
  catch (error) { console.error('Nobles notification processing failed:', error.message); }
  return json({ success: true, message: 'Your request has been received.', reference });
}

export function GET() {
  return json({ error: 'Method not allowed.' }, 405);
}
