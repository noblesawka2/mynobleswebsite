(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tabs = Array.from(document.querySelectorAll('[role="tab"][data-calc]'));

  function selectTab(tab, focus) {
    tabs.forEach(function (item) {
      var selected = item === tab;
      var panel = document.getElementById(item.getAttribute("aria-controls") || item.getAttribute("data-calc"));
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      if (panel) { panel.hidden = !selected; panel.classList.toggle("active", selected); }
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, index) {
    var panel = document.getElementById(tab.getAttribute("data-calc"));
    if (panel) { tab.setAttribute("aria-controls", panel.id); panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", tab.id || (tab.id = "calculator-tab-" + index)); }
    tab.addEventListener("click", function () { selectTab(tab, false); });
    tab.addEventListener("keydown", function (event) {
      var next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault(); selectTab(tabs[next], true);
    });
  });
  if (tabs.length) selectTab(tabs.find(function (tab) { return tab.getAttribute("aria-selected") === "true"; }) || tabs[0], false);

  function number(id, fallback) { var el = document.getElementById(id); var value = el ? Number(el.value) : NaN; return Number.isFinite(value) && value >= 0 ? value : fallback; }
  function money(value) { return "₦" + Math.round(value).toLocaleString("en-NG"); }
  function output(id, value) { var el = document.getElementById(id); if (!el) return; el.textContent = value; if (!reduceMotion) { el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); } }
  function savings() { var amount = number("save-amt", 0); var months = number("save-months", 12); output("save-total-output", money(amount * months)); output("save-interest-output", "Ask Nobles for the approved product schedule"); }
  function school() { output("school-output", money(number("school-target", 0) / Math.max(1, number("school-weeks", 1)))); }
  function emergency() { output("emerg-output", money(number("emerg-exp", 0) * number("emerg-months", 3))); }
  [["save-amt", savings], ["save-months", savings], ["school-target", school], ["school-weeks", school], ["emerg-exp", emergency], ["emerg-months", emergency]].forEach(function (entry) { var el = document.getElementById(entry[0]); if (el) { el.addEventListener("input", entry[1]); el.addEventListener("change", entry[1]); } });
  savings(); school(); emergency();
}());
