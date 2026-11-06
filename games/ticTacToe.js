export function render(root, saveScore) {
  let board = Array(9).fill(''), turn = 'X', over = false, saved = false, result = '';
  let computerTimer = null;
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function check() {
    for (const line of wins) { const [a,b,c] = line; if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]; }
    return board.every(Boolean) ? 'draw' : null;
  }
  function finishIfNeeded() { const outcome = check(); if (outcome) { over = true; result = outcome; return true; } return false; }
  function draw() {
    if (over) {
      const score = result === 'X' ? 100 : result === 'draw' ? 40 : 0;
      root.innerHTML = `<section class="game-panel mini-game-result"><div class="mini-emoji">${result === 'X' ? '🏆' : result === 'draw' ? '🤝' : '🤖'}</div><span class="eyebrow">TRES EN RAYA</span><h2>${result === 'X' ? '¡Ganaste!' : result === 'draw' ? 'Empate.' : 'La máquina ganó'}</h2><p>${result === 'X' ? 'Buena estrategia.' : result === 'draw' ? '¡Estuvieron parejos!' : 'Inténtalo de nuevo y bloquea sus líneas.'}</p><button id="ttt-save" class="btn btn-primary" ${saved ? 'disabled' : ''}>${saved ? '✓ Puntaje guardado' : 'Guardar resultado y XP'}</button><button id="ttt-again" class="btn secondary">↻ Nueva partida</button><p id="ttt-status" class="muted" aria-live="polite"></p></section>`;
      root.querySelector('#ttt-save').onclick = async () => {
        if (saved) return; const button = root.querySelector('#ttt-save'); button.disabled = true; button.textContent = 'Guardando…';
        try { await saveScore(score); saved = true; button.textContent = '✓ Puntaje guardado'; const status = root.querySelector('#ttt-status'); if (status) status.textContent = 'Resultado registrado.'; }
        catch (error) { button.disabled = false; button.textContent = 'Guardar resultado y XP'; const status = root.querySelector('#ttt-status'); if (status) status.textContent = error.message || 'No se pudo guardar.'; }
      };
      root.querySelector('#ttt-again').onclick = start; return;
    }
    root.innerHTML = `<section class="game-panel mini-game-panel"><span class="badge">TRES EN RAYA</span><h2>Tú eres ✕, la máquina es ◯</h2><p class="muted">Haz una línea de tres antes que la computadora.</p><div class="ttt-board">${board.map((v,i) => `<button class="ttt-cell" data-cell="${i}" ${v || turn !== 'X' ? 'disabled' : ''}>${v === 'X' ? '✕' : v === 'O' ? '◯' : ''}</button>`).join('')}</div><p class="mini-feedback" aria-live="polite">${turn === 'X' ? 'Tu turno' : 'La máquina está pensando…'}</p></section>`;
    root.querySelectorAll('[data-cell]').forEach(button => button.onclick = () => {
      const index = Number(button.dataset.cell); if (over || turn !== 'X' || board[index]) return;
      board[index] = 'X'; if (finishIfNeeded()) { draw(); return; }
      turn = 'O'; draw(); clearTimeout(computerTimer); computerTimer = setTimeout(computerMove, 260);
    });
  }
  function computerMove() {
    if (over) return; const choices = board.map((value,index) => value ? null : index).filter(index => index !== null);
    const winningMove = mark => { for (const index of choices) { board[index] = mark; const outcome = check(); board[index] = ''; if (outcome === mark) return index; } return null; };
    let index = winningMove('O'); if (index === null) index = winningMove('X'); if (index === null && board[4] === '') index = 4; if (index === null && choices.length) index = choices[Math.floor(Math.random() * choices.length)];
    if (index !== null && index !== undefined) board[index] = 'O'; if (!finishIfNeeded()) turn = 'X'; draw();
  }
  function start() { clearTimeout(computerTimer); board = Array(9).fill(''); turn = 'X'; over = false; saved = false; result = ''; draw(); }
  start();
}
