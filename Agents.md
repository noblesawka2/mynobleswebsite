from pathlib import Path

agents_md = r"""# AGENTS.md — Nobles Cooperative Website

## 1. Project mission

This repository contains the public website and operational web portals for Nobles Cooperative.

The public website is primarily a framework-free static site built with semantic HTML, CSS, and vanilla JavaScript. Preserve that architecture unless the repository already contains a build system that is required for deployment. Do not migrate the public site to React, Next.js, Vue, Angular, or another framework without an explicit instruction from the project owner.

The existing Supabase-backed admin portal may remain dynamic. Add database access only where authentication, submissions, frequently changing content, audit history, or operational records genuinely require it.

## 2. Read before editing

Before changing code:

1. Read this file completely.
2. Inspect the repository tree, package scripts, deployment configuration, existing Supabase client setup, SQL migrations, and all applicable nested `AGENTS.md` files.
3. Identify the existing source of truth for:
   - navigation;
   - footer;
   - routes;
   - design tokens;
   - contact details;
   - product names and figures;
   - Supabase client initialization;
   - authentication and authorization.
4. Run the existing checks before editing so that new failures can be distinguished from pre-existing failures.
5. Do not assume the single homepage file represents the entire repository. Reuse existing components and utilities where they already exist.

When requirements are unclear, choose the least disruptive, most secure implementation that preserves the current visual language and deployment model. Record assumptions in the final summary.

## 3. Non-negotiable architecture

### Public site

Use:

- semantic HTML5;
- shared CSS files;
- vanilla JavaScript modules or small focused scripts;
- static pages for marketing, product, institutional, and educational content;
- progressive enhancement;
- real links that work without JavaScript;
- static-host-compatible route folders with `index.html` when that matches the current deployment.

Do not:

- add a runtime frontend framework;
- add a database merely to render static marketing copy;
- duplicate a member dashboard already provided by the Nobles Vault app;
- make critical navigation or primary content depend on client-side JavaScript;
- place all new JavaScript inline in each HTML page;
- copy large blocks of page-specific CSS into every page.

### Dynamic areas

Supabase is appropriate for:

- the existing admin portal;
- staff authentication and staff operational records;
- complaints and support tickets;
- contact, partnership, and investment enquiries;
- blog, financial education, FAQ, and gallery content only when the admin portal actually manages those records;
- audit trails and role-based access.

Static content remains static unless there is a clear content-management requirement.

## 4. Brand and compliance rules

Nobles is a cooperative, not a bank. Never describe Nobles as a bank, digital bank, investment bank, government funding agency, venture fund, or guaranteed-return scheme.

Use a serious, trusted, women-first, disciplined, caring, practical tone. Public copy should use plain English and relatable South-East Nigerian examples without becoming informal or unprofessional.

Required positioning:

- women-first cooperative;
- disciplined savings;
- responsible credit;
- business growth and financial education;
- physical human support in Awka;
- “No woman is left behind.”

Primary conversion paths:

1. Download and register through Nobles Vault.
2. Receive staff assistance through the official WhatsApp channel.
3. Complete office enrolment where required.

Do not add USSD.

Use only the current official Nobles Cooperative logo already supplied in the repository. Do not recreate, distort, recolour, or replace the logo.

Never invent:

- member counts;
- loan-book figures;
- testimonials;
- awards;
- licences;
- security certifications;
- founder names or qualifications;
- partner names;
- guaranteed returns;
- “bank-level” or similar claims without written approval.

Any unverified content must be marked clearly in source as `TODO: CONTENT APPROVAL` and must not be presented as an established public fact.

## 5. Official public details

Use the repository’s approved central configuration if it exists. Otherwise create one source-of-truth file used by the build or page-generation process.

Current approved public details:

- Brand name: Nobles Cooperative
- Cooperative registration: AN 17915
- Office: 2nd Floor, No. 331B Ziks Avenue (MTN Office), Amenyi, Awka, Anambra State
- Customer phone and WhatsApp: +2349151142355
- WhatsApp: +2349151142355
- Email: noblesawka2@gmail.com
- Website: noblescreditandloans.com
- Google Play package: `com.myminervahub.nobles_vault`
- Primary colours:
  - Purple `#5C008C`
  - Gold `#F49C00`
  - Near-black `#0D0D14`
  - Cream `#FFF7E9`

Do not expose private member information, staff passwords, API secrets, service-role keys, banking details, or internal records.

## 6. Canonical route map

Preserve existing live URLs where known. Standardize internal links so desktop navigation, mobile navigation, footer links, CTAs, sitemap, tests, and canonical tags use the same paths.

### Core

- `/`
- `/contact/`
- `/gallery/`
- `/faq/`
- `/rules-guidelines/`
- `/vault-support/`
- `/complaints/`

### Loans

- `/loans/marketlift/`
- `/loans/marketpower/`
- `/loans/unityloan/`
- `/loans/easypay/`
- `/loans/empowerloan/`
- `/loans/kitchensaver/`

### Save and invest

- `/easysave/`
- `/futurefund/`
- `/goldvault/`
- `/edusave/`
- `/groupsavings/`
- `/monthlysavingschallenge/`
- `/foodvault/`

### About

- `/mission-vision-values/`
- `/our-story/`
- `/founder-story/`

### Partners

- `/investors/`
- `/legacybuilders/`
- `/nobles-vault/`
- `/partners/`
- `/partner-enquiry/`

### Resources

- `/blog/`
- `/blog/<slug>/`
- `/financialeducation/`
- `/financialeducation/<slug>/`

### Portals

- `/admin/` — existing Supabase-backed administration portal
- `/staff/` — authenticated staff portal
- `/staff/login/` — staff sign-in entry, if the current auth structure needs a separate route

Do not create a duplicate member web dashboard unless explicitly approved. 
Any Human images that would be added to the site must be a black woman.
The Nobles Vault app is the member-facing digital account channel.

If the host requires extension-based URLs, preserve the same logical route map and implement redirects or aliases. Never leave desktop and mobile versions pointing to different paths.

## 7. Page templates

### Shared site shell

Every public page must reuse the same:

- skip link;
- desktop navigation;
- mobile navigation;
- official logo;
- active navigation state;
- app download CTA;
- WhatsApp support CTA;
- footer;
- mobile sticky action bar where appropriate;
- base metadata pattern;
- focus states and keyboard behaviour.

Avoid manually diverging copies. If the project has no templating system, use the smallest build-time solution that generates static HTML while preserving the current hosting output. Do not require client-side `fetch()` merely to display the header or footer.

### Product landing page

Each loan or savings product page should contain, in this order where applicable:

1. Product hero and precise one-sentence value proposition.
2. Who the product is for.
3. The member problem it solves.
4. How it works.
5. Key features.
6. Eligibility or participation requirements.
7. Charges, tenor, returns, savings requirements, or limits only from approved product data.
8. Step-by-step process.
9. Risk or responsible-use notice.
10. FAQ.
11. Conversion CTA to Vault, WhatsApp support, or office enrolment.

Never use a generic calculator for a product with different pricing rules. Product calculations must come from an approved central configuration and have tests.

### Institutional page

Use:

1. hero;
2. purpose or story;
3. evidence and governance;
4. operating model;
5. impact or partnership pathway;
6. CTA.

### Resource page

Use:

- category and date;
- clear reading hierarchy;
- author only when verified;
- related resources;
- share controls that do not block reading;
- CTA to take a practical next step.

### Public form page

Use:

- clear purpose;
- minimal data collection;
- labelled fields;
- inline validation;
- consent/privacy notice;
- anti-spam protection appropriate to the current stack;
- success state with a reference number where the workflow supports it;
- clear fallback contact method.

Do not collect BVN, NIN, card details, passwords, bank credentials, or unnecessary sensitive information through ordinary public website forms.

## 8. Product truth and calculations

Create or use one approved product-data source for repeated figures. Do not scatter rates in HTML, JavaScript, cards, calculators, and FAQ text.

Current known product rules must be checked against owner-approved source files before publishing. At minimum:

- Gold Vault: 14.4% per annum for a 12-month term unless a newer approved instruction exists.
- Future Fund earns interest according to its approved tenor schedule.
- Group Savings is the official name; do not use “Ajoo” or “Isusu rotation” as the product name.
- Empower Loan has Working Capital and Productive Asset Finance variants.
- MarketLift, MarketPower, Unity Loan, EasyPay, and other loan products have different rates, charges, savings rules, and repayment frequencies.

Never use a universal “2% monthly” loan calculator or a generic yield assumption across all products.

Every financial calculator must:

- display assumptions;
- identify whether a rate is flat, reducing balance, annual, monthly, weekly, or per cycle;
- show fees separately where applicable;
- round predictably;
- reject invalid or negative values;
- include a disclaimer that the result is an estimate and final approval follows cooperative appraisal;
- have unit tests covering minimum, typical, maximum, zero, invalid, and boundary values.

## 9. HTML standards

- Use valid semantic structure.
- A `<li>` must be inside `<ul>`, `<ol>`, or `<menu>`.
- Each page must have one `<main>` and one clear `<h1>`.
- Maintain logical heading order.
- Buttons perform actions; anchors navigate.
- All meaningful images need accurate `alt` text.
- Decorative images use empty `alt=""`.
- Do not use `href="#"` as a permanent placeholder.
- Do not use inline `style` attributes for reusable rules.
- Avoid duplicate favicon declarations and unresolved placeholders.
- Use `aria-expanded`, `aria-controls`, and correct focus handling for dropdowns, accordions, dialogs, and mobile menus.
- Tabs require proper tab, tabpanel, keyboard, and focus behaviour.
- External links opened in a new tab must use `rel="noopener noreferrer"`.
- Forms require labels, autocomplete attributes where appropriate, error summaries, and accessible success states.

## 10. CSS standards

Preserve the current visual language:

- premium editorial headings;
- clean sans-serif body text;
- purple, gold, near-black, and cream palette;
- strong card hierarchy;
- generous spacing;
- subtle motion;
- mobile-first responsiveness;
- consistent buttons, badges, cards, section headings, forms, and portal states.

Rules:

- Use CSS custom properties for colours, typography, spacing, radii, shadows, widths, and motion.
- Reuse existing utility and component classes before adding new ones.
- Keep page-specific CSS in a clearly named file or scoped section.
- Do not use arbitrary one-off colours that bypass the design tokens.
- Maintain visible focus styles.
- Respect `prefers-reduced-motion`.
- Test at 320px, 375px, 768px, 1024px, 1280px, and 1440px widths.
- Avoid horizontal scrolling.
- Do not hide essential content at smaller breakpoints.

Use Aeonik only if a properly licensed project asset is already supplied. Otherwise preserve the approved fallback stack; do not download or commit unlicensed font files.

## 11. JavaScript standards

- Use `"use strict"` or ES modules consistently with the existing project.
- Move shared behaviour out of large inline scripts into focused files.
- Prefer modules such as:
  - `navigation.js`
  - `mobile-menu.js`
  - `reveal.js`
  - `carousel.js`
  - `calculators.js`
  - `forms.js`
  - `supabase-client.js`
  - `auth-guard.js`
- Use defensive null checks when a shared script runs on pages that do not contain every component.
- Do not attach duplicate listeners.
- Avoid global variables.
- Do not insert untrusted database or user content with `innerHTML`.
- Sanitize or render untrusted content with safe DOM methods.
- Keep core navigation and content usable when JavaScript fails.
- Stop timers and observers when no longer required.
- Respect reduced-motion preferences.

## 12. Supabase security

Follow the existing Supabase architecture. Do not create a second client pattern.

Mandatory rules:

- Never place a Supabase secret key or legacy service-role key in browser code, committed files, logs, screenshots, or documentation.
- Browser code may use only the project publishable key, or a legacy anon key while migration is pending.
- Enable Row Level Security on every exposed table.
- Add least-privilege grants and explicit policies before browser access.
- Do not use `select('*')` for operational or sensitive tables; request only required columns.
- Use protected role data, not user-editable profile fields, for admin/staff authorization.
- Admin pages must verify an authenticated session and an authorized role before showing or querying protected data.
- Redirect unauthorized users safely and clear stale sessions.
- Use Edge Functions or a trusted backend for privileged operations, secret-key work, email dispatch, or operations that bypass normal RLS.
- Add SQL migrations for schema or policy changes. Do not make undocumented dashboard-only changes.
- Add audit fields such as `created_at`, `updated_at`, `created_by`, and status history where appropriate.
- Use server-generated IDs or UUIDs.
- Validate and normalize public form input before storage.
- Never store passwords in custom tables.

Suggested access model, adapted to the existing schema:

- `admin`: full approved administration functions;
- `manager`: operational oversight within approved scope;
- `staff`: own records and assigned work;
- `content_editor`: approved content modules only;
- public/anonymous: insert-only access to carefully limited form endpoints, never unrestricted table reads.

Do not weaken existing RLS policies merely to make a page work.

## 13. Portal requirements

### Admin portal

Preserve the existing portal and Supabase connection. Extend it only after mapping current routes, roles, tables, and policies.

Potential modules, only when requested and supported by the schema:

- dashboard summary;
- content management for blog, education, FAQ, and gallery;
- enquiries;
- complaints and support tickets;
- staff users and roles;
- staff reports;
- leads and app activation follow-ups;
- audit log;
- settings containing non-secret public configuration.

Every module requires authorization checks, loading states, empty states, error states, pagination where needed, and tests.

### Staff portal

The staff portal should be operational, not a decorative dashboard. Depending on approved scope, it may include:

- secure sign-in and sign-out;
- personal dashboard;
- daily report submission;
- assigned leads and follow-ups;
- member onboarding/app activation records;
- loan recovery follow-up records;
- target/KPI progress;
- notices or approved documents.

Staff must see only records allowed by role and assignment. Do not expose all members or all operational data by default.

### Complaints and support

The public user should be able to:

- submit a complaint or support request;
- receive a reference number;
- see expected next steps;
- use WhatsApp or office support as fallback.

The admin side should support status, assignment, internal note, resolution, and audit history. Public users must not be able to enumerate other tickets.

## 14. SEO, metadata, and performance

Each public page needs:

- unique `<title>`;
- unique meta description;
- canonical URL;
- Open Graph metadata;
- social image when supplied;
- meaningful page heading;
- inclusion in `sitemap.xml` unless intentionally private;
- appropriate `robots.txt` handling.

Portal, login, admin, staff, and private workflow routes should not be indexed.

Performance rules:

- host production images locally when licensing permits;
- use responsive image dimensions and modern formats;
- specify image width and height;
- lazy-load below-the-fold images;
- do not lazy-load the primary hero image;
- avoid render-blocking third-party scripts;
- minimize layout shift;
- avoid shipping page scripts to routes that do not use them.

Do not publish external stock-image hotlinks as the permanent production solution.

## 15. Testing requirements

Use the repository’s existing tooling. If no test tooling exists, add the smallest practical development-only setup without changing the public runtime architecture.

Recommended minimum:

- HTML validation;
- CSS and JavaScript linting;
- internal-link and asset checking;
- Playwright smoke tests;
- Playwright interaction tests;
- automated accessibility checks using Axe with Playwright;
- calculator unit tests;
- Supabase policy or integration tests where a local/test environment exists.

Required smoke coverage:

- every canonical public route returns successfully;
- desktop and mobile navigation reach the same canonical destinations;
- no permanent `href="#"` remains;
- logo and critical assets load;
- app download and WhatsApp links are correct;
- mobile menu opens, traps/handles focus appropriately, closes by button and Escape, and restores focus;
- dropdowns work by keyboard and pointer;
- calculators produce approved results;
- public forms validate and show success/error states;
- protected portal routes reject unauthenticated and unauthorized users;
- authorized roles see only permitted modules;
- no console errors on tested routes;
- no horizontal overflow at target widths.

Test commands should be exposed through predictable scripts such as:

- `npm run lint`
- `npm run validate:html`
- `npm run check:links`
- `npm run test`
- `npm run test:e2e`
- `npm run test:a11y`
- `npm run build`

Use names that match the existing project if equivalent scripts already exist.

## 16. Content and data safety

- Do not commit `.env`, credentials, exports of member data, database dumps, or personally identifying test fixtures.
- Add `.env.example` containing names only, never real values.
- Use clearly fake test records.
- Redact logs and screenshots.
- Do not put real member phone numbers, BVNs, NINs, account numbers, loan balances, or passwords into tests.
- Public analytics must not expose personal or financial records.

## 17. Working method for Codex

For each task:

1. Read applicable instructions.
2. Inspect relevant files and tests.
3. State a short implementation plan.
4. Make the smallest coherent change.
5. Reuse established patterns.
6. Run focused checks.
7. Run the full relevant test suite before completion.
8. Review the diff for route, copy, security, and mobile regressions.
9. Report:
   - files changed;
   - features completed;
   - tests run and results;
   - remaining TODOs;
   - assumptions;
   - any manual Supabase migration or deployment step.

Do not claim success without test evidence. Do not silently skip failing checks. If a check cannot run, state exactly why and provide the command to run.

## 18. Definition of done

A page or portal feature is done only when:

- it uses the approved route;
- it matches the existing design system;
- desktop and mobile layouts work;
- navigation and CTAs are real;
- copy is approved or clearly marked for approval;
- accessibility basics are implemented;
- there are no console errors;
- relevant tests pass;
- Supabase access follows RLS and least privilege;
- no secrets or personal data are exposed;
- metadata is complete for public pages;
- the final report explains the change and verification.
"""

