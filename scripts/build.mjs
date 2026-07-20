import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const fixturesOutput = path.join(root, ".build", "fixtures");
const site = JSON.parse(await readFile(path.join(root, "src/data/site.json"), "utf8"));
const savingsProducts = JSON.parse(await readFile(path.join(root, "src/data/savings-products.json"), "utf8"));
const year = new Date().getFullYear();

function get(object, key) { return key.split(".").reduce((value, part) => value && value[part], object); }
function render(template, data) {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => String(get(data, key) ?? ""));
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]); }
function ordered(items, className = "steps") { return `<ol class="${className}">${items.map((item, index) => `<li class="step"><span class="step-number">${index + 1}</span><p>${escapeHtml(item)}</p></li>`).join("")}</ol>`; }
function termsList(items) { return `<ul class="checklist">${items.map((item) => `<li class="checklist-item"><span aria-hidden="true">✓</span><span>${escapeHtml(item)}</span></li>`).join("")}</ul>`; }
const base = await readFile(path.join(root, "src/templates/base.html"), "utf8");
const header = render(await readFile(path.join(root, "src/templates/partials/header.html"), "utf8"), { ...site, year });
const footer = render(await readFile(path.join(root, "src/templates/partials/footer.html"), "utf8"), { ...site, year });

await rm(output, { recursive: true, force: true });
await rm(path.join(root, ".build"), { recursive: true, force: true });
await mkdir(output, { recursive: true });
await mkdir(fixturesOutput, { recursive: true });
await cp(path.join(root, "asset"), path.join(output, "asset"), { recursive: true });

const sources = { // Legacy pages are copied only when structurally complete.
  "index.html": "index.html",
  "contact.html": "contact/index.html",
  "gallery.html": "gallery/index.html",
  "fqa.html": "faq/index.html",
  "blog.html": "blog/index.html",
  "financialeducation.html": "financialeducation/index.html",
  "ourstory.html": "our-story/index.html",
  "founder.html": "founder-story/index.html",
  "about-us/mission-vision-values.html": "mission-vision-values/index.html",
  "loans/marketlift.html": "loans/marketlift/index.html",
  "loans/market-power.html": "loans/marketpower/index.html",
  "savings/EasySave.html": "easysave/index.html",
  "savings/FutureFund.html": "futurefund/index.html",
  "savings/GoldVault.html": "goldvault/index.html",
  "admin.html": "admin/index.html"
};

