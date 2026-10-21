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

  function iconForType(t) {
    if (t === "video") return "🎬";
    if (t === "sim") return "⚡";
    if (t === "model") return "🧊";
    if (t === "tool") return "🛠";
    return "📘";
  }

  /* ---------- Карта курсу та ресурси (index.html) ---------- */
  function renderIndex() {
    var box = document.getElementById("course-root");
    if (!box) return;
    var s = load(), html = "";
    C.modules.forEach(function (m, mIdx) {
      var mReadyCount = m.lessons.filter(function (x) { return x.status === "ready"; }).length;
      var mDoneCount = m.lessons.filter(function (x) { return x.status === "ready" && s.done[x.id]; }).length;
      var badgeClass = mDoneCount > 0 && mDoneCount === mReadyCount ? "mod-stat done" : (mReadyCount > 0 ? "mod-stat active" : "mod-stat");
      var badgeHtml = mReadyCount > 0
        ? '<span class="' + badgeClass + '">' + mDoneCount + " з " + mReadyCount + " пройдено</span>"
        : '<span class="mod-stat">У розробці</span>';

      html += '<article class="module" id="mod-' + m.id + '">' +
        '<div class="mod-head">' +
          '<div class="mod-title-wrap"><span class="mod-code">M' + mIdx + '</span><h3>' + m.title + '</h3></div>' +
          badgeHtml +
        '</div>' +
        '<p class="mod-desc">' + m.desc + '</p><div class="lesson-list">';

      m.lessons.forEach(function (l, n) {
        var num = (mIdx) + "." + (n + 1);
        if (l.status !== "ready") {
          html += '<div class="lesson-row locked"><span class="st">' + num + '</span><span class="t">' +
            l.title + '</span>' + (l.time ? '<span class="tm">' + l.time + '</span>' : '') + '<span class="tag soon">Скоро</span></div>';
        } else if (!unlocked(l, s)) {
          html += '<div class="lesson-row locked"><span class="st">' + num + '</span><span class="t">' +
            l.title + '</span><span class="tag lock">🔒 Спочатку попередній урок</span></div>';
        } else {
          var done = s.done[l.id];
          html += '<a class="lesson-row ' + (done ? "done" : "open") + '" href="' + l.path + '">' +
            '<span class="st">' + (done ? "✓" : num) + '</span>' +
            '<span class="t">' + l.title + '</span>' +
            '<span class="tm">' + l.time + '</span>' +
            '<span class="go-arrow" aria-hidden="true">' + (done ? "Повторити →" : "Відкрити →") + '</span></a>';
        }
      });
      html += '</div>';

      // Додаткові ресурси/відео модуля
      if (m.resources && m.resources.length) {
        html += '<div class="mod-resources"><span class="mod-res-label">Матеріали та відео:</span>';
        m.resources.forEach(function (r) {
          html += '<a class="res-chip" href="' + r.url + '" target="_blank" rel="noopener">' +
            iconForType(r.type) + " " + r.title + (r.tag ? ' <small>· ' + r.tag + '</small>' : '') + " ↗</a>";
        });
        html += "</div>";
      }

      html += "</article>";
    });
    box.innerHTML = html;

    // Рендер глобальної бібліотеки відео та корисних джерел
    var resBox = document.getElementById("resources-root");
    if (resBox && C.resources && C.resources.length) {
      var rHtml = "";
      C.resources.forEach(function (group) {
        rHtml += '<div class="res-group"><h3>' + group.category + '</h3><div class="grid">';
        group.items.forEach(function (item) {
          rHtml += '<a class="card res-card" href="' + item.url + '" target="_blank" rel="noopener">' +
            '<div class="res-card-top"><h4>' + item.title + '</h4>' +
            (item.badge ? '<span class="tag res-badge">' + item.badge + '</span>' : '') + '</div>' +
            '<p>' + item.desc + '</p><span class="res-link">Відкрити джерело ↗</span></a>';
        });
        rHtml += "</div></div>";
      });
      resBox.innerHTML = rHtml;
    }

    var doneCount = ready.filter(function (l) { return s.done[l.id]; }).length;
    var pct = ready.length ? Math.round(doneCount / ready.length * 100) : 0;
    var bar = document.getElementById("progress-bar");
    if (bar) bar.style.width = pct + "%";
    var shortTxt = document.getElementById("progress-short");
    if (shortTxt) shortTxt.textContent = doneCount + " з " + ready.length + " (" + pct + "%)";
    var txt = document.getElementById("progress-text");
    if (txt) txt.textContent = (teacher ? "🎓 Режим викладача активний (усі уроки відкрито)" : "Прогрес зберігається у цьому браузері");

    var heroReady = document.getElementById("hero-stat-ready");
    if (heroReady) heroReady.textContent = "Готових уроків: " + ready.length;
    var heroDone = document.getElementById("hero-stat-done");
    if (heroDone) heroDone.textContent = "Пройдено: " + doneCount + " з " + ready.length + " (" + pct + "%)";

    // Кнопка «Почати / Продовжити навчання» у Hero
    var contBtn = document.getElementById("continue-btn");
    if (contBtn && ready.length) {
      var nextLesson = ready.filter(function (l) { return !s.done[l.id] && unlocked(l, s); })[0] || ready[0];
      contBtn.href = nextLesson.path;
      contBtn.textContent = doneCount > 0 ? "Продовжити: " + nextLesson.title + " →" : "Почати навчання →";
    }

    var reset = document.getElementById("reset-btn");
    if (reset) reset.onclick = function () {
      if (confirm("Скинути весь прогрес у цьому браузері?")) { localStorage.removeItem(KEY); location.reload(); }
    };

    var teacherBtn = document.getElementById("teacher-toggle-btn");
    if (teacherBtn) {
      teacherBtn.textContent = teacher ? "🎓 Режим викладача: УВІМКНЕНО" : "🎓 Режим викладача";
      teacherBtn.classList.toggle("active", teacher);
      teacherBtn.onclick = function () {
        if (teacher) { localStorage.removeItem("arduino-teacher"); }
        else { localStorage.setItem("arduino-teacher", "1"); }
        location.reload();
      };
    }

    // Плавне підсвічування активного пункту в лівому змісті (.toc) на головній сторінці
    var tocLinks = {};
    document.querySelectorAll(".toc a").forEach(function (a) {
      var h = a.getAttribute("href");
      if (h && h.charAt(0) === "#") tocLinks[h.slice(1)] = a;
    });
    if ("IntersectionObserver" in window && Object.keys(tocLinks).length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          Object.keys(tocLinks).forEach(function (id) {
            tocLinks[id].classList.toggle("active", id === e.target.id);
          });
        });
      }, { rootMargin: "-25% 0px -60% 0px" });
      document.querySelectorAll("section.step").forEach(function (sec) { io.observe(sec); });
    }
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
    if (crumbs) crumbs.innerHTML = '<a href="' + root + 'index.html">← Карта курсу</a> › ' + cur.module.title;

    // Захист від переходу «через» урок
    if (!unlocked(cur, s)) {
      var prev = ready[ready.indexOf(cur) - 1];
      document.querySelector("main").innerHTML =
        '<div class="box warn"><div class="box-title">🔒 Урок ще закритий</div>Спочатку пройди урок «' + prev.title +
        '» і натисни «Урок пройдено».</div><p><a class="btn" href="' + root + prev.path + '">Перейти до попереднього уроку</a></p>';
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
        hint.textContent = all ? "" : "Кнопка стане активною, коли будуть позначені всі пункти чек-листа."; }
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
