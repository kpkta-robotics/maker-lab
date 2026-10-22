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

  /* ---------- блок артефактів та швидкого звіту гуртківця ---------- */
  function setupArtifactWidget() {
    var doneRow = document.querySelector(".done-row") || document.getElementById("lesson-footer");
    if (!doneRow || document.getElementById("maker-artifact-box")) return;

    var s = load();
    var curArtifact = (s.artifacts && s.artifacts[LESSON]) || "";

    var box = document.createElement("div");
    box.id = "maker-artifact-box";
    box.className = "maker-artifact-box";
    box.innerHTML =
      '<div class="artifact-head">' +
        '<b>🛠 Щоденник гуртківця: залізячний артефакт або нотатка</b>' +
        '<span class="artifact-tag">Для керівника гуртка</span>' +
      '</div>' +
      '<p class="artifact-sub">Вкажи посилання на проєкт (Wokwi, Tinkercad, диск з фото/відео) або зафіксуй реальний результат складання на платі ТЕКО чи друку на Snapmaker A350:</p>' +
      '<textarea class="artifact-input" id="maker-artifact-text" placeholder="Наприклад: Зібрано на макетці ТЕКО, світлодіод миготить стабільно. Посилання: https://wokwi.com/..."></textarea>' +
      '<div class="artifact-actions">' +
        '<button class="btn-copy-lesson-report" id="btn-copy-lesson-report" type="button">📋 Скопіювати звіт за цей урок (Exit Ticket)</button>' +
        '<span class="artifact-saved-hint" id="artifact-saved-hint"></span>' +
      '</div>';

    doneRow.parentNode.insertBefore(box, doneRow);

    var ta = document.getElementById("maker-artifact-text");
    var hint = document.getElementById("artifact-saved-hint");
    var copyBtn = document.getElementById("btn-copy-lesson-report");

    if (ta) {
      ta.value = curArtifact;
      ta.addEventListener("input", function () {
        var st = load();
        st.artifacts = st.artifacts || {};
        st.artifacts[LESSON] = ta.value;
        save(st);
        if (hint) {
          hint.textContent = "✓ Збережено";
          setTimeout(function () { hint.textContent = ""; }, 2000);
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var st = load();
        var note = (st.artifacts && st.artifacts[LESSON]) || (ta ? ta.value : "");
        var studentName = localStorage.getItem("arduino-student-name") || "Студент гуртка";
        var studentGroup = localStorage.getItem("arduino-student-group") || "не вказано";
        var lessonTitle = (document.querySelector("h1") || {}).textContent || document.title;
        var reqCount = required.length;
        var doneN = required.filter(function (c) { return c.checked; }).length;
        var isDone = !!st.done[LESSON];

        var now = new Date();
        var timeStr = String(now.getDate()).padStart(2, "0") + "." +
                      String(now.getMonth() + 1).padStart(2, "0") + "." +
                      now.getFullYear() + ", " +
                      String(now.getHours()).padStart(2, "0") + ":" +
                      String(now.getMinutes()).padStart(2, "0");

        var text = [
          "⚡ КПКТА РОБОТОТЕХНІКА · ЗВІТ ЗА ЗАНЯТТЯ",
          "---------------------------------------",
          "Гуртківець: " + studentName + " (Група: " + studentGroup + ")",
          "Урок: " + lessonTitle.trim(),
          "Статус: " + (isDone ? "✅ ВИКОНАНО" : "⏳ В ПРОЦЕСІ") + " (" + doneN + " з " + reqCount + " обов'язкових пунктів)",
          "Дата й час: " + timeStr,
          "",
          "🛠 ЗАЛІЗЯЧНИЙ АРТЕФАКТ / НОТАТКА:",
          note ? note.trim() : "(Без додаткової нотатки)",
          "",
          "🔑 Контрольний підпис: KPKTA-" + (LESSON || "L").toUpperCase() + "-" + Math.abs((doneN * 31) ^ now.getDate()).toString(16).toUpperCase()
        ].join("\n");

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            if (hint) {
              hint.textContent = "✓ Звіт скопійовано! Надішли його керівнику в Telegram чи Classroom.";
              setTimeout(function () { hint.textContent = ""; }, 4000);
            }
          });
        } else {
          prompt("Скопіюй звіт вручну:", text);
        }
      });
    }
  }

  (function init() {
    var s = load();
    checks.forEach(function (c) {
      c.checked = !!s.checks[LESSON + ":" + c.dataset.key];
      c.addEventListener("change", function () { setCheck(c.dataset.key, c.checked); });
    });
    var btn = document.getElementById("done-btn");
    if (btn) btn.addEventListener("click", function () { var st = load(); st.done[LESSON] = true; save(st); refreshProgress(); });
    setupArtifactWidget();
    setupCopyButtons();
    refreshProgress();
  })();

  /* ---------- універсальні кнопки копіювання (.copy-btn) ---------- */
  function setupCopyButtons() {
    function copyValue(text, btn) {
      var orig = btn.innerHTML;
      var feedback = function () {
        btn.classList.add("copied");
        btn.innerHTML = "✓ Скопійовано!";
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.innerHTML = orig;
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(feedback).catch(function () {
          fallbackCopy(text, feedback);
        });
      } else {
        fallbackCopy(text, feedback);
      }
    }

    function fallbackCopy(text, cb) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        var ok = document.execCommand("copy");
        if (ok && cb) cb();
        else if (!ok) prompt("Скопіюй вручну:", text);
      } catch (err) {
        prompt("Скопіюй вручну:", text);
      }
      document.body.removeChild(ta);
    }

    document.querySelectorAll(".copy-btn, [data-copy-target]").forEach(function (btn) {
      if (btn.dataset.copyBound) return;
      btn.dataset.copyBound = "true";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var targetId = btn.getAttribute("data-target") || btn.getAttribute("data-copy-target");
        var targetEl = targetId ? document.getElementById(targetId) : null;
        if (!targetEl) return;
        var text = targetEl.innerText || targetEl.textContent || "";
        var cleanText = text.trim().replace(/^«|»$/g, "").trim();
        copyValue(cleanText, btn);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCopyButtons);
  } else {
    setupCopyButtons();
  }

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
