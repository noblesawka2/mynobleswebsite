import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const site = JSON.parse(await readFile("src/data/site.json", "utf8"));
const privateKeys = new Set(["admin", "staff", "staffLogin"]);
function outputFile(route) {
  return route === "/" ? path.join("dist", "index.html") : path.join("dist", route.replace(/^\//, ""), "index.html");
}

test("every canonical route has a production document", async () => {
  for (const route of Object.values(site.routes)) await access(outputFile(route));
});

test("canonical documents have metadata, landmarks, shared behavior and no placeholders", async () => {
  for (const [key, route] of Object.entries(site.routes)) {
    const html = await readFile(outputFile(route), "utf8");
    assert.equal((html.match(/<main\b/gi) || []).length, 1, route);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, route);
    assert.match(html, new RegExp(`<link rel="canonical" href="${site.website.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`), route);
    assert.match(html, /<meta property="og:image"/, route);
    assert.match(html, /\/asset\/js\/navigation\.js/, route);
    assert.doesNotMatch(html, /href=["']#["']/i, route);
    if (privateKeys.has(key)) assert.match(html, /name="robots" content="noindex,nofollow"/, route);
  }
});

test("public output excludes known unapproved legacy claims", async () => {
  const forbidden = [
    /1,078\+?\s+Active Members/i,
    /16\+?\s+Years Founder/i,
    /Bank-level security/i,
    /Dr\. Chika Onyema/i,
    /info@noblescooperative\.com/i,
    /No\. 5 Awka Road/i,
    /Become a Member \([^)]*1,000/i
  ];
  for (const [key, route] of Object.entries(site.routes)) {
    if (privateKeys.has(key)) continue;
    const html = await readFile(outputFile(route), "utf8");
    for (const pattern of forbidden) assert.doesNotMatch(html, pattern, `${route}: ${pattern}`);
  }
});

test("sitemap contains all and only canonical public routes", async () => {
  const sitemap = await readFile("dist/sitemap.xml", "utf8");
  for (const [key, route] of Object.entries(site.routes)) {
    const present = sitemap.includes(`<loc>${site.website}${route}</loc>`);
    assert.equal(present, !privateKeys.has(key), route);
  }
});

test("robots excludes operational routes", async () => {
  const robots = await readFile("dist/robots.txt", "utf8");
  assert.match(robots, /Disallow: \/admin\//);
  assert.match(robots, /Disallow: \/staff\//);
  assert.match(robots, /Sitemap: https:\/\/noblescreditandloans\.com\/sitemap\.xml/);
});
