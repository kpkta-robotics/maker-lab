/* Віртуальний маяк: інтерактивна демонстрація delay() без Wokwi і без встановлення чогось.
   Підключається на сторінках, де є елемент з id="ledsim". */
(function () {
  "use strict";
  var box = document.getElementById("ledsim");
  if (!box) return;

  var led = document.getElementById("sim-led");
  var stateEl = document.getElementById("sim-state");
  var onR = document.getElementById("on-range"), offR = document.getElementById("off-range");
  var onV = document.getElementById("on-val"), offV = document.getElementById("off-val");
  var codeEl = document.getElementById("sim-code");
  var btnStart = document.getElementById("sim-start");
  var btnSos = document.getElementById("sim-sos");
  var timer = null, mode = null;

  function setLed(on) {
    led.classList.toggle("on", on);
    stateEl.textContent = on ? "світиться 💡" : "не світиться";
  }

  function stop() {
    clearTimeout(timer); timer = null; mode = null; setLed(false);
    btnStart.textContent = "▶ Запустити блимання";
    btnSos.textContent = "🆘 Показати SOS";
  }

  function codeText() {
    return "void loop() {\n" +
      "  digitalWrite(13, HIGH);  // світлодіод УВІМКНЕНО\n" +
      "  delay(" + onR.value + ");" + new Array(Math.max(1, 14 - String(onR.value).length)).join(" ") + "// чекаємо " + onR.value + " мілісекунд\n" +
      "  digitalWrite(13, LOW);   // світлодіод ВИМКНЕНО\n" +
      "  delay(" + offR.value + ");" + new Array(Math.max(1, 14 - String(offR.value).length)).join(" ") + "// чекаємо " + offR.value + " мілісекунд\n" +
      "}";
  }

  function refresh() {
    onV.textContent = onR.value; offV.textContent = offR.value;
    codeEl.textContent = codeText();
  }

  function blinkStep(on) {
    if (mode !== "blink") return;
    setLed(on);
    timer = setTimeout(function () { blinkStep(!on); }, parseInt(on ? onR.value : offR.value, 10));
  }

  function startBlink() {
    stop(); mode = "blink";
    btnStart.textContent = "■ Зупинити";
    blinkStep(true);
  }

  // SOS: крапка = 1 одиниця, тире = 3, пауза між сигналами = 1, між літерами = 3
  function sosSequence() {
    var U = 220, seq = [], i;
    function sym(len) { seq.push([true, len * U]); seq.push([false, U]); }
    for (i = 0; i < 3; i++) sym(1);
    seq.push([false, 2 * U]);
    for (i = 0; i < 3; i++) sym(3);
    seq.push([false, 2 * U]);
    for (i = 0; i < 3; i++) sym(1);
    seq.push([false, 7 * U]);
    return seq;
  }

  function startSos() {
    stop(); mode = "sos";
    btnSos.textContent = "■ Зупинити SOS";
    var seq = sosSequence(), k = 0;
    (function step() {
      if (mode !== "sos") return;
      var s = seq[k % seq.length]; k++;
      setLed(s[0]);
      timer = setTimeout(step, s[1]);
    })();
  }

  onR.addEventListener("input", refresh);
  offR.addEventListener("input", refresh);
  btnStart.addEventListener("click", function () { if (mode === "blink") stop(); else startBlink(); });
  btnSos.addEventListener("click", function () { if (mode === "sos") stop(); else startSos(); });

  refresh(); setLed(false);
})();
