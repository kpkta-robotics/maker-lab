/*
 * buttonsim.js — інтерактивний симулятор тактової кнопки та світлодіода
 * Допомагає зрозуміти роботу INPUT_PULLUP та різницю між прямим утриманням і тригером.
 */
(function() {
  const btn = document.getElementById('sim-btn');
  const led = document.getElementById('sim-btn-led');
  const pinVal = document.getElementById('sim-pin-val');
  const ledState = document.getElementById('sim-led-state');
  const codePre = document.getElementById('sim-btn-code');
  const modeMomentary = document.getElementById('mode-momentary');
  const modeToggle = document.getElementById('mode-toggle');

  if (!btn || !led) return;

  let isPressed = false;
  let isLedOn = false;
  let mode = 'momentary'; // 'momentary' або 'toggle'

  function updateDisplay() {
    // Вхідний пін 2 з INPUT_PULLUP: коли кнопка відпущена — HIGH (5V), коли натиснута — LOW (GND)
    if (isPressed) {
      pinVal.innerHTML = '<span class="val low">LOW (0V / GND)</span>';
    } else {
      pinVal.innerHTML = '<span class="val high">HIGH (5V / PULLUP)</span>';
    }

    if (mode === 'momentary') {
      isLedOn = isPressed;
    }

    if (isLedOn) {
      led.classList.add('on');
      ledState.textContent = 'СВІТИТЬСЯ (HIGH)';
      ledState.style.color = '#4ade80';
    } else {
      led.classList.remove('on');
      ledState.textContent = 'НЕ СВІТИТЬСЯ (LOW)';
      ledState.style.color = '#94a3b8';
    }

    renderCode();
  }

  function renderCode() {
    if (mode === 'momentary') {
      codePre.textContent =
`// РЕЖИМ 1: Світиться, поки затиснуто кнопку
void loop() {
  int buttonState = digitalRead(2); // зараз читає: ${isPressed ? 'LOW' : 'HIGH'}
  
  if (buttonState == LOW) {        // Натиснута (замкнена на GND)
    digitalWrite(13, HIGH);        // Світлодіод СВІТИТЬСЯ
  } else {                         // Відпущена (підтягнута до 5V)
    digitalWrite(13, LOW);         // Світлодіод ВИМКНЕНО
  }
}`;
    } else {
      codePre.textContent =
`// РЕЖИМ 2: Перемикач (одне натискання — вкл, друге — викл)
// Стан світлодіода: ${isLedOn ? 'УВІМКНЕНО' : 'ВИМКНЕНО'}
void loop() {
  if (digitalRead(2) == LOW) {     // Спіймали натискання!
    ledState = !ledState;          // Перемикаємо прапорець
    digitalWrite(13, ledState ? HIGH : LOW);
    delay(200);                    // Захист від брязкоту контактів
    while(digitalRead(2) == LOW);  // Чекаємо, доки відпустять кнопку
  }
}`;
    }
  }

  function handlePressStart(e) {
    if (e) e.preventDefault();
    if (isPressed) return;
    isPressed = true;
    btn.classList.add('pressed');

    if (mode === 'toggle') {
      isLedOn = !isLedOn;
    }
    updateDisplay();
  }

  function handlePressEnd(e) {
    if (e) e.preventDefault();
    if (!isPressed) return;
    isPressed = false;
    btn.classList.remove('pressed');
    updateDisplay();
  }

  // Події для мишки та сенсорних екранів
  btn.addEventListener('mousedown', handlePressStart);
  window.addEventListener('mouseup', handlePressEnd);

  btn.addEventListener('touchstart', handlePressStart, { passive: false });
  window.addEventListener('touchend', handlePressEnd, { passive: false });
  window.addEventListener('touchcancel', handlePressEnd, { passive: false });

  // Клавіатура (пробіл або Enter при фокусі на кнопці)
  btn.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') handlePressStart(e);
  });
  btn.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Enter') handlePressEnd(e);
  });

  if (modeMomentary && modeToggle) {
    modeMomentary.addEventListener('click', () => {
      mode = 'momentary';
      modeMomentary.classList.remove('alt');
      modeToggle.classList.add('alt');
      updateDisplay();
    });
    modeToggle.addEventListener('click', () => {
      mode = 'toggle';
      modeToggle.classList.remove('alt');
      modeMomentary.classList.add('alt');
      updateDisplay();
    });
  }

  updateDisplay();
})();
