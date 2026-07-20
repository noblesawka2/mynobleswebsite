import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../dist");
const types = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".png": "image/png" };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    let target = path.join(root, decodeURIComponent(url.pathname));
    if ((await stat(target).catch(() => null))?.isDirectory()) target = path.join(target, "index.html");
    if (!path.extname(target)) target = path.join(target, "index.html");
    const resolved = path.resolve(target);
    if (!resolved.startsWith(root + path.sep)) throw new Error("Unsafe path");
    const body = await readFile(resolved);
    response.writeHead(200, { "Content-Type": types[path.extname(resolved)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });

try {
  for (const width of [320, 375, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin, { waitUntil: "networkidle" });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) throw new Error(`${width}px has ${overflow}px horizontal overflow`);
    const tickerHeight = await page.locator(".ledger-tape").evaluate((element) => element.getBoundingClientRect().height);
    if (tickerHeight > 180) throw new Error(`${width}px ticker is excessively tall (${tickerHeight}px)`);
    if (await page.locator('.ledger-set[aria-hidden="true"]').count() !== 1) throw new Error(`${width}px ticker duplicate is not hidden semantically`);
    if (!(await page.locator("body").innerText()).includes("₦1,000")) throw new Error(`${width}px Naira sign is missing`);

    if (width < 1024) {
      await page.locator("#navToggle").click();
      const arrows = await page.locator(".mm-arrow").allTextContents();
      if (arrows.some((arrow) => arrow.trim() !== "▾")) throw new Error(`${width}px mobile dropdown arrow is corrupt`);
      await page.keyboard.press("Escape");
    } else {
      const arrows = await page.locator(".dropdown-arrow").allTextContents();
      if (arrows.some((arrow) => arrow.trim() !== "▾")) throw new Error(`${width}px desktop dropdown arrow is corrupt`);
    }
    if (errors.length) throw new Error(`${width}px console errors: ${errors.join(" | ")}`);
    await page.close();
  }

  const reduced = await browser.newPage({ viewport: { width: 375, height: 900 }, reducedMotion: "reduce" });
  await reduced.goto(origin, { waitUntil: "networkidle" });
  const reducedState = await reduced.evaluate(() => {
    const track = document.querySelector(".ledger-track");
    const duplicate = document.querySelector('.ledger-set[aria-hidden="true"]');
    return { animation: getComputedStyle(track).animationName, duplicate: getComputedStyle(duplicate).display };
  });
  if (reducedState.animation !== "none" || reducedState.duplicate !== "none") throw new Error("Reduced-motion ticker is not one clean static set");
  await reduced.close();
  console.log("Browser production checks passed at 320, 375, 768, 1024, 1280 and 1440px, including reduced motion.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
