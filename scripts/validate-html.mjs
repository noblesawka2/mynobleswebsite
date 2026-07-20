import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
async function files(directory) { return (await readdir(directory, { withFileTypes: true })).flatMap((entry) => entry.isDirectory() ? [] : [path.join(directory, entry.name)]); }
async function walk(directory) { const entries = await readdir(directory, { withFileTypes: true }); const result = []; for (const entry of entries) { const target = path.join(directory, entry.name); if (entry.isDirectory()) result.push(...await walk(target)); else if (target.endsWith(".html")) result.push(target); } return result; }
const errors = [];
for (const file of await walk(root)) {
  if (file.endsWith(path.join("admin", "index.html"))) continue;
  const html = await readFile(file, "utf8");
  const mains = (html.match(/<main\b/gi) || []).length;
  const h1s = (html.match(/<h1\b/gi) || []).length;
  if (mains !== 1) errors.push(`${file}: expected one main, found ${mains}`);
  if (h1s !== 1) errors.push(`${file}: expected one h1, found ${h1s}`);
  if (/href=["']#["']/i.test(html)) errors.push(`${file}: permanent href=\"#\"`);
  if (/data:image\/png;base64,__ICON|wa\.me\/23491(?:["'])/i.test(html)) errors.push(`${file}: unresolved placeholder`);
  if (/<nav[^>]*>\s*<li\b/i.test(html)) errors.push(`${file}: list item directly inside nav`);
  if ((html.match(/rel=["']icon["']/gi) || []).length > 1) errors.push(`${file}: duplicate favicon`);
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; } else console.log("HTML structural validation passed.");


