// ============================================================
// 1. SHARED UI CODE (nav, mobile menu, scroll, hero, etc.)
// ============================================================
(function() {
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- Nav scroll state ---- */
  var nav = document.getElementById('siteNav');
  var backToTop = document.getElementById('backToTop');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-scrolled', y > 40);
    if (backToTop) backToTop.classList.toggle('is-visible', y > 700);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backToTop) {
    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');

  function closeMenu() {
    if (toggle) toggle.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (menu) menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  }

  function openMenu() {
    if (toggle) toggle.classList.add('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    if (menu) menu.classList.add('is-open');
    document.body.classList.add('menu-open');
  }
  if (toggle) {
    toggle.addEventListener('click', function() {
      if (menu && menu.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
  }
  var mmBack = document.getElementById('mobileMenuBack');
  if (mmBack) mmBack.addEventListener('click', closeMenu);
  document.querySelectorAll('[data-mm-link]').forEach(function(a) {
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---- Mobile accordion ---- */
  document.querySelectorAll('[data-mm-accordion]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var parent = this.closest('.mm-item');
      if (!parent) return;
      var sub = parent.querySelector('.mm-sublinks');
      if (!sub) return;
      var isOpen = sub.classList.contains('open');
      var allItems = parent.parentElement.querySelectorAll('.mm-item');
      allItems.forEach(function(item) {
        var s = item.querySelector('.mm-sublinks');
        var b = item.querySelector('.mm-link');
        if (s && s !== sub) s.classList.remove('open');
        if (b && b !== btn) b.classList.remove('open');
      });
      if (isOpen) {
        sub.classList.remove('open');
        btn.classList.remove('open');
      } else {
        sub.classList.add('open');
        btn.classList.add('open');
      }
    });
  });

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el) { io.observe(el); });
  } else {
    revealEls.forEach(function(el) { el.classList.add('is-visible'); });
  }

  /* ---- Count-up ---- */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
    var start = null, dur = 1500;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var val = Math.round(target * easeOutExpo(p));
      el.textContent = val.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('.count-up');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: .5 });
    counters.forEach(function(c) { cio.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---- Phone progress bars ---- */
  var bars = document.querySelectorAll('.phone-progress-fill');
  if ('IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.style.width = (reduceMotion ? el.getAttribute('data-progress') : el.getAttribute('data-progress')) + '%';
          pio.unobserve(el);
        }
      });
    }, { threshold: .4 });
    bars.forEach(function(b) { pio.observe(b); });
  }

  /* ---- Hero carousel ---- */
  (function() {
    var stage = document.getElementById('heroBgSlideshow');
    if (!stage) return;
    var slides = Array.prototype.slice.call(stage.querySelectorAll('.hero-bg-slide'));
    var captions = Array.prototype.slice.call(document.querySelectorAll('.hero-bg-caption-item'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-bg-dot'));
    var current = 0, timer = null;
    var AUTOPLAY_MS = 5500;

    function goTo(index) {
      var next = (index + slides.length) % slides.length;
      if (next === current) return;
      slides[current].classList.remove('is-active');
      if (captions[current]) captions[current].classList.remove('is-active');
      if (dots[current]) dots[current].classList.remove('is-active');
      current = next;
      slides[current].classList.add('is-active');
      if (captions[current]) captions[current].classList.add('is-active');
      if (dots[current]) dots[current].classList.add('is-active');
    }
    function stepNext() { goTo(current + 1); }
    function startAutoplay() {
      stopAutoplay();
      if (reduceMotion) return;
      timer = setInterval(stepNext, AUTOPLAY_MS);
    }
    function stopAutoplay() { if (timer) { clearInterval(timer); timer = null; } }
    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        goTo(parseInt(dot.getAttribute('data-bgdot'), 10) || 0);
        startAutoplay();
      });
    });
    var heroEl = document.querySelector('.hero');
    if (heroEl) {
      heroEl.addEventListener('mouseenter', stopAutoplay);
      heroEl.addEventListener('mouseleave', startAutoplay);
    }
    startAutoplay();
  })();

  /* ---- Hero cursor spotlight ---- */
  var hero = document.querySelector('.hero');
  if (hero && canHover && !reduceMotion) {
    hero.addEventListener('mousemove', function(e) {
      var r = hero.getBoundingClientRect();
      var mx = ((e.clientX - r.left) / r.width) * 100;
      var my = ((e.clientY - r.top) / r.height) * 100;
      hero.style.setProperty('--mx', mx + '%');
      hero.style.setProperty('--my', my + '%');
    });
  }

  /* ---- Magnetic buttons ---- */
  if (canHover && !reduceMotion) {
    document.querySelectorAll('.btn-magnetic').forEach(function(btn) {
      var inner = btn.querySelector('span');
      btn.addEventListener('mousemove', function(e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .28;
        var y = (e.clientY - r.top - r.height / 2) * .5;
        if (inner) inner.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      btn.addEventListener('mouseleave', function() {
        if (inner) inner.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---- 3D tilt on goal cards ---- */
  if (canHover && !reduceMotion) {
    document.querySelectorAll('.goal-card').forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        card.style.transform = 'rotateX(' + (-py * 8) + 'deg) rotateY(' + (px * 8) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function() { card.style.transform = ''; });
    });
  }
})();


// ============================================================
// 2. SUPABASE + GALLERY LOGIC (exposed globally)
// ============================================================

// ---- Supabase config (replace with YOUR credentials) ----
const SUPABASE_URL = 'https://zkijxwuipxgqcofekcco.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G32CP-7BYGL1oJ8nk8lMmw_Qs7AE8jd';

// ---- Create Supabase client (global) ----
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Global gallery functions ----

/**
 * Fetch all gallery items from Supabase
 */
async function loadGalleryItems() {
  const { data, error } = await supabaseClient
    .from('gallery_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Render gallery items into a container with optional delete buttons
 */
function renderGalleryGrid(items, containerId, showDelete = false, onDelete = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--muted); padding:40px;">No items yet.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="gallery-item" data-id="${item.id}">
      ${item.file_type === 'image'
        ? `<img src="${item.file_url}" alt="${item.title}" loading="lazy" />`
        : `<video src="${item.file_url}" muted playsinline></video>`}
      <div class="gallery-item-info">
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
        <div class="gallery-item-actions">
          <button class="btn btn-sm btn-primary view-btn" data-url="${item.file_url}" data-type="${item.file_type}">View</button>
          <a href="${item.file_url}" download class="btn btn-sm btn-outline">Download</a>
          ${showDelete ? `<button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">🗑️ Delete</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  // --- Lightbox: "View" button ---
  container.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      openLightbox(this.dataset.url, this.dataset.type);
    });
  });

  // --- Delete button (if admin mode) ---
  if (showDelete && onDelete) {
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        if (confirm('Delete this item?')) onDelete(id);
      });
    });
  }
}

/**
 * Open lightbox with image or video
 */
function openLightbox(url, type) {
  const overlay = document.getElementById('lightbox');
  const content = document.getElementById('lightboxContent');
  if (!overlay || !content) return;

  if (type === 'image') {
    content.innerHTML = `<img src="${url}" alt="Gallery image" style="max-width:90%; max-height:80vh; border-radius:8px;" />`;
  } else {
    content.innerHTML = `<video src="${url}" controls autoplay style="max-width:90%; max-height:80vh; border-radius:8px;"></video>`;
  }
  overlay.style.display = 'flex';
}

/**
 * Close lightbox
 */
function closeLightbox() {
  const overlay = document.getElementById('lightbox');
  if (overlay) overlay.style.display = 'none';
}

// ---- Close lightbox on Escape key ----
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLightbox();
});

// ---- Close lightbox on overlay click ----
document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('lightbox');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) closeLightbox();
    });
  }
  // Lightbox close button
  const closeBtn = document.getElementById('lightboxClose');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
});