import { api } from './api.js';
import { $, escapeHtml, toast } from './ui.js';

export async function saveGameScore(game, name, score) {
  try {
    const result = await api.score({ game, score });
    toast(`Puntaje guardado · +${result.xp} XP · Nivel ${result.level}`);
    return result;
  } catch (e) {
    console.error(e);
    toast(e.message || 'No se pudo guardar el puntaje.');
    return null;
  }
}

export async function renderRankings() {
  const container = $('#ranking-content');
  if (!container) return;
  const data = await api.rankings();
  container.innerHTML = data.map(group => `<article class="ranking-card">
    <h3>🏆 ${escapeHtml(group.game)}</h3>
    ${group.rows.length ? group.rows.map((item,i) => `<div class="ranking-row"><span>#${i+1}</span><span>${escapeHtml(item.username)}</span><strong>${item.score}</strong></div>`).join('') : '<div class="empty">No hay registros todavía.</div>'}
  </article>`).join('');
}
