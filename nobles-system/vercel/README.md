# Vercel deployment of Nobles forms

The PHP/MySQL files in `nobles-system/` do not run on Vercel. The Vercel
implementation lives in `/api/forms/submit.mjs` and
`/api/admin/submissions.mjs`; it uses the Supabase project already used by
the website. It does not use the PHP installer or MySQL schema.

## Before deploying

1. Run `schema.sql` in that Supabase project's SQL editor. It creates private
   submissions, notification and rate-limit tables, and the private attachment
   bucket. It does not migrate old Google Sheets
   survey entries or existing Supabase contact/complaint rows.
2. In Vercel project Settings > Environment Variables, set the values shown in
   the repository's `.env.example` for Production and any Preview environment
   you intend to test. The secret key must be a **server-only** Supabase secret
   key; never put it into HTML or browser JavaScript.
3. Set `NOBLES_ADMIN_EMAILS` to the email of an existing, confirmed Supabase
   Auth account that you control. Multiple addresses can be comma-separated.
   This allowlist is checked by the Vercel API, not just by the admin page.
4. Redeploy after setting variables. Submit a test of each form type and confirm
   each appears at `/admin/forms/`. Test a private attachment download, CSV
   export, and status update using the allowlisted admin account.

The dashboard at `/admin/forms/` uses the existing Supabase email/password
sign-in, then verifies the user on the server. The existing `/admin/` gallery
and blog dashboard is preserved and links to it.

The website's contact, visitor-enquiry, membership, and complaint forms use the
new API. Complaint attachments are validated on the server, saved in the
private `nobles-attachments` bucket (4 MB maximum per file, under Vercel's
4.5 MB request limit), and available only to allowlisted admins
through a 60-second download link. The public complaint storage flow is removed.

Set `EBULKSMS_USERNAME`, `EBULKSMS_API_KEY`, and `NOBLES_ADMIN_WHATSAPP` in
Vercel to enable WhatsApp alerts and acknowledgements. If a WhatsApp request
fails, SMS fallback is attempted unless `NOBLES_SMS_FALLBACK=false`. The
submission is saved even if a notification provider is unavailable; statuses
are recorded in `nobles_notifications` for follow-up. Never put API credentials
or a Supabase secret key in a browser file.

Before declaring the migration live, test one submission of each form type,
one complaint with an attachment, an admin download, a status update, and
both the WhatsApp and SMS fallback using production credentials. Confirm the
admin email exists and is confirmed in Supabase Auth.

No payment, account creation, or inbound WhatsApp processing is performed by
these forms. The membership form records interest for follow-up.
