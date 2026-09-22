import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
};

export function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Nobles forms backend is not configured.');
  return createClient(url, key, options);
}

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export function adminEmails(configured = process.env.NOBLES_ADMIN_EMAILS) {
  const previous = 'admin@mynoblescooperative.com';
  const replacement = 'info@mynoblescooperative.com';
  return [...new Set((configured || replacement).split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
    .map(value => value === previous ? replacement : value))];
}

export async function requireAdmin(request) {
  const token = /^Bearer (.+)$/i.exec(request.headers.get('authorization') || '')?.[1];
  if (!token) return { error: json({ error: 'Sign in to access submissions.' }, 401) };
  const emails = adminEmails();
  if (!emails.length) return { error: json({ error: 'Admin access has not been configured.' }, 503) };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { error: json({ error: 'Admin access has not been configured.' }, 503) };
  const auth = createClient(url, key, options);
  const { data, error } = await auth.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email || !emails.includes(email) || !data.user.email_confirmed_at) {
    return { error: json({ error: 'This account is not authorized for form submissions.' }, 403) };
  }
  return { user: data.user };
}

export async function rateLimit(db, request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || 'unknown';
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = createHash('sha256').update(secret + ':' + ip).digest('hex');
  const { data, error } = await db.rpc('nobles_check_rate_limit', {
    p_key: key, p_limit: 12, p_window_seconds: 3600
  });
  if (error) throw error;
  return data === true;
}

export function normalizePhone(value) {
  const raw = String(value || '').replace(/[^0-9+]/g, '');
  if (!raw) return '';
  if (raw.startsWith('+234')) return '234' + raw.slice(4);
  if (raw.startsWith('0')) return '234' + raw.slice(1);
  return raw.replace(/^\+/, '');
}

export function validPhone(value) {
  return /^\d{10,15}$/.test(normalizePhone(value));
}