function stabilize(html, isHome) {
  html = html
    .replace(/<link\s+rel=["']icon["'][^>]*>/gi, "")
    .replace("</title>", "</title>\n    <link rel=\"icon\" type=\"image/png\" href=\"/asset/favicon.png\">")
    .replaceAll("https://wa.me/23491", `${site.whatsappUrl}`)
    .replaceAll("https://play.google.com/store/apps/details?id=com.myminervahub.nobles_vault&pcampaignid=web_share", site.googlePlay)
    .replace(/href=(["'])#\1/gi, `href="${site.routes.contact}"`)
    .replace(/\s*<a\s+href=["']#main["'][\s\S]*?(?=<main\b)/i, `\n${header}\n`)
    .replace(/<footer\b[\s\S]*?<\/footer>/i, footer)
    .replace(/\s*<button class=["']back-to-top["'][\s\S]*?<\/button>/gi, "")
    .replace(/\s*<div class=["']mobile-sticky-bar["'][\s\S]*?<\/div>/gi, "")
    .replace(/<script\s+src=["']\/asset\/js\/app\.js["']><\/script>/gi, "");
  if (isHome) {
    html = html.replace(/\s*<script>\s*\(function\(\)[\s\S]*?<\/script>\s*(?=<\/body>)/i, "\n<script src=\"/asset/js/homepage.js\" defer></script>\n<script src=\"/asset/js/calculators.js\" defer></script>\n");
  }
  return html;
}

for (const [source, destination] of Object.entries({})) {
  try {
    let html = await readFile(path.join(root, source), "utf8");
    if (source !== "admin.html" && (!/<main\b/i.test(html) || !/<h1\b/i.test(html))) {
      console.warn(`Skipped incomplete public fragment: ${source}`);
      continue;
    }
    if (source !== "admin.html") html = stabilize(html, source === "index.html");
    const target = path.join(output, destination);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const socialImage = `${site.website}/asset/N3%20Logo%20full.png`;
const mobilePartner = `<div class="mm-item"><button class="mm-link" data-mm-accordion type="button">Partner <span class="mm-arrow" aria-hidden="true">&#9662;</span></button><div class="mm-sublinks"><a href="${site.routes.investors}">Investors</a><a href="${site.routes.legacybuilders}">LegacyBuilders</a><a href="${site.routes.vault}">Nobles Vault</a><a href="${site.routes.partners}">Partners</a><a href="${site.routes.partnerEnquiry}">Partner enquiry</a></div></div>`;
const productionHeader = header.replace('<div class="mm-item"><button class="mm-link" data-mm-accordion type="button">Resources', `${mobilePartner}<div class="mm-item"><button class="mm-link" data-mm-accordion type="button">Resources`);
function enhance(html, { noindex = false } = {}) {
  const robots = noindex ? '<meta name="robots" content="noindex,nofollow">' : '';
  return html
    .replace('</head>', `<meta property="og:image" content="${socialImage}"><meta name="twitter:card" content="summary_large_image">${robots}</head>`)
    .replace('</body>', '<script src="/asset/js/navigation.js" defer></script><script src="/asset/js/faq.js" defer></script></body>');
}
function routeTarget(route) {
  return route === '/' ? path.join(output, 'index.html') : path.join(output, route.replace(/^\//, ''), 'index.html');
}
async function writeRoute(route, { title, description, content, structuredData = '', noindex = false }) {
  const canonical = `${site.website}${route}`;
  const html = enhance(render(base, { title, description, canonical, structuredData, header: productionHeader, footer, content }), { noindex });
  const target = routeTarget(route);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}
const approvedCta = `<section class="cta-band"><div class="container"><h2>Choose an approved next step</h2><p>Register through Nobles Vault, ask staff on WhatsApp, or visit the Awka office for assistance.</p><div class="hero-actions"><a class="btn btn-secondary" href="${site.googlePlay}" rel="noopener noreferrer">Download Nobles Vault</a><a class="btn btn-white" href="${site.whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp support</a><a class="btn btn-outline-invert" href="${site.routes.contact}">Office details</a></div></div></section>`;
function hero(heading, lede, eyebrow = 'Nobles Cooperative') {
  return `<section class="inner-hero"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">${escapeHtml(heading)}</li></ol></nav><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(lede)}</p></div></section>`;
}
function feature(title, copy) { return `<article class="feature-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`; }
function contentPage(heading, lede, sections, eyebrow) {
  return `${hero(heading, lede, eyebrow)}<section class="section-pad"><div class="container prose">${sections.map(([title, copy]) => `<section><div class="section-heading"><h2>${escapeHtml(title)}</h2></div>${copy}</section>`).join('')}</div></section>${approvedCta}`;
}
const productTemplate = await readFile(path.join(root, "src/templates/product.html"), "utf8");
const productsBySlug = new Map(savingsProducts.map((product) => [product.slug, product]));
for (const product of savingsProducts) {
  const route = site.routes[product.slug === "monthlysavingschallenge" ? "monthlySavings" : product.slug];
  const related = product.related.map((slug) => productsBySlug.get(slug)).filter(Boolean).map((item) => `<a class="feature-card related-card" href="/${item.slug}/"><h3>${escapeHtml(item.name)}</h3><p>View approved details and current confirmation notes.</p></a>`).join("");
  const faq = product.faqs.map(([question, answer]) => `<div class="faq-item"><h3><button data-faq-button type="button">${escapeHtml(question)}</button></h3><div class="faq-panel"><p>${escapeHtml(answer)}</p></div></div>`).join("");
  const features = product.benefits.map((benefit) => `<article class="feature-card"><h3>Practical benefit</h3><p>${escapeHtml(benefit)}</p></article>`).join("");
  const enrolment = ordered(["Download or open Nobles Vault and register as directed.", "Ask staff to confirm every term marked for confirmation on this page.", "Complete assisted office enrolment where the product requires it."]);
  const cta = `<section class="cta-band"><div class="container"><h2>Choose an approved enrolment channel</h2><p>Use Nobles Vault, speak with staff on WhatsApp, or visit the Awka office.</p><div class="hero-actions"><a class="btn btn-secondary" href="${site.googlePlay}" rel="noopener noreferrer">Download Nobles Vault</a><a class="btn btn-white" href="${site.whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp staff support</a><a class="btn btn-outline-invert" href="${site.routes.contact}">Office enrolment details</a></div></div></section>`;
  const structured = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, url: `${site.website}${route}`, brand: { "@type": "Organization", name: site.brand } };
  if (product.slug === "goldvault") structured.additionalProperty = [{ "@type": "PropertyValue", name: "Approved annual rate", value: "14.4% per annum" }, { "@type": "PropertyValue", name: "Approved term", value: "12 months" }];
  const content = render(productTemplate, { ...site, heading: product.name, lede: product.lede, audience: product.who, problem: product.problem, works: ordered(product.works), features, steps: enrolment, notice: product.notice, terms: termsList(product.terms), faq, related, cta });
  const html = enhance(render(base, { title: product.title, description: product.description, canonical: `${site.website}${route}`, structuredData: `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, "\\u003c")}</script>`, header: productionHeader, footer, content }));
  const target = path.join(output, product.slug, "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}

const loanSpecs = [
  ['marketlift', 'marketlift', 'MarketLift', 'eligible market traders', 'a short business-cycle or stock need'],
  ['marketpower', 'marketpower', 'MarketPower', 'eligible members with an assessed business need', 'business growth matched to realistic cash flow'],
  ['unityloan', 'unityloan', 'Unity Loan', 'eligible members who meet the current Unity Loan criteria', 'a need assessed under Unity Loan’s own rules'],
  ['easypay', 'easypay', 'EasyPay', 'eligible members whose need matches the current EasyPay rules', 'a payment need reviewed against repayment capacity'],
  ['empowerloan', 'empowerloan', 'Empower Loan', 'eligible business owners considering Working Capital or Productive Asset Finance', 'working capital or a productive business asset'],
  ['kitchensaver', 'kitchensaver', 'Kitchen Saver', 'members who first confirm the current Kitchen Saver structure', 'a product need that requires current written clarification']
];
for (const [slug, routeKey, name, audience, need] of loanSpecs) {
  // TODO: CONTENT APPROVAL ? product-specific rate, charge, tenor, savings and eligibility schedules.
  const route = site.routes[routeKey];
  const special = name === 'Empower Loan'
    ? '<p>Empower Loan has two distinct variants: <strong>Working Capital</strong> and <strong>Productive Asset Finance</strong>. Their terms must be confirmed separately.</p>'
    : name === 'Kitchen Saver' ? '<p>Staff must confirm whether the current structure is credit, savings or a combined arrangement before enrolment.</p>' : '';
  const content = `${hero(name, `A responsible-credit pathway for ${audience}, subject to cooperative appraisal.`, 'Responsible credit')}
  <section class="section-pad"><div class="container content-grid"><article>
    <section><div class="section-heading"><h2>Who it is for</h2></div><p>${escapeHtml(audience)}.</p></section>
    <section><div class="section-heading"><h2>The need it addresses</h2></div><p>${escapeHtml(need)}.</p>${special}</section>
    <section><div class="section-heading"><h2>How appraisal works</h2></div>${ordered(['Explain the intended use and your expected cash flow.', 'Complete the product-specific cooperative appraisal.', 'Review principal, interest, charges, savings requirements and every due date separately.', 'Accept only if the full repayment plan remains affordable.'])}</section>
    <section><div class="section-heading"><h2>Responsible process</h2></div><div class="feature-grid">${feature('Product-specific terms', 'Nobles loan products do not use one universal rate or formula.')}${feature('Clear confirmation', 'Current terms are confirmed during cooperative appraisal.')}${feature('Human support', 'Members can receive assistance through WhatsApp or at the Awka office.')}</div></section>
    <section class="alert alert-info responsible-notice"><h2>Borrow responsibly</h2><p>Borrow only for a clear need and only when repayments remain affordable after essential household and business costs. Final approval follows cooperative appraisal.</p></section>
    <section class="faq-list"><h2>Frequently asked questions</h2><div class="faq-item"><h3><button data-faq-button type="button">What rate and charges apply?</button></h3><div class="faq-panel"><p>The repository does not contain an owner-approved ${escapeHtml(name)} schedule. Staff will confirm the current terms during appraisal.</p></div></div><div class="faq-item"><h3><button data-faq-button type="button">Is approval guaranteed?</button></h3><div class="faq-panel"><p>No. Approval depends on the cooperative appraisal and current eligibility rules.</p></div></div></section>
  </article><aside class="terms-panel"><h2>Terms to confirm before accepting</h2>${termsList(['Approved amount and intended use', 'Interest basis and rate', 'Every fee or charge', 'Compulsory savings, where applicable', 'Tenor and repayment frequency', 'Eligibility, guarantor and security requirements'])}<p class="alert alert-info">No repayment calculator is published until the approved product formula is available.</p></aside></div></section>${approvedCta}`;
  await writeRoute(route, { title: `${name} | Responsible Credit from Nobles Cooperative`, description: `Learn the responsible appraisal process for ${name} and confirm current terms with Nobles Cooperative staff.`, content, structuredData: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name, brand: { '@type': 'Organization', name: site.brand }, url: `${site.website}${route}` }).replace(/</g, '\\u003c')}</script>` });
}
const trustItems = [
  `${site.facts.appDownloads} Nobles Vault Downloads`,
  `Reg. No. ${site.registration} — Anambra State`,
  `Awka Headquarters — Physical Help Desk`,
  `${site.facts.founderExperience} Years of Founder Experience`,
  `Join with a ${site.facts.lifetimeShare} Lifetime Cooperative Share`,
  "Women-First Cooperative",
  "Responsible Cooperative Credit",
  "No Woman Is Left Behind"
];
function trustSet(hidden = false) {
  const accessibility = hidden ? ' aria-hidden="true"' : "";
  return `<div class="ledger-set"${accessibility}>${trustItems.map((item) => `<span class="ledger-item"><span class="ledger-diamond" aria-hidden="true">&#9670;</span>${escapeHtml(item)}</span>`).join("")}</div>`;
}
const trustTicker = `<section class="ledger-tape" aria-label="Cooperative trust highlights"><div class="ledger-track">${trustSet()}${trustSet(true)}</div></section>`;
const homeContent = `<section class="inner-hero"><div class="container"><p class="eyebrow">Women-first cooperative — Reg. ${site.registration}</p><h1>Save with discipline. Borrow responsibly. Grow with support.</h1><p>Nobles Cooperative helps women build practical financial habits through savings, responsible credit, business growth support and financial education.</p><div class="hero-actions"><a class="btn btn-primary" href="${site.googlePlay}" rel="noopener noreferrer">Download Nobles Vault</a><a class="btn btn-outline" href="${site.whatsappUrl}" target="_blank" rel="noopener noreferrer">Get WhatsApp help</a></div></div></section>
${trustTicker}
<section class="section-pad"><div class="container"><div class="section-heading"><p class="eyebrow">Practical pathways</p><h2>Choose the support you need</h2><p>No woman is left behind.</p></div><div class="feature-grid">
${feature('Build a savings habit', 'Explore approved savings pathways for everyday discipline, education, future goals and household planning.')}
${feature('Borrow responsibly', 'Discuss a productive need through a product-specific cooperative appraisal—never a generic loan formula.')}
${feature('Get human support', 'Speak with staff through the official WhatsApp channel or visit the Nobles office in Awka.')}
</div></div></section>
<section class="section-pad"><div class="container content-grid"><article><div class="section-heading"><h2>How to get started</h2></div>${ordered(['Download Nobles Vault and register through the approved app channel.', 'Ask staff to confirm any product term that is not published as an approved figure.', 'Visit the Awka office for assisted enrolment where required.'])}</article><aside class="terms-panel"><h2>Official contact</h2><p>${escapeHtml(site.office)}</p><p><a href="mailto:${site.email}">${site.email}</a></p><p><a href="tel:${site.customerTelephone}">${site.phones[0]}</a></p><p>Cooperative registration: ${site.registration}</p></aside></div></section>${approvedCta}`;
await writeRoute(site.routes.home, { title: 'Nobles Cooperative | Savings, Responsible Credit and Support', description: 'Nobles Cooperative supports women through disciplined savings, responsible credit, business growth and financial education in Awka.', content: homeContent, structuredData: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: site.brand, url: site.website, email: site.email, telephone: site.customerTelephone, address: site.office }).replace(/</g, '\\u003c')}</script>` });
const institutionalPages = [
  [site.routes.mission, 'Mission, Vision and Values', 'The purpose and principles that guide Nobles Cooperative.', [['Our mission', '<p>To support women with disciplined savings, responsible credit, business growth and practical financial education.</p>'], ['Our vision', '<p>A community where women can pursue financial goals with knowledge, structure and dependable human support.</p>'], ['Our values', `<div class="feature-grid">${feature('Discipline', 'We encourage consistent, realistic financial habits.')}${feature('Responsibility', 'Credit decisions must respect affordability and cooperative appraisal.')}${feature('Care', 'We provide practical support so no woman is left behind.')}${feature('Integrity', 'We publish only approved terms and protect member information.')}</div>`]]],
  [site.routes.ourStory, 'Our Story', 'Why Nobles Cooperative exists and how it supports women in practical ways.', [['Our purpose', '<p>Nobles Cooperative is a women-first cooperative built around savings discipline, responsible credit, business growth and financial education.</p>'], ['How we work', '<p>Members can use Nobles Vault, receive staff assistance through the official WhatsApp channel, and complete office enrolment where required.</p>'], ['What remains constant', '<p>Clear terms, cooperative appraisal, careful records and physical human support in Awka guide every approved pathway.</p>']]],
  // TODO: OWNER-APPROVED FOUNDER STORY — publish no biography beyond the verified identity and experience below.
  [site.routes.founderStory, 'Founder’s Story', 'Meet Chinelo Ekwonu, founder of Nobles Cooperative, with 16+ years of founder experience.', [['Verified introduction', '<p>Chinelo Ekwonu is the founder of Nobles Cooperative and has 16+ years of founder experience.</p>'], ['Content status', '<p>A fuller biography, qualifications and chronology require an owner-approved founder-story source before publication.</p>'], ['What we can confirm', '<p>The public mission remains focused on disciplined savings, responsible credit, business growth and financial education for women.</p>']]],
  [site.routes.investors, 'Investors', 'A careful route for organisations exploring an approved relationship with Nobles Cooperative.', [['Purpose', '<p>Nobles welcomes structured conversations that respect its cooperative identity, member interests and governance requirements.</p>'], ['Due diligence', '<p>No return, partner name or investment opportunity is represented as approved on this page. Any proposal requires formal review and documentation.</p>'], ['Next step', `<p><a href="${site.routes.partnerEnquiry}">Send a partnership enquiry</a> or contact the Awka office.</p>`]]],
  [site.routes.legacybuilders, 'LegacyBuilders', 'Learn how to request the current approved LegacyBuilders explanation.', [['Current status', '<p>The detailed LegacyBuilders structure is not available in the owner-approved repository source.</p>'], ['Before committing', '<p>Ask staff for the current written purpose, eligibility, contribution, benefit, risk and exit terms. Do not rely on informal or old descriptions.</p>']]],
  [site.routes.vault, 'Nobles Vault', 'The member-facing digital channel for registration and approved account services.', [['Get the app', `<p><a href="${site.googlePlay}" rel="noopener noreferrer">Download Nobles Vault from Google Play</a>. The official package is <code>com.myminervahub.nobles_vault</code>.</p>`], ['Need assistance?', `<p>Use <a href="${site.routes.vaultSupport}">Vault setup support</a>, WhatsApp staff support, or office enrolment. Never share a password or OTP.</p>`]]],
  [site.routes.partners, 'Partners', 'Explore a responsible institutional relationship with Nobles Cooperative.', [['Partnership principles', '<p>Proposals should support women, protect member interests, use clear governance and avoid guaranteed-return claims.</p>'], ['Process', ordered(['Submit a concise enquiry without confidential information.', 'Nobles reviews strategic and compliance fit.', 'Approved parties complete due diligence and written documentation.'])], ['Public claims', '<p>No partner names are published without written approval.</p>']]],
  [site.routes.partnerEnquiry, 'Partner Enquiry', 'Start a partnership conversation using an official Nobles contact channel.', [['Before you contact us', '<p>Share only your name, organisation, contact details and a concise proposal summary. Do not send banking credentials, member data or confidential records.</p>'], ['Official channels', `<p>Email <a href="mailto:${site.email}?subject=Partner%20enquiry">${site.email}</a>, use <a href="${site.whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp</a>, or visit ${escapeHtml(site.office)}.</p>`]]]
];
for (const [route, heading, lede, sections] of institutionalPages) {
  await writeRoute(route, { title: `${heading} | Nobles Cooperative`, description: lede, content: contentPage(heading, lede, sections, 'About Nobles') });
}
const contactCards = `<div class="feature-grid">${feature('Call', site.phones[0])}${feature('Email', site.email)}${feature('Visit', site.office)}${feature('WhatsApp', site.phones[0])}</div>`;
await writeRoute(site.routes.contact, { title: 'Contact Nobles Cooperative | Awka Office and Support', description: 'Contact Nobles Cooperative by phone, email, WhatsApp or at the official office in Awka.', content: `${hero('Contact Nobles Cooperative', 'Use an official channel for membership, product or support questions.', 'Contact') }<section class="section-pad"><div class="container prose">${contactCards}<section><div class="section-heading"><h2>Official channels</h2></div><p><a href="tel:${site.customerTelephone}">${site.phones[0]}</a></p><p><a href="mailto:${site.email}">${site.email}</a></p><p><a href="${site.whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp staff support</a></p><address>${escapeHtml(site.office)}</address></section><section class="alert alert-info"><h2>Protect your information</h2><p>Never send a password, OTP, BVN, NIN, card detail, bank credential or account password through an ordinary website message.</p></section></div></section>${approvedCta}` });

await writeRoute(site.routes.gallery, { title: 'Gallery | Nobles Cooperative', description: 'Approved Nobles Cooperative community and programme media.', content: `${hero('Gallery', 'Approved community and programme media will appear here.', 'Community')}<section class="section-pad"><div class="container"><div class="empty-state"><h2>No approved gallery items yet</h2><p>Media will be published after consent, description and content approval are recorded.</p></div></div></section>${approvedCta}` });

const faqItems = [
  ['What is Nobles?', 'Nobles is a women-first cooperative focused on disciplined savings, responsible credit, business growth and financial education.'],
  ['How do I register?', 'Download Nobles Vault, ask staff on the official WhatsApp channel, or visit the Awka office for assisted enrolment.'],
  ['Are loan approvals automatic?', 'No. Final approval follows product-specific cooperative appraisal.'],
  ['How do I confirm a product rate?', 'Use Nobles Vault or an official staff channel. The website does not guess figures that lack owner approval.'],
  ['Should I send my password or OTP?', 'No. Nobles will not ask you to submit passwords, OTPs, BVNs, NINs or banking credentials through an ordinary public form.']
];
const faqMarkup = faqItems.map(([question, answer]) => `<div class="faq-item"><h3><button data-faq-button type="button">${escapeHtml(question)}</button></h3><div class="faq-panel"><p>${escapeHtml(answer)}</p></div></div>`).join('');
await writeRoute(site.routes.faq, { title: 'Frequently Asked Questions | Nobles Cooperative', description: 'Answers about Nobles Cooperative membership, savings, responsible credit, support and information safety.', content: `${hero('Frequently Asked Questions', 'Clear answers and safe next steps for members and prospective members.', 'Support')}<section class="section-pad"><div class="container faq-list">${faqMarkup}</div></section>${approvedCta}`, structuredData: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) }).replace(/</g, '\\u003c')}</script>` });

const supportPages = [
  [site.routes.rules, 'Rules and Guidelines', 'Practical principles for using Nobles products responsibly.', [['Use official channels', '<p>Register through Nobles Vault or receive assistance from official staff channels.</p>'], ['Confirm terms', '<p>Review the approved product schedule, charges, access rules and due dates before committing.</p>'], ['Protect your account', '<p>Keep passwords and OTPs private. Do not submit BVN, NIN, card details or banking credentials through ordinary website messages.</p>'], ['Borrow responsibly', '<p>Credit is subject to appraisal. Borrow only what your real cash flow can support.</p>']]],
  [site.routes.vaultSupport, 'Vault Setup Support', 'Safe help for registering and using the Nobles Vault app.', [['Start safely', `<p>Install the app only from the <a href="${site.googlePlay}" rel="noopener noreferrer">official Google Play listing</a>.</p>`], ['Get staff help', `<p>Contact <a href="${site.whatsappUrl}" target="_blank" rel="noopener noreferrer">official WhatsApp support</a> or visit the Awka office.</p>`], ['Never share', '<p>Do not share your password or OTP. Staff can guide you without asking for those secrets.</p>']]],
  [site.routes.complaints, 'Complaints and Support', 'Report a concern through an official, privacy-conscious support channel.', [['What to include', '<p>Provide your name, a safe callback detail, the product or service involved, the date and a concise description. Do not send sensitive credentials.</p>'], ['Submit securely', `<p>Email <a href="mailto:${site.email}?subject=Complaint%20or%20support%20request">${site.email}</a>, contact <a href="${site.whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp support</a>, call the office, or visit in person.</p>`], ['What happens next', '<p>Staff will acknowledge the concern and explain the next step. A public ticket form and reference-number workflow require approved backend infrastructure and are not simulated on this static page.</p>']]]
];
for (const [route, heading, lede, sections] of supportPages) await writeRoute(route, { title: `${heading} | Nobles Cooperative`, description: lede, content: contentPage(heading, lede, sections, 'Support') });

const resourcePages = [
  [site.routes.blog, 'Blog', 'Approved Nobles news and practical cooperative updates.', 'No approved blog articles are published yet.'],
  [site.routes.education, 'Financial Education', 'Plain-English guidance for savings discipline, responsible borrowing and business planning.', 'Approved financial education articles will be published here. Until then, speak with staff before making a product decision.']
];
for (const [route, heading, lede, empty] of resourcePages) await writeRoute(route, { title: `${heading} | Nobles Cooperative`, description: lede, content: `${hero(heading, lede, 'Resources')}<section class="section-pad"><div class="container"><div class="empty-state"><h2>Content in preparation</h2><p>${escapeHtml(empty)}</p></div></div></section>${approvedCta}` });

for (const route of [site.routes.admin, site.routes.staff, site.routes.staffLogin]) {
  const heading = route === site.routes.admin ? 'Admin portal' : route === site.routes.staffLogin ? 'Staff sign in' : 'Staff portal';
  const content = `${hero(heading, 'Protected operational access is not available in this static deployment.', 'Private area')}<section class="section-pad"><div class="container"><div class="alert alert-info"><h2>Secure configuration required</h2><p>This route is intentionally disabled until owner-approved Supabase roles, Row Level Security policies, migrations and environment configuration are available. Contact the system administrator through a trusted internal channel.</p></div></div></section>`;
  await writeRoute(route, { title: `${heading} | Nobles Cooperative`, description: 'Private Nobles Cooperative operational route.', content, noindex: true });
}
const sitemapRoutes = [...new Set(Object.entries(site.routes).filter(([key]) => !['admin', 'staff', 'staffLogin'].includes(key)).map(([, route]) => route))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${site.website}${route}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(output, "sitemap.xml"), sitemap);
await writeFile(path.join(output, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: ${site.routes.admin}\nDisallow: ${site.routes.staff}\nSitemap: ${site.website}/sitemap.xml\n`);

const shared = {
  description: "Internal visual fixture for the Nobles static page system.",
  structuredData: "",
  googlePlay: site.googlePlay,
  whatsapp: site.whatsapp,
  canonical: "https://noblescreditandloans.com/",
  eyebrow: "Internal fixture",
  heading: "Template verification",
  lede: "This page contains clearly labelled internal sample content.",
  audience: "For internal design and accessibility checks only.",
  problem: "Internal example problem.",
  works: "<ol class=\"steps\"><li class=\"step\">Internal example.</li></ol>",
  notice: "Internal example notice.",
  related: "<a href=\"/contact/\">Internal related link</a>",
  body: "<p>Internal fixture content. Not approved for public release.</p>",
  features: "<article class=\"feature-card\"><h3>Feature card</h3><p>Internal example.</p></article>",
  items: "<article class=\"feature-card\"><h2>Resource item</h2><p>Internal example.</p></article>",
  steps: "<ol class=\"steps\"><li class=\"step\"><span class=\"step-number\">1</span><div><h3>First step</h3><p>Internal example.</p></div></li></ol>",
  terms: "<dl><dt>Example term</dt><dd>Owner approval required.</dd></dl>",
  faq: "<div class=\"faq-item\"><button data-faq-button type=\"button\">Example question</button><div class=\"faq-panel\"><p>Internal example answer.</p></div></div>",
  cta: "<section class=\"cta-band\"><h2>Take the next step</h2><a class=\"btn btn-secondary\" href=\"/contact/\">Contact Nobles</a></section>",
  fields: "<label class=\"form-field\">Full name<input name=\"name\" autocomplete=\"name\" required></label><label class=\"form-field\">Email<input type=\"email\" name=\"email\" autocomplete=\"email\" required></label>",
  action: "/",
  category: "Education",
  date: "18 July 2026",
  listingRoute: "/blog/",
  navigation: "<nav aria-label=\"Portal\"><a href=\"/\">Return to website</a></nav>",
  content: "<h1>Portal shell fixture</h1><div class=\"empty-state\"><h2>No records</h2><p>Internal example.</p></div>"
};
const fixtures = ["product", "institutional", "partner", "resource-listing", "resource-detail", "public-form", "login", "portal"];
for (const name of fixtures) {
  const template = await readFile(path.join(root, `src/templates/${name}.html`), "utf8");
  const content = render(template, shared);
  const html = name === "portal" || name === "login" ? `<!doctype html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Internal ${name} fixture</title><link rel=\"stylesheet\" href=\"../../../asset/css/styles.css\"><link rel=\"stylesheet\" href=\"../../../asset/css/components.css\"></head><body>${content}</body></html>` : render(base, { ...shared, title: `Internal ${name} fixture`, header, footer, content });
  await writeFile(path.join(fixturesOutput, `${name}.html`), html);
}

console.log(`Built ${savingsProducts.length} savings product pages, mapped existing complete pages, and ${fixtures.length} internal fixtures.`);






