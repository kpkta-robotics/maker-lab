/* Спільна логіка курсу. Без залежностей. Прогрес зберігається у браузері (localStorage). */
(function () {
  "use strict";
  var KEY = "arduino-course-v1";
  var C = window.COURSE;
  var root = document.body.getAttribute("data-root") || "";

  // Режим викладача: ?teacher=1 відкриває всі уроки, ?teacher=0 вимикає
  var q = new URLSearchParams(location.search);
  if (q.get("teacher") === "1") localStorage.setItem("arduino-teacher", "1");
  if (q.get("teacher") === "0") localStorage.removeItem("arduino-teacher");
  var teacher = localStorage.getItem("arduino-teacher") === "1";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { done: {}, checks: {} }; }
    catch (e) { return { done: {}, checks: {} }; }
  }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

  var flat = [];
  C.modules.forEach(function (m) {
    m.lessons.forEach(function (l) { l.module = m; flat.push(l); });
  });
  var ready = flat.filter(function (l) { return l.status === "ready"; });

  function unlocked(l, s) {
    if (teacher) return true;
    // Перший готовий урок кожного модуля завжди відкритий для вибору траєкторії
    var mReady = l.module.lessons.filter(function (x) { return x.status === "ready"; });
    if (mReady.indexOf(l) === 0) return true;
    var i = ready.indexOf(l);
    return i <= 0 || !!s.done[ready[i - 1].id];
  }

  /* ---------- Карта курсу (index.html) ---------- */
  function renderIndex() {
    var box = document.getElementById("course-root");
    if (!box) return;
    var s = load(), html = "";
    C.modules.forEach(function (m) {
      html += '<section class="module"><h3>' + m.title + "</h3><p>" + m.desc + "</p>";
      m.lessons.forEach(function (l, n) {
        var num = n + 1;
        if (l.status !== "ready") {
          html += '<div class="lesson-row locked"><span class="st">' + num + '</span><span class="t">' +
            l.title + '</span><span class="tag soon">Скоро</span></div>';
        } else if (!unlocked(l, s)) {
          html += '<div class="lesson-row locked"><span class="st">' + num + '</span><span class="t">' +
            l.title + '</span><span class="tag lock">🔒 Спочатку попередній урок</span></div>';
        } else {
          var done = s.done[l.id];
          html += '<a class="lesson-row ' + (done ? "done" : "open") + '" href="' + l.path + '"><span class="st">' +
            (done ? "✓" : num) + '</span><span class="t">' + l.title + '</span><span class="tm">' + l.time + "</span></a>";
        }
      });
      html += "</section>";
    });
    box.innerHTML = html;

    var doneCount = ready.filter(function (l) { return s.done[l.id]; }).length;
    var pct = ready.length ? Math.round(doneCount / ready.length * 100) : 0;
    var bar = document.getElementById("progress-bar");
    if (bar) bar.style.width = pct + "%";
    var txt = document.getElementById("progress-text");
    if (txt) txt.textContent = "Пройдено " + doneCount + " з " + ready.length + " готових уроків (" + pct + "%)" +
      (teacher ? " • режим викладача" : "");

    var reset = document.getElementById("reset-btn");
    if (reset) reset.onclick = function () {
      if (confirm("Скинути весь прогрес у цьому браузері?")) { localStorage.removeItem(KEY); location.reload(); }
    };
  }

  /* ---------- Сторінка уроку ---------- */
  function renderLesson() {
    var id = document.body.getAttribute("data-lesson");
    if (!id) return;
    var cur = flat.filter(function (l) { return l.id === id; })[0];
    if (!cur) return;
    var s = load();

    // Хлібні крихти
    var crumbs = document.getElementById("crumbs");
    if (crumbs) crumbs.innerHTML = '<a href="' + root + 'index.html">Карта курсу</a> › ' + cur.module.title;

    // Захист від переходу «через» урок
    if (!unlocked(cur, s)) {
      var prev = ready[ready.indexOf(cur) - 1];
      document.querySelector("main").innerHTML =
        '<div class="box warn"><div class="box-title">🔒 Урок ще закритий</div>Спочатку пройдіть урок «' + prev.title +
        '» і натисніть «Урок пройдено».</div><p><a class="btn" href="' + root + prev.path + '">Перейти до попереднього уроку</a></p>';
      return;
    }

    // Чек-листи (збереження стану)
    var checks = document.querySelectorAll("input.check");
    checks.forEach(function (c) {
      var k = id + ":" + c.getAttribute("data-key");
      c.checked = !!s.checks[k];
      c.addEventListener("change", function () {
        var st = load(); st.checks[k] = c.checked; save(st); refreshDone();
      });
    });

    // Кнопка «Урок пройдено» і навігація
    var idx = ready.indexOf(cur), prevL = ready[idx - 1], nextL = ready[idx + 1];
    var nav = document.getElementById("lesson-footer");
    if (nav) {
      nav.innerHTML =
        '<div class="done-row"><button class="btn ok-btn" id="done-btn"></button><div class="hint" id="done-hint"></div></div>' +
        '<div class="lesson-nav">' +
        (prevL ? '<a class="btn alt" href="' + root + prevL.path + '">← ' + prevL.title + "</a>" : '<a class="btn alt" href="' + root + 'index.html">← Карта курсу</a>') +
        '<a class="btn alt" id="next-btn" href="' + (nextL ? root + nextL.path : root + "index.html") + '">' +
        (nextL ? nextL.title + " →" : "Карта курсу →") + "</a></div>";
      document.getElementById("done-btn").onclick = function () {
        var st = load(); st.done[id] = true; save(st); refreshDone();
        document.getElementById("done-hint").textContent = "Прогрес збережено у цьому браузері. Наступний урок розблоковано.";
      };
    }
    function refreshDone() {
      var st = load();
      var all = Array.prototype.every.call(checks, function (c) { return c.checked; });
      var btn = document.getElementById("done-btn"), hint = document.getElementById("done-hint");
      if (!btn) return;
      if (st.done[id]) { btn.textContent = "✓ Урок пройдено"; btn.disabled = true; hint.textContent = ""; }
      else { btn.textContent = "Позначити урок пройденим"; btn.disabled = !all;
        hint.textContent = all ? "" : "Кнопка стане активною, коли ви відзначите всі пункти чек-листа."; }
    }
    refreshDone();
  }

  /* ---------- Вкладки, копіювання (будь-яка сторінка) ---------- */
  function initWidgets() {
    document.querySelectorAll("[data-tabs]").forEach(function (box) {
      var btns = box.querySelectorAll("[data-tab]"), panels = box.querySelectorAll("[data-panel]");
      function show(name) {
        btns.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === name); });
        panels.forEach(function (p) { p.classList.toggle("active", p.getAttribute("data-panel") === name); });
      }
      btns.forEach(function (b) { b.addEventListener("click", function () { show(b.getAttribute("data-tab")); }); });
      if (btns.length) show(btns[0].getAttribute("data-tab"));
    });
    document.querySelectorAll(".copy-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var pre = document.getElementById(b.getAttribute("data-target"));
        if (!pre) return;
        var done = function () { var t = b.textContent; b.textContent = "Скопійовано ✓"; setTimeout(function () { b.textContent = t; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(done);
        else { var r = document.createRange(); r.selectNode(pre); getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand("copy"); done(); }
      });
    });
  }

  renderIndex();
  renderLesson();
  initWidgets();
})();
