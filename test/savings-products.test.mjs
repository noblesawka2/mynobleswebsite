import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const products = JSON.parse(await readFile("src/data/savings-products.json", "utf8"));
const site = JSON.parse(await readFile("src/data/site.json", "utf8"));

test("all seven savings routes are generated", async () => {
  assert.equal(products.length, 7);
  for (const product of products) await access(path.join("dist", product.slug, "index.html"));
});

test("every savings page has metadata, accessible structure and approved CTAs", async () => {
  for (const product of products) {
    const html = await readFile(path.join("dist", product.slug, "index.html"), "utf8");
    assert.equal((html.match(/<h1\b/g) || []).length, 1, product.slug);
    assert.match(html, new RegExp(`<link rel="canonical" href="${site.website.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /application\/ld\+json/);
    assert.match(html, new RegExp(site.googlePlay.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(`https://wa.me/${site.whatsapp}`));
    assert.match(html, /data-faq-button/);
    assert.doesNotMatch(html, /href=["']#["']/);
    assert.doesNotMatch(html, /TODO: CONTENT APPROVAL/);
  }
});

test("Gold Vault uses only the approved current figure", async () => {
  const html = await readFile("dist/goldvault/index.html", "utf8");
  assert.match(html, /14\.4% per annum/i);
  assert.match(html, /12 months/i);
  assert.doesNotMatch(html, /12\s*[–-]\s*15%|12%\s*[–-]\s*15%/i);
});

test("Future Fund remains distinct from Monthly Savings Challenge", async () => {
  const future = await readFile("dist/futurefund/index.html", "utf8");
  const challenge = await readFile("dist/monthlysavingschallenge/index.html", "utf8");
  assert.match(future, /tenor-based/i);
  assert.match(challenge, /separate tenor-based product/i);
});

test("all unavailable product facts have approval records", () => {
  products.forEach((product) => assert.ok(product.approvalTodos.length > 0, product.slug));
});