codex_prompts = r"""# Codex Prompt Pack — Nobles Cooperative Website

Use these prompts one at a time in the order shown. Start a fresh Codex thread after adding or materially changing `AGENTS.md`, so the active instructions are loaded cleanly.

Each prompt assumes the repository-root `AGENTS.md` is present.

---

## Prompt 0 — Repository discovery and implementation map

```text
Read the repository-root AGENTS.md and all applicable nested AGENTS.md files.

Perform a read-only audit of this Nobles Cooperative website repository. Do not edit files yet.

Goals:
1. Map the complete project tree and identify the public static site, the existing Supabase admin portal, any staff portal work, build/deployment configuration, shared assets, and test tooling.
2. Identify how header, footer, mobile navigation, metadata, route links, design tokens, JavaScript behaviour, and Supabase clients are currently shared.
3. Compare desktop navigation, mobile navigation, footer, sitemap, and actual page folders. List every mismatch, missing route, typo, placeholder href, placeholder phone number, broken asset, duplicate metadata declaration, and route that lacks a page.
4. Locate all product rates, returns, fees, statistics, testimonials, founder claims, contact details, and registration claims. Flag inconsistent or unverified values.
5. Map all Supabase tables, migrations, policies, auth guards, roles, and uses of publishable/anon/service keys. Do not print secret values.
6. Run all existing lint, build, validation, and tests without changing code.
7. Produce a prioritized implementation plan divided into:
   - P0 safety, security, and broken-link fixes;
   - P1 shared site foundation;
   - P2 static product and institutional pages;
   - P3 public forms and content modules;
   - P4 staff/admin portal work;
   - P5 testing, accessibility, SEO, and release.

Output:
- architecture summary;
- route matrix;
- issue table with file and line references;
- existing test results;
- proposed file changes;
- assumptions and questions that block implementation.

Do not implement anything in this task.