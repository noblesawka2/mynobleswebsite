import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const htmlFiles = execFileSync('git', ['ls-files', '--', '*.html'], { encoding: 'utf8' })
  .trim().split(/\r?\n/).filter(Boolean);

test('Blog and Gallery are visible in desktop and mobile Learn menus', () => {
  let menus = 0;
  for (const file of htmlFiles) {
    if (file.startsWith('admin/')) continue;
    const html = readFileSync(file, 'utf8');
    if (!html.includes('class="nav-links"')) continue;
    menus++;
    assert.ok(html.includes('<li><a href="/blog/">Blog</a></li><li><a href="/gallery/">Gallery</a></li>'),
      `${file}: desktop Learn menu is missing Blog or Gallery`);
    assert.ok(html.includes('<a href="/blog/">Blog</a><a href="/gallery/">Gallery</a>'),
      `${file}: mobile Learn menu is missing Blog or Gallery`);
    assert.ok(!html.includes('href="/blog/">Money &amp; Business</a>'),
      `${file}: blog still has its unclear menu label`);
  }
  assert.equal(menus, 25);
});
