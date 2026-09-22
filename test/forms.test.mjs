import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { File } from 'node:buffer';
import { POST, validateAttachment, validateSubmission } from '../api/forms/submit.mjs';
import { GET as attachmentGET } from '../api/admin/attachment.mjs';
import { sendSMS, sendWhatsApp } from '../api/_lib/notifications.mjs';
import { adminEmails } from '../api/_lib/nobles.mjs';

function fields(type, values) {
  const form = new FormData();
  form.set('form_type', type);
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

test('forms admin email replaces the previous address even with stale Vercel settings', () => {
  assert.deepEqual(adminEmails(), ['info@mynoblescooperative.com']);
  assert.deepEqual(adminEmails('admin@mynoblescooperative.com'), ['info@mynoblescooperative.com']);
  assert.deepEqual(adminEmails('ADMIN@MYNOBLESCOOPERATIVE.COM,info@mynoblescooperative.com'), ['info@mynoblescooperative.com']);
});

test('membership fields validate and normalize Nigerian phone numbers', () => {
  const { type, data } = validateSubmission(fields('membership', {
    name: 'Ada Okafor', whatsapp: '0803 123 4567', age: '26 - 35',
    state: 'Anambra', lga: 'Awka South', town: 'Awka',
    product: 'Gold Vault', source: 'A Friend/Family', consent: '1'
  }));
  assert.equal(type, 'membership');
  assert.equal(data.whatsapp, '2348031234567');
  assert.equal(data.product, 'Gold Vault');
});

test('required consent and contact email are checked', () => {
  assert.throws(() => validateSubmission(fields('enquiry', {
    name: 'Ada', whatsapp: '08031234567', location: 'Awka',
    profile: 'Trader', interest: 'Gold Vault', followup: 'Within 24 hours',
    channel: 'WhatsApp'
  })), /consent/);
  assert.throws(() => validateSubmission(fields('contact', {
    name: 'Ada', email: 'not-an-email', subject: 'Support Request', message: 'Help'
  })), /email address/);
});

test('cross-site and malformed submissions are rejected before database access', async () => {
  const crossSite = await POST(new Request('https://example.com/api/forms/submit', {
    method: 'POST', headers: { Origin: 'https://other.example' }, body: fields('contact', {})
  }));
  assert.equal(crossSite.status, 403);
  const malformed = await POST(new Request('https://example.com/api/forms/submit', {
    method: 'POST', body: fields('contact', { name: 'Ada' })
  }));
  assert.equal(malformed.status, 400);
});

test('complaint attachments are checked before private storage', async () => {
  const pdf = new File([Buffer.from('%PDF-1.7\nexample')], 'evidence.pdf', { type: 'application/pdf' });
  const valid = await validateAttachment(pdf);
  assert.equal(valid.contentType, 'application/pdf');
  assert.equal(valid.buffer.toString('utf8', 0, 5), '%PDF-');
  await assert.rejects(validateAttachment(new File([Buffer.from('not a pdf')], 'fake.pdf')), /contents/);
  await assert.rejects(validateAttachment(new File([Buffer.alloc(4 * 1024 * 1024 + 1)], 'large.pdf')), /4MB/);
  const form = fields('complaint', {
    name: 'Ada Okafor', phone: '08031234567', email: 'ada@example.com',
    category: 'savings', subject: 'Issue', message: 'Please help'
  });
  form.set('attachment', new File([Buffer.from('not a pdf')], 'fake.pdf'));
  const result = await POST(new Request('https://example.com/api/forms/submit', { method: 'POST', body: form }));
  assert.equal(result.status, 400);
});

test('private attachments require admin authentication', async () => {
  const response = await attachmentGET(new Request('https://example.com/api/admin/attachment?id=invalid'));
  assert.equal(response.status, 401);
});

test('eBulkSMS requests keep credentials server-side and use the original API shapes', { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  const username = process.env.EBULKSMS_USERNAME;
  const apiKey = process.env.EBULKSMS_API_KEY;
  const calls = [];
  process.env.EBULKSMS_USERNAME = 'test@example.com';
  process.env.EBULKSMS_API_KEY = 'test-key';
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return Response.json({ response: { status: 'SUCCESS' } });
  };
  try {
    assert.equal((await sendWhatsApp(['2348031234567'], 'Hello')).success, true);
    assert.equal((await sendSMS(['2348031234567'], 'Hello')).success, true);
    assert.equal(calls[0].url, 'https://api.ebulksms.com/sendwhatsapp.json');
    assert.deepEqual(calls[0].body.WA.recipients, ['2348031234567']);
    assert.equal(calls[0].body.WA.auth.apikey, 'test-key');
    assert.equal(calls[1].url, 'https://api.ebulksms.com/sendsms.json');
    assert.equal(calls[1].body.SMS.recipients.gsm[0].msidn, '2348031234567');
  } finally {
    globalThis.fetch = originalFetch;
    if (username === undefined) delete process.env.EBULKSMS_USERNAME;
    else process.env.EBULKSMS_USERNAME = username;
    if (apiKey === undefined) delete process.env.EBULKSMS_API_KEY;
    else process.env.EBULKSMS_API_KEY = apiKey;
  }
});

test('modified pages have parseable inline JavaScript', () => {
  for (const path of ['index.html', 'contact/index.html', 'complaints/index.html',
    'admin/index.html', 'admin/forms/index.html', 'membership/index.html']) {
    const html = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
    for (const script of scripts) {
      if (script[1].trim()) assert.doesNotThrow(() => new Script(script[1], { filename: path }));
    }
  }
});

test('public complaint page uses the private form API, not direct storage', () => {
  const html = readFileSync(new URL('../complaints/index.html', import.meta.url), 'utf8');
  assert.match(html, /NoblesForms\.submit\('complaint'/);
  assert.doesNotMatch(html, /getPublicUrl|supabaseClient\.storage/);
});
