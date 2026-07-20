import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".txt", ".xml"]);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (textExtensions.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

test("repository text contains no known encoding corruption", async () => {
  const suspicious = [
    String.fromCodePoint(0x00e2),
    String.fromCodePoint(0x00c2),
    String.fromCodePoint(0x00c3),
    String.fromCodePoint(0xfffd),
    String.fromCodePoint(0x00a6)
  ];
  for (const file of await walk(root)) {
    const text = await readFile(file, "utf8");
    for (const sequence of suspicious) {
      assert.equal(text.includes(sequence), false, `${path.relative(root, file)} contains suspicious character U+${sequence.codePointAt(0).toString(16).toUpperCase()}`);
    }
  }
});

test("every HTML document declares UTF-8 near the start of head", async () => {
  for (const file of (await walk(root)).filter((file) => file.endsWith(".html"))) {
    const html = await readFile(file, "utf8");
    if (!/<(?:!doctype\s+html|html|head)\b/i.test(html)) continue;
    const head = html.match(/<head[^>]*>([\s\S]{0,500})/i)?.[1] ?? "";
    assert.match(head, /<meta\s+charset=["']UTF-8["']/i, path.relative(root, file));
  }
});

test("production ticker has approved facts and one hidden duplicate", async () => {
  const html = await readFile(path.join(root, "dist/index.html"), "utf8");
  const approved = [
    "9,000+ Nobles Vault Downloads",
    "Reg. No. AN 17915 — Anambra State",
    "Awka Headquarters — Physical Help Desk",
    "16+ Years of Founder Experience",
    "Join with a ₦1,000 Lifetime Cooperative Share",
    "Women-First Cooperative",
    "Responsible Cooperative Credit",
    "No Woman Is Left Behind"
  ];
  for (const fact of approved) assert.equal(html.split(fact).length - 1, 2, fact);
  assert.equal((html.match(/class="ledger-set"/g) ?? []).length, 2);
  assert.equal((html.match(/class="ledger-set" aria-hidden="true"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /1,078\+? Active Members|Zero Exploitative Loan Apps/i);
});

test("shared navigation uses reliable dropdown entities", async () => {
  const header = await readFile(path.join(root, "src/templates/partials/header.html"), "utf8");
  assert.equal((header.match(/&#9662;/g) ?? []).length, 8);
  const html = await readFile(path.join(root, "dist/index.html"), "utf8");
  assert.doesNotMatch(html, /class="(?:dropdown-arrow|mm-arrow)"[^>]*>[^<]*\?/);
});

test("central approved facts and hosting UTF-8 headers are configured", async () => {
  const site = JSON.parse(await readFile(path.join(root, "src/data/site.json"), "utf8"));
  assert.equal(site.facts.founderExperience, "16+");
  assert.equal(site.facts.appDownloads, "9,000+");
  assert.equal(site.facts.lifetimeShare, "₦1,000");
  assert.equal(site.customerTelephone, "+2349151142355");
  assert.equal(site.whatsappUrl, "https://wa.me/2349151142355");
  assert.equal(site.registration, "AN 17915");
  const vercel = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
  assert.ok(vercel.headers.some((rule) => rule.headers.some((header) => /charset=utf-8/i.test(header.value))));
});

test("Gold Vault has one approved current figure", async () => {
  const files = await walk(root);
  for (const file of files) {
    const text = await readFile(file, "utf8");
    assert.doesNotMatch(text, /12\s*(?:%\s*)?[–—-]\s*15%|12\.5%/i, path.relative(root, file));
  }
  const html = await readFile(path.join(root, "dist/goldvault/index.html"), "utf8");
  assert.match(html, /14\.4% per annum/);
});
