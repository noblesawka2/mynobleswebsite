import { normalizePhone, validPhone } from './nobles.mjs';

const whatsappEndpoint = 'https://api.ebulksms.com/sendwhatsapp.json';
const smsEndpoint = 'https://api.ebulksms.com/sendsms.json';

async function post(endpoint, payload) {
  if (!process.env.EBULKSMS_USERNAME || !process.env.EBULKSMS_API_KEY) {
    return { success: false, status: 'NOT_CONFIGURED' };
  }
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    const result = await response.json().catch(() => null);
    const status = String(result?.response?.status || (response.ok ? 'UNKNOWN_RESPONSE' : 'HTTP_' + response.status));
    return { success: response.ok && status.toUpperCase() === 'SUCCESS', status: status.slice(0, 100) };
  } catch (error) {
    return { success: false, status: error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR' };
  }
}

export async function sendWhatsApp(recipients, message) {
  return post(whatsappEndpoint, {
    WA: {
      auth: { username: process.env.EBULKSMS_USERNAME, apikey: process.env.EBULKSMS_API_KEY },
      message: { subject: 'Nobles Cooperative', messagetext: message.slice(0, 4000) },
      recipients
    }
  });
}

export async function sendSMS(recipients, message) {
  return post(smsEndpoint, {
    SMS: {
      auth: { username: process.env.EBULKSMS_USERNAME, apikey: process.env.EBULKSMS_API_KEY },
      message: { sender: process.env.NOBLES_SMS_SENDER || 'NOBLES', messagetext: message.slice(0, 1000), flash: '0' },
      recipients: { gsm: recipients.map((number, index) => ({ msidn: number, msgid: `NB${Date.now()}${index}` })) },
      dndsender: '0'
    }
  });
}

async function log(db, submissionId, recipientType, channel, recipients, status) {
  const rows = recipients.map(recipient => ({
    submission_id: submissionId, recipient_type: recipientType, channel, recipient, status
  }));
  const { error } = await db.from('nobles_notifications').insert(rows);
  if (error) console.error('Nobles notification status could not be recorded:', error.message);
}

async function deliver(db, submissionId, recipientType, recipients, whatsappMessage, smsMessage) {
  if (!recipients.length) return;
  const whatsapp = await sendWhatsApp(recipients, whatsappMessage);
  await log(db, submissionId, recipientType, 'whatsapp', recipients, whatsapp.status);
  if (!whatsapp.success && process.env.NOBLES_SMS_FALLBACK !== 'false') {
    const sms = await sendSMS(recipients, smsMessage);
    await log(db, submissionId, recipientType, 'sms', recipients, sms.status);
  }
}

function summary(data) {
  return Object.entries(data).filter(([key, value]) => key !== 'consent' && key !== 'attachment_name' && value)
    .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${String(value)}`).join('\n');
}

export async function notifySubmission(db, submission, data) {
  const adminNumbers = (process.env.NOBLES_ADMIN_WHATSAPP || '').split(',').map(number => normalizePhone(number.trim()))
    .filter(number => validPhone(number));
  const contactNumber = data.whatsapp || data.phone;
  const customerNumber = contactNumber && validPhone(contactNumber) ? [normalizePhone(contactNumber)] : [];
  const adminMessage = `NEW ${submission.form_type.toUpperCase()}\nReference: ${submission.reference_no}\n\n${summary(data)}\n\nReview in the Nobles forms admin.`;
  const customerMessage = `Hello ${data.name},\n\nNobles Cooperative received your ${submission.form_type === 'membership' ? 'membership enquiry' : submission.form_type}. Reference: ${submission.reference_no}. Our team will review it and contact you. If you would like to speak with a representative, reply YES.\n\nWe will never ask for your PIN, password or OTP.`;
  await Promise.allSettled([
    deliver(db, submission.id, 'admin', adminNumbers, adminMessage,
      `Nobles ${submission.form_type} alert ${submission.reference_no}. New submission. Check the forms admin.`),
    deliver(db, submission.id, 'customer', customerNumber, customerMessage,
      `Nobles Cooperative received your ${submission.form_type}. Reference ${submission.reference_no}. We will contact you soon. Never share your PIN, password or OTP.`)
  ]);
}
