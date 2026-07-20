(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.getElementById("siteNav");
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  var closeButton = document.getElementById("mobileMenuBack");
  var backToTop = document.getElementById("backToTop");
  var previousFocus = null;

  function focusable(container) {
    return container ? Array.from(container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')) : [];
  }

  function setMenu(open, restoreFocus) {
    if (!toggle || !menu) return;
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
    if (open) {
      previousFocus = document.activeElement;
      var items = focusable(menu);
      if (items[0]) items[0].focus();
    } else if (restoreFocus && previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  }

  if (toggle && menu) {
    menu.setAttribute("aria-hidden", String(!menu.classList.contains("is-open")));
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"), true);
    });
    if (closeButton) closeButton.addEventListener("click", function () { setMenu(false, true); });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a[href]")) setMenu(false, false);
    });
  }

  document.querySelectorAll("[data-mm-accordion]").forEach(function (button, index) {
    var panel = button.closest(".mm-item") && button.closest(".mm-item").querySelector(".mm-sublinks");
    if (!panel) return;
    if (!panel.id) panel.id = "mobile-accordion-" + index;
    button.setAttribute("aria-controls", panel.id);
    button.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    button.addEventListener("click", function () {
      var opening = button.getAttribute("aria-expanded") !== "true";
      document.querySelectorAll("[data-mm-accordion]").forEach(function (other) {
        var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
        other.setAttribute("aria-expanded", "false");
        other.classList.remove("open");
        if (otherPanel) { otherPanel.hidden = true; otherPanel.classList.remove("open"); }
      });
      button.setAttribute("aria-expanded", String(opening));
      button.classList.toggle("open", opening);
      panel.hidden = !opening;
      panel.classList.toggle("open", opening);
    });
  });

  document.querySelectorAll(".nav-link-label").forEach(function (button, index) {
    var item = button.closest("li");
    var dropdown = item && item.querySelector(":scope > .nav-dropdown");
    if (!dropdown) return;
    if (!dropdown.id) dropdown.id = "desktop-dropdown-" + index;
    button.setAttribute("aria-controls", dropdown.id);
    function setOpen(open) {
      button.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);
    }
    button.addEventListener("click", function () { setOpen(button.getAttribute("aria-expanded") !== "true"); });
    item.addEventListener("focusout", function (event) { if (!item.contains(event.relatedTarget)) setOpen(false); });
    item.addEventListener("keydown", function (event) {
      var links = Array.from(dropdown.querySelectorAll("a[href]"));
      if (event.key === "Escape") { setOpen(false); button.focus(); }
      if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); (links[0] || button).focus(); }
      if (event.key === "ArrowUp") { event.preventDefault(); setOpen(true); (links[links.length - 1] || button).focus(); }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setMenu(false, true);
      document.querySelectorAll(".nav-link-label[aria-expanded=\"true\"]").forEach(function (button) { button.click(); });
    }
    if (event.key === "Tab" && menu && menu.classList.contains("is-open")) {
      var items = focusable(menu);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("is-scrolled", y > 40);
    if (backToTop) {
      var visible = y > 700;
      backToTop.classList.toggle("is-visible", visible);
      backToTop.tabIndex = visible ? 0 : -1;
      backToTop.setAttribute("aria-hidden", String(!visible));
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (backToTop) backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });
}());
