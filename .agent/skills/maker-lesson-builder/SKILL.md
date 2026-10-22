---
name: maker-lesson-builder
description: >-
  Інженерний генератор, аудитор та конструктор уроків освітньої платформи «Адаптивна цифрова майстерня» (Arduino + 3D CAD + Snapmaker A350 + AI + Maker).
  Використовуйте для створення нових уроків (1.4 про ШІМ, 1.5 про Serial Monitor, 2.2 про міцність 3D-друку тощо),
  аудиту наявних уроків, оновлення реєстру assets/course.js та автоматичної перевірки через sync_course.py.
---

# Maker Lesson Builder — Системний скіл розробки уроків

Цей скіл призначений для швидкого та безпомилкового проектування, наповнення, аудиту та публікації уроків освітньої платформи **«Адаптивна цифрова майстерня»** (КПКТА).

---

## 1. Режими роботи скіла

Коли користувач просить створити, перевірити або покращити урок, активуйте один із 4 режимів:

### Режим A: `create` (Створення нового уроку)
1. **Скласти короткий «Паспорт уроку» на узгодження (до 1 екрана):**
   * ID уроку (наприклад `m1-l04`), назва та модуль;
   * Обіцянка результату («Через 45 хв ти зможеш...»);
   * Опис 2 інтерактивних симуляторів у браузері (що крутить учень і що змінюється на екрані);
   * Залізячна практика на наборі ТЕКО або верстаті Snapmaker A350;
   * 4 рівні виклику (Explorer, Builder, Maker, Master);
   * Пункти фінального чек-листа допуску.
2. **Згенерувати HTML-файл** у відповідній папці `modules/XX-module/lesson-YY.html` на основі еталонного шаблону нижче.
3. **Зареєструвати урок** у `assets/course.js` (змінити статус з `"soon"` на `"ready"`).
4. **Запустити валідатор:** `python sync_course.py`.
5. **Синхронізувати** з папкою `arduino-course/`.

### Режим B: `audit` (Технічний аудит наявного уроку)
Перевірити наявний файл уроку за 8 обов'язковими критеріями:
1. Чи підключено спільні файли `assets/lesson.css` та `assets/lesson.js` (без дублювання коду)?
2. Чи наявний двоколонковий макет (`.toc` + `.meter` ліворуч, `<main>` праворуч)?
3. Чи працюють інтерактивні стенди і чи блокуються чекбокси до виконання дії?
4. Чи додано рубрику `🔗 Де це працює в реальному залізі` з промисловими кейсами?
5. Чи є картка `🤖 Спитай ШІ` з кнопкою `📋 Скопіювати промпт`?
6. Чи є блок щоденника залізячного артефакту та кнопка «Exit Ticket»?
7. Чи дотримано суворої **гендерної нейтральності** української мови (жодних `ти зробив`)?
8. Чи всі посилання є **відносними** (`../../index.html`, без зовнішніх absolute URL сайту)?

### Режим C: `improve` (Покращення уроку)
* Внесення точкових правок без переписування всього файлу;
* Додавання симуляторів, якщо урок був суто текстовим;
* Посилення зв'язку з реальним верстатом Snapmaker A350 чи платою ТЕКО;
* Повторна перевірка валідатором.

### Режим D: `register` (Реєстрація та зв'язки)
* Додавання уроку в `window.COURSE.modules[...].lessons` у `assets/course.js`;
* Оновлення хлібних крихт та навігації «← Попередній / Наступний урок →»;
* Перевірка цілісності через `python sync_course.py`.

---

## 2. Обов'язкова структура уроку (Каркас 0–8)

Кожен файл уроку `lesson-XX.html` повинен мати таку послідовність блоків:

1. **`<head>`**: Google Fonts (Unbounded, Golos Text, JetBrains Mono), унікальний `<style>` лише для локальних симуляторів, та обов'язково `<link rel="stylesheet" href="../../assets/lesson.css">` **після нього**.
2. **`<body class="lesson-page" data-lesson="mX-lYY" data-root="../../">`**.
3. **`<nav class="topbar">`**: хлібні крихти `../../index.html` → назва модуля → кнопка наступного уроку.
4. **`<header class="hero">`**:
   * Ліва колонка: `.kicker` (Модуль X, Урок Y), `<h1>` (Яскрава назва), `.promise` (Що конкретно буде створено за урок), `.facts` (Час, Рівень, Обладнання);
   * Права колонка: `.hero-board` (SVG-схема плати, сигналу, сопла або 3D-вузла з анімацією).
