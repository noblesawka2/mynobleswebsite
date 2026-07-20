(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".reveal").forEach(function (element) { element.classList.add("is-visible"); });
  document.querySelectorAll(".count-up").forEach(function (element) { element.textContent = Number(element.dataset.target || 0).toLocaleString(); });
  document.querySelectorAll(".phone-progress-fill").forEach(function (element) { element.style.width = element.dataset.progress + "%"; });
  var stage = document.getElementById("heroBgSlideshow");
  if (!stage) return;
  var slides = Array.from(stage.querySelectorAll(".hero-bg-slide"));
  var captions = Array.from(document.querySelectorAll(".hero-bg-caption-item"));
  var dots = Array.from(document.querySelectorAll(".hero-bg-dot"));
  var current = 0;
  var timer;
  function show(index) { current = (index + slides.length) % slides.length; slides.forEach(function (slide, i) { slide.classList.toggle("is-active", i === current); }); captions.forEach(function (caption, i) { caption.classList.toggle("is-active", i === current); }); dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === current); dot.setAttribute("aria-pressed", String(i === current)); }); }
  function start() { if (!reduceMotion && slides.length > 1) timer = window.setInterval(function () { show(current + 1); }, 5500); }
  dots.forEach(function (dot, index) { dot.addEventListener("click", function () { window.clearInterval(timer); show(index); start(); }); });
  show(0); start();

  var goalGrid = document.getElementById("goalGrid");
  var goalTarget = document.getElementById("goalTarget");
  var goalRoutes = { "save-small": "/easysave/", "grow-money": "/goldvault/", restock: "/loans/marketlift/", "school-fees": "/edusave/", december: "/foodvault/", emergency: "/futurefund/", retirement: "/contact/", "biz-support": "/contact/" };
  if (goalGrid && goalTarget) {
    function showGoal(button) {
      goalGrid.querySelectorAll(".goal-card").forEach(function (card) { card.classList.toggle("active", card === button); });
      goalTarget.replaceChildren();
      var wrapper = document.createElement("div"); wrapper.className = "goal-result-text";
      var heading = document.createElement("h3"); heading.textContent = button.querySelector("h4") ? button.querySelector("h4").textContent : "Savings goal";
      var copy = document.createElement("p"); copy.textContent = button.querySelector("p") ? button.querySelector("p").textContent : "Review the approved product details.";
      var link = document.createElement("a"); link.className = "btn btn-secondary"; link.href = goalRoutes[button.dataset.goal] || "/contact/"; link.textContent = "View the recommended next step";
      wrapper.append(heading, copy, link); goalTarget.append(wrapper);
    }
    goalGrid.addEventListener("click", function (event) { var button = event.target.closest(".goal-card"); if (button) showGoal(button); });
    var initialGoal = goalGrid.querySelector(".goal-card.active") || goalGrid.querySelector(".goal-card"); if (initialGoal) showGoal(initialGoal);
  }
}());

