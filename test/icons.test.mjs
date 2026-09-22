import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const htmlFiles = execFileSync('git', ['ls-files', '--', '*.html'], { encoding: 'utf8' })
  .trim().split(/\r?\n/).filter(Boolean);
const bundle = readFileSync('asset/js/lucide.min.js', 'utf8');
const lucideContext = {};
runInNewContext(bundle, lucideContext);
const availableIcons = new Set(Object.keys(lucideContext.lucide.icons));

function toPascalCase(name) {
  return name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
}

test('every declared Lucide icon exists in the locally hosted bundle', () => {
  let checked = 0;
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    if (!html.includes('data-lucide=')) continue;
    assert.match(html, /<script src="\/asset\/js\/lucide\.min\.js"><\/script>/, file);
    assert.match(html, /<script src="\/asset\/js\/lucide-icons\.js"><\/script>/, file);
    for (const match of html.matchAll(/data-lucide="([^"]+)"/g)) {
      assert.ok(availableIcons.has(toPascalCase(match[1])), `${file}: unknown icon ${match[1]}`);
      checked++;
    }
  }
  assert.ok(checked > 900, `Expected to inspect the site's icons; found ${checked}`);
});

test('icon-only links and buttons have accessible labels', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
      if (!match[3].includes('data-lucide=')) continue;
      const visibleText = match[3].replace(/<[^>]+>/g, '').replace(/&[a-z]+;|&#\d+;/g, '').trim();
      assert.ok(visibleText || /\b(?:aria-label|title)=/.test(match[2]),
        `${file}: icon-only ${match[1]} has no label`);
    }
  }
});

test('local images exist and every image has alt text', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(match[0], /\balt\s*=/, `${file}: image has no alt text`);
      const src = match[0].match(/\bsrc\s*=\s*["']([^"']+)["']/)?.[1];
      if (!src || /^(?:https?:|data:|\/\/|\$|\{)/.test(src)) continue;
      const asset = decodeURIComponent(src.split(/[?#]/)[0]);
      const localPath = asset.startsWith('/') ? `.${asset}` : join(dirname(file), asset);
      assert.ok(existsSync(localPath), `${file}: missing image ${src}`);
    }
  }
});

test('icons inserted after page load are rendered', () => {
  let renders = 0;
  let onMutations;
  const context = {
    window: {
      lucide: { createIcons: () => { renders++; } },
      requestAnimationFrame: callback => callback()
    },
    document: { readyState: 'complete', documentElement: {} },
    MutationObserver: class {
      constructor(callback) { onMutations = callback; }
      observe() {}
    }
  };
  runInNewContext(readFileSync('asset/js/lucide-icons.js', 'utf8'), context);
  assert.equal(renders, 1);
  onMutations([{ addedNodes: [{ nodeType: 1, matches: () => true }] }]);
  assert.equal(renders, 2);
});