5. **`<div class="layout">`**:
   * **`<aside class="toc">`**: нумерований список посилань `#s0`–`#s8`, шкала `.meter` із `<b id="meter-text">` та `<span id="meter-bar">`;
   * **`<main>`**:
     * `#s0`: **Спробуй зараз** — швидкий інтерактив у перші 3 хвилини;
     * `#s1`: **Анатомія та фізика явища** — наочні SVG, мікроконтролер, плата, верстат;
     * `#s2`: **Перший успіх** — покрокова схема складання чи нарізки;
     * `#s3`: **Пограй із параметрами** — зміна таймінгів, напруги або Z-Offset;
     * `#s4`: **Зламай його (Troubleshooting)** — типові симптоми аварій та перевантажень;
     * `#s5`: **Виклик** — 4 вкладки рівнів: Explorer, Builder, Maker, Master;
     * **`🔗 Де це працює в реальному залізі`** — промислові аналоги (БПЛА, ЧПК, сенсори);
     * **`🤖 Спитай ШІ як помічника`** — промпт із симптомом та гіпотезою + кнопка копіювання;
     * `#s6`: **Перевір себе** — картки `<details><summary>` для самоконтролю;
     * `#s7`: **★ На справжньому обладнанні** — робота з ТЕКО або Snapmaker A350;
     * `#s8`: **✓ Завершення** — чек-лист обов'язкових пунктів, автогенерований віджет Щоденника артефактів, кнопка Exit Ticket та посилання на наступний урок.

---

## 3. Еталонний робочий шаблон уроку (HTML Starter)

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Урок X.Y: [Назва уроку] · КПКТА</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700&family=Golos+Text:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    /* Лише унікальні стилі локального симулятора уроку */
  </style>
  <link rel="stylesheet" href="../../assets/lesson.css">
</head>
<body class="lesson-page" data-lesson="mX-lYY" data-root="../../">

<nav class="topbar" aria-label="Навігація курсом">
  <div class="crumbs">
    <a href="../../index.html">Карта курсу</a>
    <span aria-hidden="true">/</span><span>[Назва Модуля]</span>
  </div>
  <a href="lesson-ZZ.html">[Наступний урок] →</a>
</nav>

<header class="hero">
  <div>
    <p class="kicker">Модуль X · Урок Y</p>
    <h1>[Інженерна назва уроку]</h1>
    <p class="promise">[Конкретна обіцянка: через 45 хвилин ти налаштуєш / збереш / надрукуєш...]</p>
    <ul class="facts">
      <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>[XX] хв заняття</li>
      <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>[Початковий / Базовий] рівень</li>
      <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>Wokwi / ТЕКО / Snapmaker</li>
    </ul>
  </div>
  <figure class="hero-board" style="margin:0">
    <svg class="board" viewBox="0 0 320 220" role="img" aria-label="Інтерактивна схема">
      <rect width="320" height="220" rx="10" fill="#0C2A31" stroke="#1A4B56" stroke-width="1.5"/>
      <text x="160" y="115" text-anchor="middle" fill="#4ADE80" font-family="JetBrains Mono, monospace" font-size="14">[SVG СХЕМА / ПЛАТА]</text>
    </svg>
    <figcaption>[Підпис: що демонструє стенд]</figcaption>
  </figure>
</header>

