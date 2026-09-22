# Nobles Cooperative website

The public website uses HTML, CSS, and vanilla JavaScript. Vercel serves the
pages and runs the form/admin JavaScript functions in `api/`. The legacy
PHP/MySQL `nobles-system/` folder is retained as reference only and is excluded
from the Vercel deployment.

## Forms and admin

- Membership enquiries: `/membership/` (linked from Get Started and product pages).
- General enquiries: homepage enquiry and `/contact/`.
- Complaints and private attachments: `/complaints/`.
- Forms dashboard: `/admin/forms/`; gallery/blog admin remains at `/admin/`.

Run `npm.cmd test` before deployment. The production database migration,
environment variables, and end-to-end checks are documented in
[`nobles-system/vercel/README.md`](nobles-system/vercel/README.md). The site
must not be declared live for new forms until those steps pass.
