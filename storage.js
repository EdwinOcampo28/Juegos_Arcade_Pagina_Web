const KEY = "sistema_modular_juegos_rankings_v1";

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

export function getRanking(game) {
  const data = readAll();
  return Array.isArray(data[game]) ? data[game] : [];
}

export function saveScore(game, name, score) {
  if (!name || !Number.isFinite(score) || score < 0) return;
  const data = readAll();
  const ranking = Array.isArray(data[game]) ? data[game] : [];
  ranking.push({ name: name.trim(), score: Math.floor(score) });
  ranking.sort((a, b) => b.score - a.score);
  data[game] = ranking.slice(0, 5);
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearRankings() {
  localStorage.removeItem(KEY);
}

export function allRankings() {
  return readAll();
}
