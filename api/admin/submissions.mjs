import { database, json, requireAdmin } from '../_lib/nobles.mjs';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  let db;
  try { db = database(); }
  catch { return json({ error: 'The submissions database is not configured.' }, 503); }
  const url = new URL(request.url);
  const page = Math.max(0, Math.min(10000, Number.parseInt(url.searchParams.get('page') || '0', 10) || 0));
  const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get('limit') || '50', 10) || 50));
  const type = url.searchParams.get('type') || '';
  const status = url.searchParams.get('status') || '';
  if (type && !['enquiry', 'contact', 'complaint', 'membership'].includes(type)) {
    return json({ error: 'Invalid form filter.' }, 400);
  }
  if (status && !['new', 'in_progress', 'resolved'].includes(status)) {
    return json({ error: 'Invalid status filter.' }, 400);
  }
  let query = db.from('nobles_submissions').select('*,nobles_notifications(recipient_type,channel,recipient,status,created_at)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(page * limit, page * limit + limit - 1);
  if (type) query = query.eq('form_type', type);
  if (status) query = query.eq('status', status);
  const { data, count, error } = await query;
  if (error) {
    console.error('Nobles admin list failed:', error.message);
    return json({ error: 'Could not load submissions.' }, 503);
  }
  return json({ rows: data || [], count: count || 0, page, limit });
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid request.' }, 400); }
  if (!/^[a-f0-9-]{36}$/i.test(body?.id || '') ||
      !['new', 'in_progress', 'resolved'].includes(body?.status)) {
    return json({ error: 'Invalid submission or status.' }, 400);
  }
  let db;
  try { db = database(); }
  catch { return json({ error: 'The submissions database is not configured.' }, 503); }
  const { data, error } = await db.from('nobles_submissions')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.id).select('id,status').single();
  if (error) {
    console.error('Nobles admin update failed:', error.message);
    return json({ error: 'Could not update submission.' }, 503);
  }
  return json({ row: data });
}
