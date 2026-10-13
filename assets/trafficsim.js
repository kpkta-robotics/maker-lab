/*
 * trafficsim.js — інтерактивний симулятор міського світлофора
 * Демонструє роботу масивів пінів, циклів for та фаз перемикання.
 */
(function() {
  const lampR = document.getElementById('lamp-red');
  const lampY = document.getElementById('lamp-yellow');
  const lampG = document.getElementById('lamp-green');
  const phaseDesc = document.getElementById('traffic-desc');
  const codePre = document.getElementById('traffic-code');
  const autoBtn = document.getElementById('traffic-auto-btn');
  const nextBtn = document.getElementById('traffic-next-btn');

  if (!lampR || !lampY || !lampG) return;

  const phases = [
    {
      name: "ФАЗА 1: Червоний сигнал (Стоп)",
      r: true, y: false, g: false, dur: 2500,
      code:
`// ФАЗА 1: Рух заборонено
digitalWrite(PIN_RED, HIGH);
digitalWrite(PIN_YELLOW, LOW);
digitalWrite(PIN_GREEN, LOW);
delay(3000);`
    },
    {
      name: "ФАЗА 2: Червоний + Жовтий (Увага, приготуватися)",
      r: true, y: true, g: false, dur: 1200,
      code:
`// ФАЗА 2: Підготовка до руху
digitalWrite(PIN_RED, HIGH);
digitalWrite(PIN_YELLOW, HIGH);
digitalWrite(PIN_GREEN, LOW);
delay(1000);`
    },
    {
      name: "ФАЗА 3: Зелений сигнал (Рух дозволено)",
      r: false, y: false, g: true, dur: 2500,
      code:
`// ФАЗА 3: Рух відкрито
digitalWrite(PIN_RED, LOW);
digitalWrite(PIN_YELLOW, LOW);
digitalWrite(PIN_GREEN, HIGH);
delay(3000);`
    },
    {
      name: "ФАЗА 4: Зелений блимає (Скоро зміна сигналу)",
      blink: true, dur: 1800,
      code:
`// ФАЗА 4: Зелений блимає 3 рази
for (int i = 0; i < 3; i++) {
  digitalWrite(PIN_GREEN, LOW);  delay(300);
  digitalWrite(PIN_GREEN, HIGH); delay(300);
}`
    },
    {
      name: "ФАЗА 5: Жовтий сигнал (Увага, зупинитися)",
      r: false, y: true, g: false, dur: 1400,
      code:
`// ФАЗА 5: Звільнити перехрестя
digitalWrite(PIN_RED, LOW);
digitalWrite(PIN_YELLOW, HIGH);
digitalWrite(PIN_GREEN, LOW);
delay(1500);`
    }
  ];

  let currentPhase = 0;
  let timerId = null;
  let isRunning = false;
  let blinkInterval = null;

  function renderPhase(pIdx) {
    if (blinkInterval) {
      clearInterval(blinkInterval);
      blinkInterval = null;
    }

    const p = phases[pIdx];
    phaseDesc.textContent = p.name;
    codePre.textContent = p.code;

    if (p.blink) {
      lampR.classList.remove('on');
      lampY.classList.remove('on');
      let blinkState = true;
      lampG.classList.add('on');
      blinkInterval = setInterval(() => {
        blinkState = !blinkState;
        if (blinkState) lampG.classList.add('on');
        else lampG.classList.remove('on');
      }, 300);
    } else {
      if (p.r) lampR.classList.add('on'); else lampR.classList.remove('on');
      if (p.y) lampY.classList.add('on'); else lampY.classList.remove('on');
      if (p.g) lampG.classList.add('on'); else lampG.classList.remove('on');
    }
  }

  function advancePhase() {
    currentPhase = (currentPhase + 1) % phases.length;
    renderPhase(currentPhase);
  }

  function scheduleNext() {
    if (!isRunning) return;
    const dur = phases[currentPhase].dur;
    timerId = setTimeout(() => {
      advancePhase();
      scheduleNext();
    }, dur);
  }

  function startAuto() {
    isRunning = true;
    autoBtn.textContent = '⏸ Призупинити авторежим';
    autoBtn.classList.remove('alt');
    scheduleNext();
  }

  function stopAuto() {
    isRunning = false;
    if (timerId) clearTimeout(timerId);
    if (blinkInterval) clearInterval(blinkInterval);
    autoBtn.textContent = '▶ Запустити авторежим';
    autoBtn.classList.add('alt');
  }

  autoBtn.addEventListener('click', () => {
    if (isRunning) stopAuto();
    else startAuto();
  });

  nextBtn.addEventListener('click', () => {
    stopAuto();
    advancePhase();
  });

  // Початковий рендер першої фази
  renderPhase(0);
})();
