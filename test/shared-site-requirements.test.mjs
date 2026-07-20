import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(target));
    else if (target.endsWith(".html")) files.push(target);
  }
  return files;
}

test("the only public customer phone is the approved E.164 number", async () => {
  const config = JSON.parse(await readFile("src/data/site.json", "utf8"));
  assert.deepEqual(config.phones, ["+234 915 114 2355"]);
  assert.equal(config.customerTelephone, "+2349151142355");
  assert.equal(config.whatsappUrl, "https://wa.me/2349151142355");
  for (const file of await htmlFiles("dist")) {
    const html = await readFile(file, "utf8");
    const phoneLinks = [...html.matchAll(/tel:([^"']+)/g)].map((match) => match[1]);
    assert.ok(phoneLinks.every((phone) => phone === "+2349151142355"), file);
    const whatsappLinks = [...html.matchAll(/https:\/\/wa\.me\/([^"']+)/g)].map((match) => match[1]);
    assert.ok(whatsappLinks.every((phone) => phone === "2349151142355"), file);
  }
});

test("every shared public navigation variant links to Staff Portal", async () => {
  const header = await readFile("src/templates/partials/header.html", "utf8");
  assert.match(header, /class="nav-cta"[\s\S]*?href="{{routes\.staff}}">Staff Portal/);
  assert.match(header, /class="mobile-menu-actions"[\s\S]*?href="{{routes\.staff}}">Staff Portal/);
  const footer = await readFile("src/templates/partials/footer.html", "utf8");
  assert.match(footer, /class="sticky-staff" href="{{routes\.staff}}">Staff Portal/);
  for (const file of (await htmlFiles("dist")).filter((file) => !file.includes(`${path.sep}admin${path.sep}`) && !file.includes(`${path.sep}staff${path.sep}`))) {
    const html = await readFile(file, "utf8");
    assert.ok((html.match(/href="\/staff\/">Staff Portal/g) ?? []).length >= 3, file);
  }
});

test("public output has no USSD or unapproved testimonial/founder copy", async () => {
  for (const file of await htmlFiles("dist")) {
    const html = await readFile(file, "utf8");
    assert.doesNotMatch(html, /\bUSSD\b|Dr\. Chika Onyema|Mrs\. Ifeoma N\.|Chioma O\., UNIZIK/i, file);
  }
  const founder = await readFile("dist/founder-story/index.html", "utf8");
  assert.match(founder, /Chinelo Ekwonu/);
  assert.match(founder, /16\+ years/);
});
