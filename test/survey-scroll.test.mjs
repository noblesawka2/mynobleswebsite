import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const homepage = readFileSync('index.html', 'utf8');
const scrollTrigger = homepage.match(/function maybeAutoOpenOnScroll\(\) \{[\s\S]*?\n            \}/)?.[0];

test('visitor enquiry waits for scrolling rather than a page-load timer', () => {
  assert.ok(scrollTrigger, 'Scroll trigger should exist');
  assert.match(homepage, /window\.addEventListener\("scroll", maybeAutoOpenOnScroll, \{ passive: true \}\)/);
  assert.doesNotMatch(homepage, /setTimeout\(function \(\) \{ openModal\(false\); \}, 4500\)/);
});

test('visitor enquiry opens only after 200px when reminder rules allow it', () => {
  let opens = 0;
  let removals = 0;
  let allowed = true;
  const modal = { hidden: true };
  const window = { scrollY: 0, pageYOffset: 0, removeEventListener: () => { removals++; } };
  const context = {
    window, modal,
    shouldAutoOpen: () => allowed,
    openModal: () => { opens++; }
  };
  runInNewContext(scrollTrigger, context);

  context.maybeAutoOpenOnScroll();
  window.scrollY = 199;
  context.maybeAutoOpenOnScroll();
  assert.equal(opens, 0);
  assert.equal(removals, 0);

  window.scrollY = 200;
  allowed = false;
  context.maybeAutoOpenOnScroll();
  assert.equal(opens, 0);

  allowed = true;
  modal.hidden = false;
  context.maybeAutoOpenOnScroll();
  assert.equal(opens, 0);

  modal.hidden = true;
  context.maybeAutoOpenOnScroll();
  assert.equal(opens, 1);
});
