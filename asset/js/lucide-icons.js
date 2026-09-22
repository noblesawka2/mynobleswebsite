/* Keep icons rendered when page content is added after the initial load. */
(function () {
  'use strict';

  let scheduled = false;
  function renderIcons() {
    scheduled = false;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(renderIcons);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleRender, { once: true });
  } else {
    scheduleRender();
  }

  const observer = new MutationObserver(function (mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches('i[data-lucide]') || node.querySelector('i[data-lucide]')) {
          scheduleRender();
          return;
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
