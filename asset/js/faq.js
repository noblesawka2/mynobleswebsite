(function () {
  "use strict";
  document.querySelectorAll("[data-faq-button]").forEach(function (button, index) {
    var panel = button.closest(".faq-item") && button.closest(".faq-item").querySelector(".faq-panel");
    if (!panel) return;
    if (!panel.id) panel.id = "faq-panel-" + index;
    button.setAttribute("aria-controls", panel.id);
    button.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    });
  });
}());
