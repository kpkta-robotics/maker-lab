/*
 * КАРТА КУРСУ — єдине місце, де описано модулі й уроки.
 * Щоб додати урок:
 *   1) скопіюйте _template/lesson.html у потрібну папку модуля;
 *   2) додайте об'єкт у масив lessons нижче (status: "ready");
 *   3) зробіть commit — сайт оновиться сам.
 * status: "ready" — урок готовий, "soon" — запланований (без посилання).
 * path — шлях від кореня сайту.
 */
window.COURSE = {
  title: "Arduino + 3D CAD + 3D Друк + AI + Maker",
  modules: [
    {
      id: "m0",
      title: "Блок 0. Старт і діагностика",
      desc: "Техніка безпеки, знайомство з наборами ТЕКО, вхідна діагностика.",
      lessons: [
        { id: "m0-l01", title: "Техніка безпеки та правила майстерні", time: "30 хв", status: "soon" },
        { id: "m0-l02", title: "Вхідна діагностика (6 компетентностей)", time: "45 хв", status: "soon" },
        { id: "m0-l03", title: "Налаштування Arduino IDE та драйвера CH340 (плата ТЕКО)", time: "30 хв", status: "ready",
          path: "modules/00-diagnostic/lesson-setup.html" }
      ]
    },
    {
      id: "m1",
      title: "Модуль 1. Основи Arduino",
      desc: "Від першого світлодіода до сенсорів і приводів. Wokwi + набір ТЕКО.",
      lessons: [
        { id: "m1-l01", title: "Привіт, Arduino! (Blink і SOS)", time: "60–80 хв", status: "ready",
          path: "modules/01-arduino-basics/lesson-01.html" },
        { id: "m1-l02", title: "Кнопка та INPUT_PULLUP", time: "50 хв", status: "ready",
          path: "modules/01-arduino-basics/lesson-02.html" },
        { id: "m1-l03", title: "Світлофор: кілька світлодіодів і масиви", time: "60–80 хв", status: "ready",
          path: "modules/01-arduino-basics/lesson-03.html" },
        { id: "m1-l04", title: "Потенціометр, АЦП і ШІМ", time: "80 хв", status: "soon" },
        { id: "m1-l05", title: "Serial Monitor і налагодження", time: "60 хв", status: "soon" }
      ]
    },
    {
      id: "m2",
      title: "Модуль 2. 3D CAD і 3D-друк",
      desc: "Корпуси та кріплення під компоненти ТЕКО: Tinkercad, Fusion 360, слайсер.",
      lessons: [
        { id: "m2-l01", title: "Обмір плати Arduino штангенциркулем", time: "60 хв", status: "soon" }
      ]
    },
    {
      id: "m3",
      title: "Модуль 3. Maker-проєкт",
      desc: "Командний проєкт: від проблеми до працюючого пристрою у власному корпусі.",
      lessons: [
        { id: "m3-l01", title: "Технічне завдання і ролі в команді", time: "60 хв", status: "soon" }
      ]
    }
  ]
};
