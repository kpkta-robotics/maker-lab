/*
 * КАРТА КУРСУ — єдине місце, де описано модулі, уроки та корисні джерела (відео/інструменти).
 *
 * Як додати новий урок:
 *   1) Створіть HTML-файл уроку у відповідній папці modules/<папка-модуля>/lesson-XX.html
 *   2) Додайте або оновіть об'єкт у масиві lessons нижче (status: "ready", path: "modules/...")
 *   3) Запустіть `python sync_course.py` для перевірки посилань і мовних правил
 *
 * Як додати відео або корисне посилання:
 *   - Додайте об'єкт у `resources` конкретного модуля (відобразиться всередині картки модуля)
 *   - Або додайте об'єкт у загальний масив `COURSE.resources` внизу файлу (відобразиться у блоці джерел на головній)
 */
window.COURSE = {
  title: "Arduino + 3D CAD + 3D Друк + AI + Maker",
  modules: [
    {
      id: "m0",
      title: "Блок 0. Старт і діагностика",
      desc: "Техніка безпеки, знайомство з наборами ТЕКО, встановлення Arduino IDE та вхідна діагностика.",
      lessons: [
        { id: "m0-l01", title: "Техніка безпеки мейкера: захист плати та пальців", time: "25 хв", status: "ready",
          path: "modules/00-diagnostic/lesson-safety.html" },
        { id: "m0-l02", title: "Вхідна діагностика (6 компетентностей)", time: "45 хв", status: "soon" },
        { id: "m0-l03", title: "Налаштування Arduino IDE та драйвера CH340 (плата ТЕКО)", time: "30 хв", status: "ready",
          path: "modules/00-diagnostic/lesson-setup.html" }
      ],
      resources: [
        { type: "tool", title: "Arduino IDE 2.x (Офіційний сайт)", url: "https://www.arduino.cc/en/software", tag: "Програма" },
        { type: "doc", title: "Драйвер CH340 для клонів Arduino (WCH)", url: "https://sparks.gogo.co.nz/ch340.html", tag: "Драйвер" }
      ]
    },
    {
      id: "m1",
      title: "Модуль 1. Основи Arduino",
      desc: "Від першого світлодіода до сенсорів і приводів. Симулятор Wokwi + реальний набір ТЕКО.",
      lessons: [
        { id: "m1-l01", title: "Привіт, Arduino! Перший сигнал і маяк SOS", time: "60–80 хв", status: "ready",
          path: "modules/01-arduino-basics/lesson-01.html" },
        { id: "m1-l02", title: "Кнопка та INPUT_PULLUP: керування світлом", time: "50 хв", status: "ready",
          path: "modules/01-arduino-basics/lesson-02.html" },
        { id: "m1-l03", title: "Світлофор: кілька світлодіодів і масиви", time: "60–80 хв", status: "ready",
          path: "modules/01-arduino-basics/lesson-03.html" },
        { id: "m1-l04", title: "Потенціометр, АЦП (analogRead) і ШІМ (analogWrite)", time: "80 хв", status: "soon" },
        { id: "m1-l05", title: "Serial Monitor, телеметрія і налагодження", time: "60 хв", status: "soon" }
      ],
      resources: [
        { type: "sim", title: "Симулятор Wokwi — створення нового проєкту Arduino Uno", url: "https://wokwi.com/projects/new/arduino-uno", tag: "Симулятор" },
        { type: "video", title: "Відео: Як працює макетна плата (Breadboard) та світлодіод", url: "https://www.youtube.com/results?search_query=arduino+breadboard+led+tutorial+українською", tag: "Відео" },
        { type: "doc", title: "Довідник мови Arduino C++ (Arduino Reference)", url: "https://www.arduino.cc/reference/en/", tag: "Довідник" }
      ]
    },
    {
      id: "m2",
      title: "Модуль 2. 3D-друк та Snapmaker A350",
      desc: "Від калібрування першого шару та нарізки в Luban до серійного друку корпусів, кронштейнів та механіки пристроїв.",
      lessons: [
        { id: "m2-l01", title: "Snapmaker A350: Анатомія та ідеальний перший шар", time: "60–80 хв", status: "ready",
          path: "modules/02-3d-printing/lesson-01.html" },
        { id: "m2-l02", title: "Механіка міцності: периметри, заповнення та орієнтація деталей", time: "70 хв", status: "soon" },
        { id: "m2-l03", title: "Підтримки, мости та геометрія нависань", time: "60 хв", status: "soon" },
        { id: "m2-l04", title: "Допуски та посадки (Clearance): калібрування під сервоприводи SG90/MG90S", time: "80 хв", status: "soon" },
        { id: "m2-l05", title: "Діагностика дефектів друку: Stringing, Warping, Layer Shift", time: "60 хв", status: "soon" },
        { id: "m2-l06", title: "Постобробка та фінальне складання механічних вузлів", time: "90 хв", status: "soon" }
      ],
      resources: [
        { type: "doc", title: "Snapmaker A350: Інтерактивний посібник оператора", url: "modules/02-3d-printing/guide-a350.html", tag: "База знань" },
        { type: "video", title: "Відео: Snapmaker 2.0 A350 — Встановлення модуля 3D-друку та калібрування", url: "https://www.youtube.com/results?search_query=Snapmaker+2.0+A350+3D+printing+setup+calibration", tag: "Відео" },
        { type: "tool", title: "Snapmaker Luban — слайсер та керування верстатом", url: "https://luban.xyz/", tag: "Програма" },
        { type: "doc", title: "Snapmaker Wiki: Офіційний посібник з обслуговування A350", url: "https://wiki.snapmaker.com/", tag: "Документація" }
      ]
    },
    {
      id: "m3",
      title: "Модуль 3. 3D CAD та інженерне моделювання",
      desc: "Проєктування власних корпусів, кронштейнів і захватів під електроніку ТЕКО у Tinkercad та Fusion 360.",
      lessons: [
        { id: "m3-l01", title: "Обмір плати Arduino та датчиків штангенциркулем", time: "60 хв", status: "soon" },
        { id: "m3-l02", title: "Моделювання захисного корпусу з кріпленнями під гвинти М3", time: "80 хв", status: "soon" }
      ],
      resources: [
        { type: "tool", title: "Autodesk Tinkercad — швидке 3D-моделювання в браузері", url: "https://www.tinkercad.com/", tag: "Онлайн CAD" }
      ]
    },
    {
      id: "m4",
      title: "Модуль 4. Maker-проєкт та інтеграція",
      desc: "Командний проєкт: об'єднання надрукованої механіки, сервоприводів, датчиків та коду Arduino у готовий виріб.",
      lessons: [
        { id: "m4-l01", title: "Технічне завдання, розподіл ролей та архітектура пристрою", time: "60 хв", status: "soon" }
      ]
    }
  ],

  /* Глобальна бібліотека корисних джерел та відео на головній сторінці */
  resources: [
    {
      category: "🎥 Відеоуроки та наочні матеріали",
      items: [
        {
          title: "Основи Arduino та макетної плати (добірка українською)",
          desc: "Наочні відео про підключення світлодіодів, кнопок, датчиків та роботу з Arduino IDE.",
          url: "https://www.youtube.com/results?search_query=уроки+arduino+українською",
          badge: "YouTube"
        },
        {
          title: "Snapmaker 2.0 A350: Офіційні відеоінструкції",
          desc: "Збирання верстата, калібрування Heated Bed, заміна філаменту та налаштування Snapmaker Luban.",
          url: "https://www.youtube.com/@Snapmaker/search?query=A350%203D%20printing",
          badge: "Відео"
        },
        {
          title: "Snapmaker Luban: Швидкий відеопосібник зі слайсингу",
          desc: "Покрокове налаштування профілю друку, поворот деталей, підтримки та пошаровий перегляд G-коду.",
          url: "https://www.youtube.com/results?search_query=Snapmaker+Luban+3D+printing+slicer+tutorial",
          badge: "Відео"
        }
      ]
    },
    {
      category: "🛠 Онлайн-інструменти та симулятори",
      items: [
        {
          title: "Wokwi Arduino Simulator",
          desc: "Безкоштовний симулятор електроніки прямо у браузері або зі смартфона. Без ризику спалити деталі.",
          url: "https://wokwi.com/arduino",
          badge: "Симулятор"
        },
        {
          title: "Snapmaker Luban & PrusaSlicer",
          desc: "Програми для підготовки 3D-моделей (STL) до друку та генерації машинного коду G-code.",
          url: "https://luban.xyz/",
          badge: "3D-друк"
        },
        {
          title: "Калькулятор кольорового маркування резисторів",
          desc: "Швидке визначення опору резистора з набору ТЕКО за кольоровими смужками.",
          url: "https://www.digikey.com/en/resources/conversion-calculators/conversion-calculator-resistor-color-code",
          badge: "Електроніка"
        }
      ]
    },
    {
      category: "📦 3D-моделі та документація курсу",
      items: [
        {
          title: "Snapmaker A350: Інтерактивний посібник оператора",
          desc: "Власна база знань майстерні: золотий профіль PLA у Luban, пошук несправностей, універсальний калькулятор партійного друку та квіз.",
          url: "modules/02-3d-printing/guide-a350.html",
          badge: "База знань"
        },
        {
          title: "Каталог відкритих 3D-моделей (Printables & Thingiverse)",
          desc: "Величезна колекція перевірених корпусів, кронштейнів, шестерень та шарнірів для мейкерських проєктів.",
          url: "https://www.printables.com/",
          badge: "STL-каталог"
        }
      ]
    }
  ]
};