<div class="layout">
  <aside class="toc" aria-label="Зміст уроку">
    <ol>
      <li><a href="#s0"><b>0</b>Спробуй зараз</a></li>
      <li><a href="#s1"><b>1</b>Анатомія і фізика</a></li>
      <li><a href="#s2"><b>2</b>Перша схема / код</a></li>
      <li><a href="#s3"><b>3</b>Керування та змінні</a></li>
      <li><a href="#s4"><b>4</b>Зламай його (Дебаг)</a></li>
      <li><a href="#s5"><b>5</b>Інженерний виклик</a></li>
      <li><a href="#s6"><b>6</b>Перевір себе</a></li>
      <li><a href="#s7"><b>★</b>На живому залізі</a></li>
      <li><a href="#s8"><b>✓</b>Завершення</a></li>
    </ol>
    <div class="meter"><p>Чек-лист: <b id="meter-text">0 з 5</b></p><div class="bar"><span id="meter-bar"></span></div></div>
  </aside>

  <main>
    <div class="prose">
      <p class="lead">[Вступ: навіщо це потрібно в реальному пристрої під ключ].</p>
    </div>

    <!-- Крок 0 -->
    <section class="step" id="s0">
      <div class="step-head"><span class="step-num">0</span><h2>Спробуй зараз: Інтерактивний стенд</h2></div>
      <!-- Інтерактив -->
    </section>

    <!-- Крок 1 -->
    <section class="step" id="s1">
      <div class="step-head"><span class="step-num">1</span><h2>Анатомія та фізичні принципи</h2></div>
      <!-- Теорія без води -->
    </section>

    <!-- Крок 2-5 -->
    <!-- ... Подальші кроки за каркасом ... -->

    <!-- Рубрика: Де це працює в реальному залізі -->
    <div class="callout hardware">
      <b>🔗 Де це працює в реальному залізі</b>
      <p>[Опис 2–3 прикладів з промисловості: БПЛА, медичне обладнання, ЧПК, робототехніка].</p>
    </div>

    <!-- AI Callout -->
    <div class="callout ai">
      <b>🤖 Спитай ШІ як інженерного консультанта</b>
      <p>Опиши симптом і технічні умови замість «напиши за мене»:</p>
      <div class="prompt-box">
        <p id="ai-prompt-lesson"><em>«[Готовий грамотний промпт українською мовою з симптомом, гіпотезою та платою ТЕКО / верстатом A350]»</em></p>
        <button class="copy-btn" data-target="ai-prompt-lesson">📋 Скопіювати промпт</button>
      </div>
    </div>

    <!-- Крок 6 -->
    <section class="step" id="s6">
      <div class="step-head"><span class="step-num">6</span><h2>Перевір себе</h2></div>
      <div class="cards">
        <details><summary>[Питання 1]?</summary><p>[Відповідь з поясненням фізики].</p></details>
        <details><summary>[Питання 2]?</summary><p>[Відповідь].</p></details>
      </div>
    </section>

    <!-- Крок 7 -->
    <section class="step" id="s7">
      <div class="step-head"><span class="step-num bonus">★</span><h2>Практика на живому обладнанні</h2></div>
      <ol class="how">
        <li>Підготуй робоче місце та знеструми плату.</li>
        <li>Збери схему на макетці ТЕКО / перевір калібрування Snapmaker.</li>
        <li>Завантаж перевірочний скетч.</li>
      </ol>
    </section>

    <!-- Крок 8 -->
    <section class="step" id="s8">
      <div class="step-head"><span class="step-num final">✓</span><h2>Завершення та збереження прогресу</h2></div>
      <p><strong>Обов'язково для проходження уроку:</strong></p>
      <ul class="checklist">
        <li><label><input type="checkbox" class="check" data-key="task1"><span>[Пункт 1]</span></label></li>
        <li><label><input type="checkbox" class="check" data-key="task2"><span>[Пункт 2]</span></label></li>
        <li><label><input type="checkbox" class="check" data-key="task3"><span>[Пункт 3]</span></label></li>
      </ul>

      <!-- Сюди assets/lesson.js автоматично вбудовує Щоденник артефактів та кнопку Exit Ticket -->
      <div class="done-row">
        <button class="btn-done" id="done-btn">Позначити урок пройденим</button>
        <span id="done-hint"></span>
      </div>

      <div class="callout next">
        <b>У наступному уроці</b>
        <p>[Анонс наступної теми].</p>
        <p><a href="lesson-ZZ.html">Перейти до наступного уроку →</a></p>
      </div>
    </section>
  </main>
</div>

<footer>КПКТА імені Бадрі Лолашвілі · Курс «Адаптивна цифрова майстерня» · 2026</footer>

<script src="../../assets/lesson.js"></script>
<script>
  // Локальна логіка інтерактивних стендів уроку
</script>
</body>
</html>
```

---

## 4. Чек-лист перед здачею уроку

Перед тим як повідомити користувачеві про готовність уроку, обов'язково виконайте:
1. `python sync_course.py` — має видати `0 errors, 0 warnings`.
2. Перевірити, що урок зареєстровано в `assets/course.js` зі статусом `"ready"`.
3. Перевірити, що файл скопійовано в обидві папки (`maker-lab` і `arduino-course`).
4. Надати користувачеві клікабельне посилання `file:///` для перегляду.
