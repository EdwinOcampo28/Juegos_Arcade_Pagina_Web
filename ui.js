export function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
export function message(t,type=''){return `<div class="message ${type}">${escapeHtml(t)}</div>`}
export function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.querySelector('#toast-container').append(e);setTimeout(()=>e.remove(),2500)}
export function randomInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}
export function gamePanel(content){return `<div class="game-panel">${content}</div>`}
export function askName(){
  try {
    const users=JSON.parse(localStorage.getItem('neon_arcade_users_v4')||'[]');
    const id=localStorage.getItem('neon_arcade_active_user_v4');
    return users.find(user=>user.id===id)?.username || 'Jugador';
  } catch { return 'Jugador'; }
}
export function $(selector){return document.querySelector(selector)}
