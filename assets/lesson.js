/*
 * LessonKit — спільна логіка інтерактивних уроків у дизайні PCB / Engineering Blueprint.
 * Підключення в уроці (ПЕРЕД власним скриптом уроку):
 *   <script src="../../assets/lesson.js"></script>
 * Вимоги до розмітки: <body data-lesson="mX-lYY">, чекбокси input.check[data-key],
 *   #meter-text, #meter-bar, #done-btn, #done-hint, зміст .toc a[href="#sN"], секції section.step.
 * Бонусні пункти позначаються атрибутом data-bonus і не блокують кнопку завершення.
 * Автоматичне позначення пункту з коду уроку: window.LessonKit.setCheck("key", true).
 */
(function () {
  "use strict";
  var KEY = "arduino-course-v1"; // той самий ключ, що й на карті курсу (assets/app.js)
  var LESSON = document.body.getAttribute("data-lesson");

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { done: {}, checks: {} }; } catch (e) { return { done: {}, checks: {} }; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  /* ---------- чек-лист і прогрес ---------- */
  var checks = [].slice.call(document.querySelectorAll("input.check"));
  var required = checks.filter(function (c) { return !c.hasAttribute("data-bonus"); });

  function refreshProgress() {
    var n = required.filter(function (c) { return c.checked; }).length;
    var mt = document.getElementById("meter-text"), mb = document.getElementById("meter-bar");
    if (mt) mt.textContent = n + " з " + required.length;
    if (mb) mb.style.width = (required.length ? n / required.length * 100 : 0) + "%";
    var s = load(), btn = document.getElementById("done-btn"), hint = document.getElementById("done-hint");
    if (!btn) return;
    if (s.done[LESSON]) { btn.textContent = "✓ Урок пройдено"; btn.disabled = true; if (hint) hint.textContent = "Прогрес збережено в цьому браузері."; }
    else { btn.disabled = n < required.length; if (hint) hint.textContent = n < required.length ? "Кнопка стане активною, коли всі обов'язкові пункти будуть позначені." : ""; }
  }
  function setCheck(key, val) {
    var s = load(); s.checks[LESSON + ":" + key] = val; save(s);
    checks.forEach(function (c) { if (c.dataset.key === key) c.checked = val; });
    refreshProgress();
  }

  (function init() {
    var s = load();
    checks.forEach(function (c) {
      c.checked = !!s.checks[LESSON + ":" + c.dataset.key];
      c.addEventListener("change", function () { setCheck(c.dataset.key, c.checked); });
    });
    var btn = document.getElementById("done-btn");
    if (btn) btn.addEventListener("click", function () { var st = load(); st.done[LESSON] = true; save(st); refreshProgress(); });
    refreshProgress();
  })();

  /* ---------- підсвічування змісту під час прокручування ---------- */
  if ("IntersectionObserver" in window) {
    var links = {};
    document.querySelectorAll(".toc a").forEach(function (a) {
      var h = a.getAttribute("href");
      if (h && h.charAt(0) === "#") links[h.slice(1)] = a;
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].classList.toggle("active", id === e.target.id); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll("section.step").forEach(function (sec) { io.observe(sec); });
  }

  window.LessonKit = { id: LESSON, KEY: KEY, load: load, save: save, setCheck: setCheck, refresh: refreshProgress };
})();
