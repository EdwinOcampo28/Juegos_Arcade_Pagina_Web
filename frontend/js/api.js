// Persistencia local multiusuario: no utiliza MySQL, backend ni servicios externos.
const USERS_KEY = 'neon_arcade_users_v4';
const ACTIVE_KEY = 'neon_arcade_active_user_v4';
const SCORES_KEY = 'neon_arcade_scores_v4';
const LOG_KEY='neon_arcade_activity_v1';
const logEvent=(action,details='')=>{const a=read(LOG_KEY,[]);a.unshift({id:uid(),action,details,user:currentRaw()?.username||'Sistema',date:new Date().toISOString()});write(LOG_KEY,a.slice(0,150));};
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
// Cada nivel exige más XP que el anterior: 100, 150, 200, 250...
const levelProgress = value => {
  let remaining = Math.max(0, Number(value) || 0), level = 1, required = 100;
  while (remaining >= required) { remaining -= required; level++; required = 100 + (level - 1) * 50; }
  return { level, xpIntoLevel: remaining, xpToNext: required, progress: Math.min(100, Math.floor(remaining / required * 100)) };
};
const levelFromXp = xp => levelProgress(xp).level;
const cleanUser = u => {
  const xp = Number(u.xp) || 0, progression = levelProgress(xp);
  return { id:u.id, username:u.username, email:u.email, role:u.role, xp, gamesPlayed:Number(u.gamesPlayed)||0, wins:Number(u.wins)||0, createdAt:u.createdAt, avatar:u.avatar||'⚡', bio:u.bio||'', favoriteGames:u.favoriteGames||[], achievements:u.achievements||[], ...progression };
};
const users = () => read(USERS_KEY, []);
const setUsers = value => write(USERS_KEY, value);
const scores = () => read(SCORES_KEY, []);
const activeId = () => localStorage.getItem(ACTIVE_KEY);
function currentRaw() { return users().find(u => u.id === activeId()) || null; }
function requireUser() { const u=currentRaw(); if(!u) throw new Error('Inicia sesión para continuar.'); return u; }
async function hashPassword(password) {
  if (!globalThis.crypto?.subtle) throw new Error('El navegador no permite proteger la contraseña. Ejecuta INICIAR_LOCAL_WINDOWS.bat y abre localhost.');
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function register({username,email,password}) {
  username=String(username||'').trim(); email=String(email||'').trim().toLowerCase();
  if(username.length<3) throw new Error('El nombre debe tener al menos 3 caracteres.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Escribe un correo válido.');
  if(String(password||'').length<6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
  const list=users();
  if(list.some(u=>u.username.toLowerCase()===username.toLowerCase())) throw new Error('Ese nombre de usuario ya existe.');
  if(list.some(u=>u.email.toLowerCase()===email)) throw new Error('Ese correo ya está registrado.');
  const isFirst=list.length===0;
  const legacy= isFirst ? read('neon_arcade_local_player_v3', null) : null;
  const u={id:uid(),username,email,passwordHash:await hashPassword(password),role:isFirst?'admin':'player',xp:Number(legacy?.xp)||0,gamesPlayed:Number(legacy?.gamesPlayed)||0,wins:Number(legacy?.wins)||0,createdAt:new Date().toISOString()};
  list.push(u); setUsers(list);
  if(isFirst){
    const oldScores=read('neon_arcade_scores_v3',[]);
    if(oldScores.length){write(SCORES_KEY,oldScores.map(x=>({...x,userId:u.id,username:u.username})));}
  }
  localStorage.setItem(ACTIVE_KEY,u.id); logEvent('Cuenta creada',u.username); return cleanUser(u);
}
async function login({identifier,password}) {
  const key=String(identifier||'').trim().toLowerCase();
  const u=users().find(x=>x.username.toLowerCase()===key||x.email.toLowerCase()===key);
  if(!u || u.passwordHash !== await hashPassword(String(password||''))) throw new Error('Usuario/correo o contraseña incorrectos.');
  localStorage.setItem(ACTIVE_KEY,u.id); logEvent('Inicio de sesión',u.username); return cleanUser(u);
}
function logout(){ localStorage.removeItem(ACTIVE_KEY); }
function profile(){ return cleanUser(requireUser()); }
function saveScore(data){
  const list=users(), u=list.find(x=>x.id===activeId()); if(!u) throw new Error('Tu sesión terminó. Inicia sesión de nuevo.');
  const game=String(data.game||'Juego').trim(), score=Math.max(0,Math.floor(Number(data.score)||0)), earned=10+Math.min(35,Math.ceil(score*1.5));
  const scoreList=scores(); scoreList.push({id:uid(),userId:u.id,username:u.username,game,score,date:new Date().toISOString()}); write(SCORES_KEY,scoreList);
  const oldLevel=levelFromXp(u.xp); u.gamesPlayed=(Number(u.gamesPlayed)||0)+1; if(score>0)u.wins=(Number(u.wins)||0)+1; u.xp=(Number(u.xp)||0)+earned; setUsers(list);
  logEvent('Partida registrada',`${u.username} · ${game} · ${score} pts · +${earned} XP`);
  const unlocked=[]; const checks=[['first_game',u.gamesPlayed>=1,'🎮 Primera partida'],['ten_games',u.gamesPlayed>=10,'🔥 Diez partidas'],['hundred_xp',u.xp>=100,'✨ 100 XP'],['level_5',levelFromXp(u.xp)>=5,'🚀 Nivel 5'],['ten_wins',u.wins>=10,'🏆 Diez victorias']]; u.achievements=u.achievements||[]; checks.forEach(([id,ok,label])=>{if(ok&&!u.achievements.includes(id)){u.achievements.push(id);unlocked.push(label);}});setUsers(list);
  const daily=read('neon_arcade_daily_v1',{}),day=new Date().toISOString().slice(0,10),d=daily[u.id]?.date===day?daily[u.id]:{date:day,games:0,wins:0,xp:0,claimed:[]};d.claimed=d.claimed||[];d.games++;d.wins+=score>0?1:0;d.xp+=earned;const missionDefs=[['games',3,30,d.games],['wins',2,35,d.wins],['xp',50,25,d.xp]];let bonus=0;missionDefs.forEach(([id,goal,reward,progress])=>{if(progress>=goal&&!d.claimed.includes(id)){d.claimed.push(id);bonus+=reward;logEvent('Misión completada',`${u.username} · ${id} · +${reward} XP`);}});u.xp+=bonus;daily[u.id]=d;write('neon_arcade_daily_v1',daily);setUsers(list);
  return {xp:earned+bonus,missionBonus:bonus,level:levelFromXp(u.xp),leveledUp:levelFromXp(u.xp)>oldLevel,unlocked,score,user:cleanUser(u)};
}
function rankings(){
 const all=scores(), order=['Snake Neon','Golpea al Topo','Neon Breakout','Adivina Número','Piedra, Papel o Tijera','Dados','Memoria PRO','Matemática Rápida','Adivina el Producto','Mayor o Menor','Adivina la Palabra','Serpientes Matemáticas','Quiz Master','Secuencia Neon','Typing Rush','Reflejos Neon','Caza de Color','Tres en Raya'];
 const names=[...new Set([...order,...all.map(x=>x.game)])];
 return names.map(game=>{const best={};all.filter(x=>x.game===game).forEach(x=>{if(!best[x.userId||x.username]||x.score>best[x.userId||x.username].score)best[x.userId||x.username]=x;});return {game,rows:Object.values(best).sort((a,b)=>b.score-a.score).slice(0,5)};});
}
function adminUsers(){if(profile().role!=='admin') throw new Error('El panel de administración es exclusivo del administrador.');return users().map(cleanUser);}
function adminStats(){if(profile().role!=='admin') throw new Error('El panel de administración es exclusivo del administrador.');const list=scores();return {users:users().length,scores:list.length,totalScore:list.reduce((s,x)=>s+x.score,0)};}
function editProfile(data){const list=users(),u=list.find(x=>x.id===activeId());if(!u)throw new Error('Inicia sesión.');const name=String(data.username??u.username).trim();if(name.length<3||name.length>24)throw new Error('El usuario debe tener entre 3 y 24 caracteres.');if(list.some(x=>x.id!==u.id&&x.username.toLowerCase()===name.toLowerCase()))throw new Error('Ese nombre ya está ocupado.');u.username=name;u.avatar=String(data.avatar||'⚡').slice(0,8);u.bio=String(data.bio||'').slice(0,140);setUsers(list);logEvent('Perfil actualizado',name);return cleanUser(u);}
function toggleFavorite(game){const list=users(),u=list.find(x=>x.id===activeId());if(!u)throw new Error('Inicia sesión.');u.favoriteGames=u.favoriteGames||[];u.favoriteGames=u.favoriteGames.includes(game)?u.favoriteGames.filter(x=>x!==game):[...u.favoriteGames,game];setUsers(list);return u.favoriteGames;}
function dailyMissions(){const u=requireUser(),d=read('neon_arcade_daily_v1',{})[u.id],today=new Date().toISOString().slice(0,10),v=d?.date===today?d:{games:0,wins:0,xp:0};const claimed=d?.date===today?(d.claimed||[]):[];return [{id:'games',title:'Juega 3 partidas',desc:'Registra tres resultados hoy',progress:Math.min(3,v.games),goal:3,reward:30,done:v.games>=3,claimed:claimed.includes('games')},{id:'wins',title:'Consigue 2 victorias',desc:'Termina con puntuación positiva',progress:Math.min(2,v.wins),goal:2,reward:35,done:v.wins>=2,claimed:claimed.includes('wins')},{id:'xp',title:'Gana 50 XP',desc:'Acumula experiencia jugando hoy',progress:Math.min(50,v.xp),goal:50,reward:25,done:v.xp>=50,claimed:claimed.includes('xp')}];}
function achievements(){const u=requireUser(),ids=u.achievements||[];return [{id:'first_game',icon:'🎮',title:'Primera partida',desc:'Registra tu primer resultado'},{id:'ten_games',icon:'🔥',title:'Jugador constante',desc:'Completa 10 partidas'},{id:'hundred_xp',icon:'✨',title:'Centenario XP',desc:'Acumula 100 XP'},{id:'level_5',icon:'🚀',title:'Veterano',desc:'Alcanza el nivel 5'},{id:'ten_wins',icon:'🏆',title:'Ganador',desc:'Consigue 10 victorias'}].map(a=>({...a,unlocked:ids.includes(a.id)}));}
function userHistory(){const u=requireUser();return scores().filter(x=>x.userId===u.id).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,12);}
function adminAction(fn){if(profile().role!=='admin')throw new Error('Acción exclusiva de administrador.');return fn();}
function changeRole(id,role){return adminAction(()=>{if(!['admin','player'].includes(role))throw new Error('Rol inválido.');const list=users(),target=list.find(x=>x.id===id);if(!target)throw new Error('Usuario no encontrado.');if(target.id===activeId()&&role!=='admin')throw new Error('No puedes quitarte tu propio rol de administrador.');if(role==='player'&&target.role==='admin'&&list.filter(x=>x.role==='admin').length===1)throw new Error('Debe quedar al menos un administrador.');target.role=role;setUsers(list);logEvent('Rol modificado',`${target.username}: ${role}`);return true;});}
function resetUser(id){return adminAction(()=>{if(id===activeId())throw new Error('No puedes reiniciar tu propio progreso desde esta sesión.');const list=users(),u=list.find(x=>x.id===id);if(!u)throw new Error('Usuario no encontrado.');u.xp=0;u.gamesPlayed=0;u.wins=0;u.achievements=[];setUsers(list);write(SCORES_KEY,scores().filter(x=>x.userId!==id));logEvent('Progreso reiniciado',u.username);return true;});}
function adminDelete(id){return adminAction(()=>{if(id===activeId())throw new Error('No puedes eliminar tu propia cuenta activa.');const list=users(),u=list.find(x=>x.id===id);if(!u)throw new Error('Usuario no encontrado.');if(u.role==='admin'&&list.filter(x=>x.role==='admin').length===1)throw new Error('Debe quedar al menos un administrador.');setUsers(list.filter(x=>x.id!==id));write(SCORES_KEY,scores().filter(x=>x.userId!==id));logEvent('Cuenta eliminada',u.username);return true;});}
function activityLog(){return adminAction(()=>read(LOG_KEY,[]).slice(0,40));}
function analytics(){const u=requireUser(),all=scores(),mine=all.filter(x=>x.userId===u.id),byGame={};mine.forEach(x=>{byGame[x.game]=(byGame[x.game]||0)+1;});return {total:mine.length,best:mine.reduce((m,x)=>Math.max(m,x.score),0),byGame:Object.entries(byGame).sort((a,b)=>b[1]-a[1]).slice(0,6),recent:mine.slice(-7)};}
export const api={login,register,logout,profile,score:async x=>saveScore(x),rankings:async()=>rankings(),users:async()=>adminUsers(),stats:async()=>adminStats(),editProfile,toggleFavorite,dailyMissions,achievements,userHistory,changeRole,resetUser,deleteUser:adminDelete,activityLog,analytics,health:async()=>({ok:true,storage:'localStorage',database:false})};
export const session={save:()=>{},clear:logout,active:()=>!!currentRaw()};
export function resetLocalData(){[USERS_KEY,SCORES_KEY,ACTIVE_KEY,'neon_arcade_local_player_v3','neon_arcade_scores_v3',LOG_KEY,'neon_arcade_daily_v1'].forEach(k=>localStorage.removeItem(k));}
