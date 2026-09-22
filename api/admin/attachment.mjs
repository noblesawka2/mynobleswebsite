import { database, json, requireAdmin } from '../_lib/nobles.mjs';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-f0-9-]{36}$/i.test(id)) return json({ error: 'Invalid submission.' }, 400);
  let db;
  try { db = database(); }
  catch { return json({ error: 'The attachments database is not configured.' }, 503); }
  const { data: row, error } = await db.from('nobles_submissions')
    .select('attachment_path').eq('id', id).single();
  if (error || !row?.attachment_path?.startsWith('complaints/')) {
    return json({ error: 'Attachment not found.' }, 404);
  }
  const { data, error: signError } = await db.storage.from('nobles-attachments')
    .createSignedUrl(row.attachment_path, 60, { download: true });
  if (signError || !data?.signedUrl) {
    console.error('Nobles private attachment link failed:', signError?.message);
    return json({ error: 'Could not open the attachment.' }, 503);
  }
  return json({ url: data.signedUrl });
}
