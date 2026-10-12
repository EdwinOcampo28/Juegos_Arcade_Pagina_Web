import { randomInt, askName, gamePanel, message } from "../ui.js";
import { saveGameScore } from "../ranking.js";

export function render(container) {
  const game = 'Adivina Número';
  let secret = 1, attempts = 10, score = 0, streak = 0, combo = 0, bestCombo = 0;
  let finished = false, saved = false, low = 1, high = 100, hintIndex = 0;
  const usedHints = new Set();
  container.innerHTML = gamePanel(`<section class="guess-arcade guess-compact">
    <header class="guess-hero"><div><span class="badge">🎯 RETO NEÓN · 1–100</span><h2>Encuentra el número</h2><p>10 intentos. Pistas reales. ¡Encadena aciertos para multiplicar tu combo!</p></div><div class="guess-hero-orb" aria-hidden="true">⚡</div></header>
    <div class="guess-stats"><div class="stat"><small>Intentos</small><strong id="attempts">10</strong></div><div class="stat"><small>Puntos</small><strong id="score">0</strong></div><div class="stat"><small>Racha</small><strong id="streak">0 🔥</strong></div><div class="stat"><small>Combo</small><strong id="combo">x0</strong></div></div>
    <div class="guess-range"><div class="guess-range-label"><span>🔎 Rango posible</span><strong id="range-label">1 — 100</strong></div><div class="progress"><div id="guess-progress" style="width:100%"></div></div></div>
    <form id="guess-form" class="guess-form"><input id="guess" class="input" type="number" min="1" max="100" placeholder="Número del 1 al 100" autocomplete="off" required><button id="send" class="btn btn-primary" type="submit">Probar ⚡</button></form>
    <div id="result" class="guess-result" aria-live="polite">🚀 La ronda está lista. Elige tu primer número.</div>
    <div class="guess-actions"><button id="guess-hint" class="btn btn-secondary" type="button">💡 Pista real (−1 intento)</button><button id="guess-start" class="btn btn-secondary" type="button">↻ Nueva ronda</button><button id="guess-save" class="btn btn-secondary" type="button" disabled>Guardar resultado</button></div>
    <p class="muted guess-hint-status" id="guess-hint-status">Las pistas se basan en el número secreto y en el rango que ya descartaste.</p>
  </section>`);
  const $ = id => container.querySelector('#' + id), input = $('guess'), result = $('result');
  function update() {
    $('attempts').textContent = attempts;
    $('score').textContent = score;
    $('streak').textContent = `${streak} 🔥`;
    $('combo').textContent = `x${Math.max(1, combo)}`;
    $('range-label').textContent = `${low} — ${high}`;
    $('guess-progress').style.width = `${attempts * 10}%`;
    input.min = low; input.max = high;
  }
  function start() {
    secret = randomInt(1, 100); attempts = 10; score = 0; combo = 0; finished = false; saved = false;
    low = 1; high = 100; hintIndex = 0; usedHints.clear();
    input.disabled = false; input.value = ''; $('send').disabled = false; $('guess-save').disabled = true; $('guess-save').textContent = 'Guardar resultado';
    $('guess-hint').disabled = false; $('guess-hint-status').textContent = 'Pistas reales: paridad, divisibilidad, intervalo y suma de cifras. Cada pista consume un intento.';
    update(); result.innerHTML = message('🎮 ¡Ronda iniciada! El número está entre 1 y 100.', 'info'); input.focus();
  }
  function finish(win) {
    finished = true; input.disabled = true; $('send').disabled = true; $('guess-hint').disabled = true; $('guess-save').disabled = false;
    if (win) {
      streak++; combo++; bestCombo = Math.max(bestCombo, combo);
      const bonus = Math.min(50, streak * 5) + Math.max(0, combo - 1) * 3;
      score = Math.max(10, attempts * 8 + bonus);
      result.innerHTML = message(`🏆 ¡ACIERTO! Era ${secret}. +${score} puntos · Racha ${streak} · Bonus de combo +${bonus}.`, 'success');
    } else {
      streak = 0; combo = 0;
      result.innerHTML = message(`💥 Se acabaron los intentos. El número era ${secret}. ¡Nueva ronda para recuperar la racha!`, 'error');
    }
    update();
  }
  $('guess-form').onsubmit = e => {
    e.preventDefault(); if (finished) return;
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < low || value > high) { result.innerHTML = message(`Escribe un entero entre ${low} y ${high}.`, 'error'); input.focus(); return; }
    attempts--;
    if (value === secret) { finish(true); return; }
    if (value < secret) low = Math.max(low, value + 1); else high = Math.min(high, value - 1);
    const diff = Math.abs(value - secret); combo = diff < 10 ? combo + 1 : 0; bestCombo = Math.max(bestCombo, combo);
    const proximity = diff <= 3 ? '🔥 ¡Ardiendo! Estás a 3 o menos.' : diff <= 8 ? '✨ ¡Caliente! Vas cerca.' : diff <= 20 ? '🌡️ Tibio: ajusta el rango.' : '❄️ Frío: prueba al otro extremo del rango.';
    update(); result.innerHTML = message(`${value < secret ? '⬆️ Más alto' : '⬇️ Más bajo'}. ${proximity} Quedan ${attempts} intento${attempts === 1 ? '' : 's'}.`, 'warn');
    input.value = ''; input.focus(); if (attempts <= 0) finish(false);
  };
  $('guess-hint').onclick = () => {
    if (finished || attempts <= 0) return;
    const digitSum = String(secret).split('').reduce((sum, digit) => sum + Number(digit), 0);
    const isPrime = n => { if (n < 2) return false; for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false; return true; };
    const clues = [
      [`El número es ${secret % 2 ? 'IMPAR' : 'PAR'}.`, 'paridad'],
      [`${secret % 5 === 0 ? 'Sí' : 'No'} es múltiplo de 5.`, 'múltiplo de 5'],
      [`${isPrime(secret) ? 'Es primo' : 'No es primo (tiene más divisores que 1 y él mismo)'}.`, 'primalidad'],
      [`La suma de sus cifras es ${digitSum}.`, 'suma de cifras'],
      [`Está en la mitad ${secret <= 50 ? 'inferior (1–50)' : 'superior (51–100)'} del rango original.`, 'mitad']
    ];
    const available = clues.filter(([, key]) => !usedHints.has(key));
    if (!available.length) { $('guess-hint-status').textContent = 'Ya utilizaste todas las pistas únicas de esta ronda.'; return; }
    const [clue, key] = available[hintIndex % available.length]; hintIndex++; usedHints.add(key); attempts--; update();
    $('guess-hint-status').textContent = `💡 Pista real: ${clue} (−1 intento)`;
    if (attempts <= 0) finish(false);
  };
  $('guess-start').onclick = start;
  $('guess-save').onclick = () => { if (saved || !finished) return; const name = askName(); if (!name) return; saveGameScore(game, name, score); saved = true; $('guess-save').textContent = '✓ Resultado guardado'; $('guess-save').disabled = true; result.innerHTML += message('💾 Resultado guardado en el ranking local.', 'success'); };
  start();
}
