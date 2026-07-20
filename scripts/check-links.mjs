import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
const site = JSON.parse(await readFile("src/data/site.json", "utf8"));
const approved = new Set(Object.values(site.routes));
async function walk(directory) { const entries = await readdir(directory, { withFileTypes: true }); const result = []; for (const entry of entries) { const target = path.join(directory, entry.name); if (entry.isDirectory()) result.push(...await walk(target)); else if (target.endsWith(".html")) result.push(target); } return result; }
const errors = [];
for (const file of await walk("dist")) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = match[1];
    if (href === "#") errors.push(`${file}: placeholder link`);
    if (href.startsWith("/") && !href.startsWith("/asset/") && !href.includes("#") && !approved.has(href)) errors.push(`${file}: non-canonical internal link ${href}`);
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; } else console.log("Canonical link check passed.");
