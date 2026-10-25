/* Спільна логіка курсу. Без залежностей. Прогрес зберігається у браузері (localStorage). */
(function () {
  "use strict";
  var KEY = "arduino-course-v1";
  var C = window.COURSE;
  var root = document.body.getAttribute("data-root") || "";

  // Режим викладача: ?teacher=0111 відкриває всі уроки, ?teacher=0 вимикає
  var q = new URLSearchParams(location.search);
  if (q.get("teacher") === "0111" || q.get("teacher") === "1") localStorage.setItem("arduino-teacher", "1");
  if (q.get("teacher") === "0") localStorage.removeItem("arduino-teacher");
  if (q.has("teacher") && window.history && window.history.replaceState) {
    history.replaceState(null, "", location.pathname + location.hash);
  }
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

      // Вітрина готових проєктів модуля (якщо є showcase)
      if (m.showcase && m.showcase.length) {
        html += '<div class="mod-showcase"><div class="showcase-head">' +
          '<h4>🎯 Фінальні вироби модуля: що ти зможеш зібрати під ключ</h4>' +
          '<p class="showcase-sub">Реальні інтегровані гаджети, які поєднують надрукований корпус, сервоприводи, сенсори та код:</p>' +
          '</div><div class="showcase-grid">';
        m.showcase.forEach(function (proj) {
          html += '<div class="showcase-card">' +
            '<div class="showcase-card-head">' +
              '<span class="showcase-icon">' + proj.icon + '</span>' +
              '<div><h5>' + proj.title + '</h5><span class="showcase-tag">' + proj.tag + '</span></div>' +
            '</div>' +
            '<p class="showcase-desc">' + proj.desc + '</p>' +
            '<div class="showcase-specs">' +
              proj.specs.map(function(sp){ return '<span class="spec-pill">' + sp + '</span>'; }).join('') +
            '</div>' +
          '</div>';
        });
        html += '</div></div>';
      }

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

    // Посилання на режим викладача у футері з перевіркою PIN 0111
    var teacherLink = document.getElementById("teacher-footer-link");
    if (teacherLink) {
      if (teacher) {
        teacherLink.textContent = "🎓 Режим викладача: УВІМКНЕНО (Вимкнути)";
        teacherLink.style.color = "var(--pcb)";
        teacherLink.style.fontWeight = "600";
      } else {
        teacherLink.textContent = "🎓 Режим викладача";
        teacherLink.style.color = "var(--pcb)";
        teacherLink.style.fontWeight = "normal";
      }
      if (window.handleTeacherLogin) {
        teacherLink.onclick = window.handleTeacherLogin;
      }
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

    // Логіка модального вікна «Паспорт досягнень (для викладача)»
    var passportModal = document.getElementById("passport-modal");
    var passportOpenBtn = document.getElementById("passport-open-btn");
    var passportCloseBtn = document.getElementById("passport-close-btn");
    var nameInput = document.getElementById("student-name-input");
    var groupInput = document.getElementById("student-group-input");
    var copyReportBtn = document.getElementById("passport-copy-btn");
    var printReportBtn = document.getElementById("passport-print-btn");
    var copyHint = document.getElementById("passport-copy-hint");

    function updatePassportView() {
      var name = (localStorage.getItem("arduino-student-name") || "").trim();
      var group = (localStorage.getItem("arduino-student-group") || "").trim();
      if (nameInput) nameInput.value = name;
      if (groupInput) groupInput.value = group;

      var displayName = document.getElementById("student-display-name");
      if (displayName) displayName.textContent = name || "Гуртківець лабораторії";
      var displayMeta = document.getElementById("student-display-meta");
      if (displayMeta) displayMeta.textContent = "Група: " + (group || "не вказано") + " · Гурток «Робототехніка» КПКТА";

      var scoreNum = document.getElementById("passport-score-num");
      if (scoreNum) scoreNum.textContent = pct + "%";

      // Підрахунок балансу: Теорія / Симулятор vs Реальне залізо
      var hardwareCount = 0;
      if (s.artifacts) {
        ready.forEach(function (l) {
          if (s.artifacts[l.id] && s.artifacts[l.id].trim().length > 3) hardwareCount++;
        });
      }
      var theoryVal = document.getElementById("theory-balance-val");
      if (theoryVal) theoryVal.textContent = doneCount + " з " + ready.length + " (" + pct + "%)";
      var hwVal = document.getElementById("hardware-balance-val");
      if (hwVal) hwVal.textContent = hardwareCount + " залізячних артефактів";

      // Контрольний верифікаційний код (хеш із імені, прогресу та поточної дати)
      var certCode = document.getElementById("passport-cert-code");
      if (certCode) {
        var seed = (name || "STUDENT") + "-" + doneCount + "/" + ready.length + "-H" + hardwareCount;
        var hash = 0;
        for (var h = 0; h < seed.length; h++) hash = ((hash << 5) - hash) + seed.charCodeAt(h) | 0;
        var hexCode = Math.abs(hash).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
        certCode.textContent = "ID: KPKTA-2026-M" + doneCount + "-" + hexCode;
      }

      var dateStamp = document.getElementById("passport-date-stamp");
      if (dateStamp) {
        var now = new Date();
        var dStr = String(now.getDate()).padStart(2, "0") + "." + String(now.getMonth() + 1).padStart(2, "0") + "." + now.getFullYear();
        dateStamp.textContent = "Дата формування: " + dStr;
      }

      var listRoot = document.getElementById("passport-progress-summary");
      if (listRoot) {
        var listHtml = "";
        ready.forEach(function (l) {
          var isDone = !!s.done[l.id];
          var art = (s.artifacts && s.artifacts[l.id]) ? s.artifacts[l.id].trim() : "";
          listHtml += '<div class="passport-item ' + (isDone ? "done" : "") + '">' +
            '<div class="passport-item-wrap">' +
              '<span class="passport-item-title">' + (isDone ? "✅ " : "⏳ ") + l.title + '</span>' +
              (art ? '<div class="passport-item-note">🛠 Залізо/Артефакт: ' + art.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>' : '') +
            '</div>' +
            '<span class="passport-item-status">' + (isDone ? "ВИКОНАНО" : "В ПРОЦЕСІ") + '</span>' +
          '</div>';
        });
        listRoot.innerHTML = listHtml;
      }
    }

    if (passportOpenBtn && passportModal) {
      passportOpenBtn.onclick = function () {
        updatePassportView();
        passportModal.hidden = false;
      };
      if (passportCloseBtn) passportCloseBtn.onclick = function () { passportModal.hidden = true; };
      passportModal.onclick = function (e) {
        if (e.target === passportModal) passportModal.hidden = true;
      };
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !passportModal.hidden) passportModal.hidden = true;
      });
    }

    if (nameInput) {
      nameInput.oninput = function () {
        localStorage.setItem("arduino-student-name", nameInput.value);
        updatePassportView();
      };
    }
    if (groupInput) {
      groupInput.oninput = function () {
        localStorage.setItem("arduino-student-group", groupInput.value);
        updatePassportView();
      };
    }

    // Експорт щоденника мейкера у файл JSON
    var exportBtn = document.getElementById("export-progress-btn");
    var importFile = document.getElementById("import-progress-file");

    if (exportBtn) {
      exportBtn.onclick = function () {
        var st = load();
        var studentName = localStorage.getItem("arduino-student-name") || "";
        var studentGroup = localStorage.getItem("arduino-student-group") || "";
        var exportData = {
          version: "1.0",
          studentName: studentName,
          studentGroup: studentGroup,
          progress: st,
          exportedAt: new Date().toISOString()
        };
        var jsonStr = JSON.stringify(exportData, null, 2);
        var blob = new Blob([jsonStr], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        var safeName = (studentName || "maker-portfolio").replace(/[^a-zA-Z0-9а-яА-ЯёЁіІїЇєЄ_-]/g, "_");
        a.href = url;
        a.download = safeName + "-progress.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }

    if (importFile) {
      importFile.onchange = function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (evt) {
          try {
            var data = JSON.parse(evt.target.result);
            if (data && data.progress && typeof data.progress === "object") {
              save(data.progress);
              if (data.studentName) localStorage.setItem("arduino-student-name", data.studentName);
              if (data.studentGroup) localStorage.setItem("arduino-student-group", data.studentGroup);
              alert("✓ Щоденник успішно завантажено! Весь твій прогрес та артефакти відновлено.");
              location.reload();
            } else {
              alert("Помилка: вибраний файл не містить коректного щоденника мейкера.");
            }
          } catch (err) {
            alert("Помилка зчитування файлу: " + err.message);
          }
        };
        reader.readAsText(file);
      };
    }

    if (copyReportBtn) {
      copyReportBtn.onclick = function () {
        var name = (localStorage.getItem("arduino-student-name") || "Гуртківець майстерні").trim();
        var group = (localStorage.getItem("arduino-student-group") || "не вказано").trim();
        var now = new Date();
        var dStr = String(now.getDate()).padStart(2, "0") + "." + String(now.getMonth() + 1).padStart(2, "0") + "." + now.getFullYear();
        var cert = (document.getElementById("passport-cert-code") || {}).textContent || "";

        var hardwareCount = 0;
        if (s.artifacts) {
          ready.forEach(function (l) {
            if (s.artifacts[l.id] && s.artifacts[l.id].trim().length > 3) hardwareCount++;
          });
        }

        var lines = [
          "🎓 KPKTA MAKER-LAB · ПАСПОРТ ДОСЯГНЕНЬ ГУРТКІВЦЯ",
          "---------------------------------------------",
          "Гуртківець: " + name,
          "Група / Фах: " + group,
          "Освітній простір: Гурток «Робототехніка» КПКТА",
          "Дата: " + dStr,
          "Прогрес курсу: " + doneCount + " з " + ready.length + " готових уроків (" + pct + "%)",
          "Баланс: Віртуальна теорія (" + doneCount + "/" + ready.length + ") | Залізячні артефакти (" + hardwareCount + ")",
          "Контрольний номер: " + cert,
          "",
          "📋 СТАТУС ВИКОНАННЯ УРОКІВ ТА ЛАБОРАТОРНИХ РОБІТ:"
        ];
        ready.forEach(function (l) {
          var isDone = !!s.done[l.id];
          var art = (s.artifacts && s.artifacts[l.id]) ? s.artifacts[l.id].trim() : "";
          lines.push((isDone ? "[✅ Виконано] " : "[⏳ В процесі] ") + l.title);
          if (art) {
            lines.push("   🛠 Залізячний артефакт: " + art);
          }
        });
        lines.push("");
        lines.push("Сайт курсу: https://kpkta-robotics.github.io/maker-lab/");

        var reportText = lines.join("\n");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(reportText).then(function () {
            if (copyHint) {
              copyHint.textContent = "✓ Повний звіт скопійовано! Надішли його керівнику в Telegram чи Classroom.";
              setTimeout(function () { copyHint.textContent = ""; }, 4000);
            }
          });
        } else {
          prompt("Скопіюй звіт для керівника вручну:", reportText);
        }
      };
    }

    if (printReportBtn) {
      printReportBtn.onclick = function () {
        window.print();
      };
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
