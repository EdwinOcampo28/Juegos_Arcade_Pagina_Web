/* NEON ARCADE PRO standalone bundle. Supports opening index.html with file:// */
(function(){
const __factories = Object.create(null);
const __cache = Object.create(null);
function __norm(path){const out=[];for(const part of path.split('/')){if(!part||part==='.')continue;if(part==='..')out.pop();else out.push(part)}return out.join('/')}
function __load(id, parent){let target=id;if(id.startsWith('./')||id.startsWith('../'))target=__norm((parent?parent.split('/').slice(0,-1).join('/')+'/':'')+id);else target=__norm(id);if(!target.endsWith('.js'))target+='.js';if(__cache[target])return __cache[target].exports;if(!__factories[target])throw new Error('Módulo local no encontrado: '+target);const module={exports:{}};__cache[target]=module;__factories[target](module.exports,(dep)=>__load(dep,target));return module.exports}
__factories["js/ranking.js"]=function(exports,require){
const {api} = require("js/api.js");
const {$, escapeHtml, toast} = require("js/ui.js");

async function saveGameScore(game, name, score) {
  try {
    const result = await api.score({ game, score });
    let coinsEarned = 0;
    try {
      const active = localStorage.getItem('neon_arcade_active_user_v4');
      const all = JSON.parse(localStorage.getItem('neon_arcade_expansion_v1') || '{}');
      const scores = JSON.parse(localStorage.getItem('neon_arcade_scores_v4') || '[]');
      const row = [...scores].reverse().find(x => x.userId === active && x.game === game && Math.abs(Date.now() - new Date(x.date).getTime()) < 10000);
      if (active && row && row.id) {
        const st = all[active] || (all[active] = {coins:0, owned:[], theme:'default', processedScores:[]});
        st.processedScores = st.processedScores || [];
        if (!st.processedScores.includes(row.id)) {
          coinsEarned = 5 + Math.min(10, Math.floor(Math.max(0, Number(score) || 0) / 10));
          st.coins = (Number(st.coins) || 0) + coinsEarned;
          st.processedScores.push(row.id);
          localStorage.setItem('neon_arcade_expansion_v1', JSON.stringify(all));
          document.dispatchEvent(new Event('neon:coins-updated'));
        }
      }
    } catch (err) { console.warn('No se pudieron actualizar las monedas', err); }
    toast(`${result.leveledUp ? '🎉 ¡SUBISTE DE NIVEL! · ' : ''}Puntaje guardado · +${result.xp} XP · +${coinsEarned} monedas · Nivel ${result.level}`);
    return result;
  } catch (e) {
    console.error(e);
    toast(e.message || 'No se pudo guardar el puntaje.');
    throw e;
  }
}

async function renderRankings() {
  const container = $('#ranking-content');
  if (!container) return;
  const data = await api.rankings();
  container.innerHTML = data.map(group => `<article class="ranking-card">
    <h3>🏆 ${escapeHtml(group.game)}</h3>
    ${group.rows.length ? group.rows.map((item,i) => `<div class="ranking-row"><span>#${i+1}</span><span>${escapeHtml(item.username)}</span><strong>${item.score}</strong></div>`).join('') : '<div class="empty">No hay registros todavía.</div>'}
  </article>`).join('');
}

exports.saveGameScore = saveGameScore;
exports.renderRankings = renderRankings;

};
__factories["js/app.js"]=function(exports,require){
(async function(){
const {api, resetLocalData} = require("js/api.js");
const {games} = require("js/games/catalog.js");
const {toast, escapeHtml} = require("js/ui.js");
const $=s=>document.querySelector(s); const V=['auth','home','game','dash','rank','admin'];
function view(v){V.forEach(x=>$('#'+x)?.classList.toggle('active',x===v));scrollTo(0,0);}
function showAuth(mode='login',error=''){
 $('#actions').innerHTML=''; const registering=mode==='register';
 $('#authcontent').innerHTML=`<div class="auth-layout"><div class="hero-card auth-hero"><div><span class="badge">NEON ARCADE PRO</span><h2>${registering?'Crea tu jugador':'¡Qué bueno verte!'}</h2><p>${registering?'Registra tu cuenta para guardar tu progreso en este computador.':'Inicia sesión para continuar tus partidas, XP y rankings.'}</p><ul class="auth-benefits"><li>🎮 13 juegos disponibles</li><li>⭐ XP y niveles personales</li><li>🏆 Rankings compartidos en este navegador</li></ul></div><span class="hero-icon">⚡</span></div><form id="authform" class="game-panel auth-form"><h2>${registering?'Crear cuenta':'Iniciar sesión'}</h2>${registering?`<label for="auth-name">Nombre de usuario</label><input id="auth-name" name="username" class="input" minlength="3" maxlength="24" autocomplete="username" required placeholder="Tu nombre de jugador"><label for="auth-email">Correo electrónico</label><input id="auth-email" name="email" class="input" type="email" autocomplete="email" required placeholder="tu@correo.com">`:`<label for="auth-identifier">Usuario o correo</label><input id="auth-identifier" name="identifier" class="input" autocomplete="username" required placeholder="Usuario o correo">`}<label for="auth-password">Contraseña</label><input id="auth-password" name="password" class="input" type="password" minlength="6" autocomplete="${registering?'new-password':'current-password'}" required placeholder="Mínimo 6 caracteres">${error?`<div class="message error">${escapeHtml(error)}</div>`:''}<button class="btn btn-primary auth-submit" type="submit">${registering?'Crear cuenta':'Entrar a jugar'} →</button><p class="auth-switch">${registering?'¿Ya tienes cuenta?':'¿Eres nuevo?'} <button type="button" id="auth-toggle" class="link-button">${registering?'Inicia sesión':'Crea una cuenta'}</button></p><small class="auth-note">Modo local: las cuentas y partidas se guardan en este navegador, no en internet.</small></form></div>`;
 $('#auth-toggle').onclick=()=>showAuth(registering?'login':'register');
 $('#authform').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const data=Object.fromEntries(fd.entries());try{if(registering)await api.register(data);else await api.login(data);await home();}catch(err){showAuth(mode,err.message||'No se pudo completar la operación.');}};
 view('auth');
}
function header(u){const _active=localStorage.getItem('neon_arcade_active_user_v4');let _cos={};try{_cos=JSON.parse(localStorage.getItem('neon_arcade_expansion_v1')||'{}')[_active]||{};}catch{}const _avatar=_cos.avatar||u.avatar||'⚡',_frame=({'frame_neon':'avatar-frame-neon','frame_gold':'avatar-frame-gold','frame_fire':'avatar-frame-fire','frame_ice':'avatar-frame-ice','frame_galaxy':'avatar-frame-galaxy','frame_plasma':'avatar-frame-plasma','frame_emerald':'avatar-frame-emerald'})[_cos.frameEquipped]||'',_titles=({'title_legend':'⚡ Leyenda','title_master':'🏆 Maestro','title_explorer':'🧭 Explorador','title_speed':'💨 Relámpago','title_veteran':'🎖️ Veterano','title_champion':'👑 Campeón','title_strategist':'🧠 Estratega','title_mythic':'🌠 Mítico'}),_title=_titles[_cos.titleEquipped]||'',_bio=String(u.bio||'').trim();document.documentElement.dataset.arcadeTheme=_cos.theme||'default';$('#actions').innerHTML=`<button id="profile-btn" class="btn secondary">🪪 Perfil</button><button id="db" class="btn secondary">📊 Panel</button><button id="ad" class="btn secondary" ${u.role!=='admin'?'hidden':''}>🛠️ Admin</button><button id="logout" class="btn secondary">↪ Salir</button>`;const _homeChip=$('#home-user-chip');if(_homeChip){_homeChip.innerHTML=`<span class="user-chip-avatar ${_frame}">${escapeHtml(_avatar)}</span><span class="home-chip-copy"><strong>${escapeHtml(u.username)} · Nivel ${Number.isFinite(Number(u.level))?Number(u.level):1}</strong>${_title?`<small class="home-chip-title">${escapeHtml(_title)}</small>`:''}${_bio?`<small class="home-chip-bio">${escapeHtml(_bio)}</small>`:'<small class="home-chip-bio">¡A por el siguiente nivel!</small>'}</span>`;_homeChip.title=[_title,_bio].filter(Boolean).join(' · ');}_homeChip?.classList.toggle('has-player-details',true);$('#profile-btn').onclick=playerProfile;$('#db').onclick=dashboard;$('#ad').onclick=()=>admin().catch(e=>toast(e.message));$('#logout').onclick=()=>{api.logout();showAuth();};}
async function home(){let p;try{p=await api.profile();}catch{return showAuth();}header(p);const homeHero=document.querySelector('#home .hero-card');if(homeHero&&$('#profile').parentElement!==homeHero)homeHero.appendChild($('#profile'));$('#profile').innerHTML=`<div class="stat"><small>Nivel</small><strong>⭐ ${p.level}</strong></div><div class="stat"><small>XP</small><strong>${p.xp}</strong></div><div class="stat"><small>Partidas</small><strong>${p.gamesPlayed}</strong></div><div class="stat"><small>Victorias</small><strong>${p.wins}</strong></div>`;
const cats=['Todos',...new Set(Object.values(games).map(g=>g.category))];$('#games').innerHTML=`<section class="catalog-tools game-panel"><div class="catalog-tool-row"><input id="game-search" class="input" type="search" placeholder="🔎 Buscar juego…"><select id="game-category" class="input">${cats.map(c=>`<option>${escapeHtml(c)}</option>`).join('')}</select><label class="favorite-filter"><input id="only-favorites" type="checkbox"> ⭐ Favoritos</label></div><p class="catalog-note">${Object.keys(games).length} juegos · Marca tus favoritos y encuentra tu siguiente reto.</p></section><div id="game-cards" class="game-grid"></div><section class="mission-strip game-panel"><div><span class="panel-kicker">RETOS DIARIOS</span><h3>🎯 Misiones de hoy</h3><p>Completa objetivos y construye tu racha de juego.</p></div><div id="home-missions" class="mission-mini-grid"></div></section>`;
const renderCards=()=>{const term=$('#game-search').value.toLowerCase().trim(),cat=$('#game-category').value,only=$('#only-favorites').checked, fav=p.favoriteGames||[];const list=Object.entries(games).filter(([k,g])=>(!term||(g.title+' '+g.description+' '+g.category).toLowerCase().includes(term))&&(cat==='Todos'||g.category===cat)&&(!only||fav.includes(k)));$('#game-cards').innerHTML=list.map(([k,g])=>`<article class="game-card-wrap"><button class="game-card" data-k="${k}"><div class="icon">${g.icon}</div><span class="eyebrow">${escapeHtml(g.category)}</span><h3>${escapeHtml(g.title)}</h3><p>${escapeHtml(g.description)}</p><div class="play">JUGAR →</div></button><button class="favorite-star ${fav.includes(k)?'is-favorite':''}" data-fav="${k}" aria-label="Marcar favorito">${fav.includes(k)?'⭐':'☆'}</button></article>`).join('')||'<div class="game-panel empty">No hay juegos con esos filtros. Prueba otra búsqueda.</div>';document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>openGame(b.dataset.k));document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=async()=>{await api.toggleFavorite(b.dataset.fav);p=await api.profile();renderCards();});};$('#game-search').oninput=renderCards;$('#game-category').onchange=renderCards;$('#only-favorites').onchange=renderCards;renderCards();const missions=await api.dailyMissions();$('#home-missions').innerHTML=missions.map(m=>`<article class="mission-mini ${m.done?'mission-done':''}"><strong>${m.done?'✅':'🎯'} ${m.title}</strong><span>${m.progress}/${m.goal} · premio ${m.reward} XP</span><div class="progress"><div style="width:${Math.min(100,m.progress/m.goal*100)}%"></div></div></article>`).join('');view('home');}
async function playerProfile(){const p=await api.profile(),hist=await api.userHistory(),ach=await api.achievements(),an=await api.analytics();const _active=localStorage.getItem('neon_arcade_active_user_v4'),_allExp=(()=>{try{return JSON.parse(localStorage.getItem('neon_arcade_expansion_v1')||'{}')}catch{return {}}})(),_cos=_allExp[_active]||{owned:[],theme:'default',avatar:p.avatar||'⚡',titleEquipped:'',frameEquipped:''},_owned=Array.isArray(_cos.owned)?_cos.owned:[];const _av=[['⚡','Predeterminado',null],['👑','Corona','avatar_crown'],['🤖','Robot','avatar_robot'],['🦊','Zorro','avatar_fox'],['🐱','Gato','avatar_cat'],['🐼','Panda','avatar_panda'],['🐸','Rana','avatar_frog'],['🐉','Dragón','avatar_dragon'],['🦄','Unicornio','avatar_unicorn'],['🧑‍🚀','Astronauta','avatar_astronaut'],['🐯','Tigre','avatar_tiger'],['🪽','Fénix','avatar_phoenix']],_th=[['default','Neón clásico',null],['cyber','Cyberpunk','theme_cyber'],['retro','Retro arcade','theme_arcade'],['matrix','Matrix','theme_matrix'],['ocean','Océano','theme_ocean'],['sunset','Atardecer','theme_sunset'],['nebula','Nebulosa','theme_nebula']],_ti=[['','Sin título',null],['title_legend','⚡ Leyenda','title_legend'],['title_master','🏆 Maestro','title_master'],['title_explorer','🧭 Explorador','title_explorer'],['title_speed','💨 Relámpago','title_speed'],['title_veteran','🎖️ Veterano','title_veteran'],['title_champion','👑 Campeón','title_champion'],['title_strategist','🧠 Estratega','title_strategist'],['title_mythic','🌠 Mítico','title_mythic']],_fr=[['','Sin marco',null],['frame_neon','💠 Marco neón','frame_neon'],['frame_gold','🟡 Marco dorado','frame_gold'],['frame_fire','🔥 Marco fuego','frame_fire'],['frame_ice','❄️ Marco hielo','frame_ice'],['frame_galaxy','🌌 Marco galaxia','frame_galaxy'],['frame_plasma','🟣 Marco plasma','frame_plasma'],['frame_emerald','💚 Marco esmeralda','frame_emerald']];const titleLabel={'title_legend':'⚡ Leyenda','title_master':'🏆 Maestro','title_explorer':'🧭 Explorador','title_speed':'💨 Relámpago','title_veteran':'🎖️ Veterano','title_champion':'👑 Campeón','title_strategist':'🧠 Estratega','title_mythic':'🌠 Mítico'};const frameClass={'frame_neon':'avatar-frame-neon','frame_gold':'avatar-frame-gold','frame_fire':'avatar-frame-fire','frame_ice':'avatar-frame-ice','frame_galaxy':'avatar-frame-galaxy','frame_plasma':'avatar-frame-plasma','frame_emerald':'avatar-frame-emerald'};$('#dashcontent').innerHTML=`<section class="profile-main-shell"><section class="profile-hero game-panel"><div class="profile-avatar-big ${frameClass[_cos.frameEquipped]||''}">${escapeHtml(_cos.avatar||p.avatar||'⚡')}</div><div><span class="panel-kicker">IDENTIDAD DE JUGADOR</span><h2>${escapeHtml(p.username)} ${titleLabel[_cos.titleEquipped]?`<small class="equipped-title">${titleLabel[_cos.titleEquipped]}</small>`:''}</h2><p>${escapeHtml(p.bio||'Aún no has escrito una descripción. ¡Personaliza tu perfil!')}</p><span class="role-pill ${p.role==='admin'?'role-admin':'role-player'}">${p.role==='admin'?'🛡️ Administrador':'🎮 Jugador'} · Nivel ${p.level}</span></div></section><section class="game-panel profile-edit"><h3>✏️ Mi perfil y apariencia</h3><p class="muted">Edita tus datos y cosméticos en un solo lugar. Los objetos especiales deben desbloquearse en la tienda.</p><form id="profile-unified-form" class="profile-form"><label>Nombre de jugador<input class="input" name="username" minlength="3" maxlength="24" value="${escapeHtml(p.username)}" required></label><label class="profile-bio-label">Descripción<textarea class="input" name="bio" maxlength="140" rows="2" placeholder="Tu lema de jugador…">${escapeHtml(p.bio||'')}</textarea></label><div class="profile-cosmetic-grid"><label>Avatar<select class="input" name="cosAvatar">${_av.map(([v,n,item])=>`<option value="${v}" ${(_cos.avatar||p.avatar||'⚡')===v?'selected':''} ${item&&!_owned.includes(item)?'disabled':''}>${n}${item&&!_owned.includes(item)?' · Bloqueado':''}</option>`).join('')}</select></label><label>Color/tema<select class="input" name="cosTheme">${_th.map(([v,n,item])=>`<option value="${v}" ${(_cos.theme||'default')===v?'selected':''} ${item&&!_owned.includes(item)?'disabled':''}>${n}${item&&!_owned.includes(item)?' · Comprar en tienda':''}</option>`).join('')}</select></label><label>Título equipado<select class="input" name="cosTitle">${_ti.map(([v,n,item])=>`<option value="${v}" ${(_cos.titleEquipped||'')===v?'selected':''} ${item&&!_owned.includes(item)?'disabled':''}>${n}${item&&!_owned.includes(item)?' · Bloqueado':''}</option>`).join('')}</select></label><label>Marco del avatar<select class="input" name="cosFrame">${_fr.map(([v,n,item])=>`<option value="${v}" ${(_cos.frameEquipped||'')===v?'selected':''} ${item&&!_owned.includes(item)?'disabled':''}>${n}${item&&!_owned.includes(item)?' · Comprar en tienda':''}</option>`).join('')}</select></label></div><div class="profile-form-actions"><button class="btn btn-primary">💾 Guardar perfil y apariencia</button><button type="button" id="profile-open-store" class="btn secondary">🛍️ Abrir tienda</button></div></form><p class="muted">${_owned.length} objetos cosméticos desbloqueados.</p></section><section class="dashboard-stat-grid"><article class="dashboard-stat"><small>Partidas</small><strong>${an.total}</strong></article><article class="dashboard-stat"><small>Récord personal</small><strong>${an.best}</strong></article><article class="dashboard-stat"><small>Logros</small><strong>${ach.filter(x=>x.unlocked).length}/${ach.length}</strong></article><article class="dashboard-stat"><small>Experiencia</small><strong>${p.xp} XP</strong></article></section></section><section class="game-panel"><h3>🏅 Colección de logros</h3><div class="achievement-grid">${ach.map(x=>`<article class="achievement-card ${x.unlocked?'unlocked':'locked'}"><span>${x.icon}</span><strong>${x.title}</strong><small>${x.desc}</small><em>${x.unlocked?'DESBLOQUEADO':'BLOQUEADO'}</em></article>`).join('')}</div></section><section class="game-panel"><h3>📜 Historial reciente</h3>${hist.length?`<div class="history-list">${hist.map(x=>`<div class="history-row"><span>🎮 ${escapeHtml(x.game)}</span><strong>${x.score} pts</strong><small>${new Date(x.date).toLocaleString('es-CO')}</small></div>`).join('')}</div>`:'<p class="muted">Tus resultados aparecerán aquí cuando juegues.</p>'}</section>`;$('#profile-unified-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),av=fd.get('cosAvatar'),th=fd.get('cosTheme'),ti=fd.get('cosTitle'),fr=fd.get('cosFrame'),needAv=({'👑':'avatar_crown','🤖':'avatar_robot','🦊':'avatar_fox','🐱':'avatar_cat','🐼':'avatar_panda','🐸':'avatar_frog','🐉':'avatar_dragon','🦄':'avatar_unicorn','🧑‍🚀':'avatar_astronaut','🐯':'avatar_tiger','🪽':'avatar_phoenix'})[av],needTh=({'cyber':'theme_cyber','retro':'theme_arcade','matrix':'theme_matrix','ocean':'theme_ocean','sunset':'theme_sunset','nebula':'theme_nebula'})[th];if((needAv&&!_owned.includes(needAv))||(needTh&&!_owned.includes(needTh))||(ti&&!_owned.includes(ti))||(fr&&!_owned.includes(fr))){toast('Primero desbloquea ese objeto en la tienda.');return;}try{await api.editProfile({username:fd.get('username'),bio:fd.get('bio'),avatar:av});_cos.avatar=av;_cos.theme=th;_cos.titleEquipped=ti;_cos.frameEquipped=fr;_allExp[_active]=_cos;localStorage.setItem('neon_arcade_expansion_v1',JSON.stringify(_allExp));document.documentElement.dataset.arcadeTheme=th;const fresh=await api.profile();header(fresh);toast('Perfil y apariencia guardados correctamente 🎨');await playerProfile();}catch(err){toast('No se pudo guardar: '+err.message);}};$('#profile-open-store').onclick=()=>{const b=$('#exp-open');if(b)b.click();setTimeout(()=>document.querySelector('[data-tab="store"]')?.click(),80);};view('dash');}
async function openGame(k){const g=games[k];if(!g)return;if(g.arcadeV2){const restartButton=$('#restart-current-game');if(restartButton)restartButton.onclick=()=>openGame(k);$('#cat').textContent=g.category;$('#title').textContent=g.icon+' '+g.title;$('#gamecontent').innerHTML='<div class="game-panel">Preparando juego...</div>';view('game');if(window.NEON_ARCADE_V2&&typeof window.NEON_ARCADE_V2.playInline==='function'){window.NEON_ARCADE_V2.playInline(g.arcadeV2);return;}$('#gamecontent').textContent='No se pudo iniciar el juego. Recarga la página e inténtalo de nuevo.';return;}const restartButton=$('#restart-current-game');if(restartButton)restartButton.onclick=()=>openGame(k);$('#cat').textContent=g.category;$('#title').textContent=g.icon+' '+g.title;$('#gamecontent').innerHTML='<div class="game-panel">Cargando...</div>';view('game');try{const m=await Promise.resolve(require(g.module));if(typeof m.render!=='function')throw new Error('El juego no contiene una función render().');m.render($('#gamecontent'),async score=>{const r=await api.score({game:g.title,score});let coinsEarned=0;try{const active=localStorage.getItem('neon_arcade_active_user_v4'),all=JSON.parse(localStorage.getItem('neon_arcade_expansion_v1')||'{}'),scores=JSON.parse(localStorage.getItem('neon_arcade_scores_v4')||'[]'),row=[...scores].reverse().find(x=>x.userId===active&&x.game===g.title&&Math.abs(Date.now()-new Date(x.date).getTime())<10000);if(active&&row&&row.id){const st=all[active]||(all[active]={coins:0,owned:[],theme:'default',processedScores:[]});st.processedScores=st.processedScores||[];if(!st.processedScores.includes(row.id)){coinsEarned=5+Math.min(10,Math.floor(Math.max(0,Number(score)||0)/10));st.coins=(Number(st.coins)||0)+coinsEarned;st.processedScores.push(row.id);localStorage.setItem('neon_arcade_expansion_v1',JSON.stringify(all));document.dispatchEvent(new Event('neon:coins-updated'));}}}catch(err){console.warn('No se pudo actualizar las monedas de la partida',err);}toast(`${r.leveledUp?'🎉 ¡SUBISTE DE NIVEL! · ':''}+${r.xp} XP${r.missionBonus?' (incluye '+r.missionBonus+' XP de misiones)':''} · +${coinsEarned} monedas · Nivel ${r.level}`);(r.unlocked||[]).forEach(x=>toast(`🏅 Logro desbloqueado: ${x}`));try{const fresh=await api.profile();header(fresh);const freshHero=document.querySelector('#home .hero-card');if(freshHero&&$('#profile').parentElement!==freshHero)freshHero.appendChild($('#profile'));$('#profile').innerHTML=`<div class="stat"><small>Nivel</small><strong>⭐ ${fresh.level}</strong></div><div class="stat"><small>XP</small><strong>${fresh.xp}</strong></div><div class="stat"><small>Partidas</small><strong>${fresh.gamesPlayed}</strong></div><div class="stat"><small>Victorias</small><strong>${fresh.wins}</strong></div>`;}catch{}return r;});
if (!$('#gamecontent').dataset.enterHandler) { $('#gamecontent').dataset.enterHandler = '1'; $('#gamecontent').addEventListener('keydown', (ev) => { if (ev.key !== 'Enter' || !(ev.target instanceof HTMLInputElement)) return; ev.preventDefault(); const row = ev.target.closest('.form-row'); const button = row?.querySelector('button:not(:disabled)') || $('#gamecontent #send:not(:disabled), #gamecontent #check:not(:disabled), #gamecontent #ready:not(:disabled)'); if (button) button.click(); }); }}catch(e){console.error('Error cargando juego:',g.title,e);$('#gamecontent').innerHTML=`<div class="game-panel"><h3>⚠️ No se pudo cargar el juego</h3><p>${escapeHtml(e.message||'Error desconocido')}</p><button id="retry-game" class="btn btn-primary">🔄 Intentar de nuevo</button></div>`;$('#retry-game').onclick=()=>openGame(k);}}
async function dashboard(){
 const p=await api.profile();
 const winRate=p.gamesPlayed?Math.round((p.wins/p.gamesPlayed)*100):0;
 const missions=await api.dailyMissions();
 const analytics=await api.analytics();
 $('#dashcontent').innerHTML=`<section class="dashboard-hero game-panel"><div class="panel-kicker">CENTRO DE JUGADOR</div><div class="dashboard-heading"><div><h2>¡Qué tal, ${escapeHtml(p.username)}! ⚡</h2><p>Tu progreso, tus logros y tu siguiente objetivo en NEON ARCADE PRO.</p></div><div class="dashboard-level"><span>NIVEL</span><strong>${p.level}</strong></div></div><div class="level-progress-copy"><span>Progreso al siguiente nivel</span><strong>${p.xpIntoLevel} / ${p.xpToNext} XP</strong></div><div class="progress dashboard-progress"><div style="width:${p.progress}%"></div></div><div class="progress-foot"><span>${p.progress}% completado</span><span>Próximo nivel: ${p.level+1}</span></div></section><section class="dashboard-stat-grid"><article class="dashboard-stat"><span class="dashboard-stat-icon">✨</span><small>Experiencia total</small><strong>${p.xp} <em>XP</em></strong><span class="dashboard-stat-note">Tu esfuerzo acumulado</span></article><article class="dashboard-stat"><span class="dashboard-stat-icon">🎮</span><small>Partidas jugadas</small><strong>${p.gamesPlayed}</strong><span class="dashboard-stat-note">Cada partida cuenta</span></article><article class="dashboard-stat"><span class="dashboard-stat-icon">🏆</span><small>Victorias</small><strong>${p.wins}</strong><span class="dashboard-stat-note">Resultados positivos</span></article><article class="dashboard-stat"><span class="dashboard-stat-icon">📈</span><small>Tasa de victoria</small><strong>${winRate}%</strong><span class="dashboard-stat-note">Victorias / partidas registradas</span></article></section><section class="dashboard-bottom-grid"><article class="dashboard-info-card"><span class="dashboard-info-icon">🎯</span><div><h3>Tu siguiente objetivo</h3><p>Consigue <strong>${Math.max(0,p.xpToNext-p.xpIntoLevel)} XP</strong> más para alcanzar el nivel ${p.level+1}.</p></div><button class="btn btn-primary" id="dash-play">Elegir un juego →</button></article><article class="dashboard-info-card"><span class="dashboard-info-icon">💾</span><div><h3>Progreso local</h3><p>Tu perfil y tus resultados se guardan en este navegador. No se envían a un servidor externo.</p></div><span class="local-status"><i></i> Almacenamiento local</span></article></section><section class="game-panel"><h3>🎯 Misiones diarias</h3><div class="mission-grid">${missions.map(m=>`<article class="mission-card ${m.done?'mission-done':''}"><div class="mission-card-top"><span>🎯</span><b>${m.done?'COMPLETADA':'+'+m.reward+' XP'}</b></div><h3>${m.title}</h3><p>${m.desc}</p><div class="progress"><div style="width:${Math.min(100,m.progress/m.goal*100)}%"></div></div><small>${m.progress}/${m.goal}</small></article>`).join('')}</div></section><section class="game-panel"><h3>📊 Tu actividad por juego</h3><div class="chart-bars">${analytics.byGame.map(([name,count])=>`<div class="chart-row"><span>${escapeHtml(name)}</span><div class="chart-track"><i style="width:${Math.min(100,count/Math.max(1,analytics.total)*100)}%"></i></div><b>${count}</b></div>`).join('')||'<p class="muted">Juega para generar estadísticas.</p>'}</div></section>`;
 $('#dash-play').onclick=home;view('dash');
}
async function rankings(){
 const x=await api.rankings();
 $('#rankcontent').innerHTML=`<section class="ranking-intro game-panel"><div class="panel-kicker">SALÓN DE LA FAMA</div><h2>🏆 Rankings de la arcade</h2><p>Los mejores resultados guardados en este navegador. ¡Juega, mejora tu marca y escala posiciones!</p><div class="ranking-intro-tags"><span>⚡ Récords</span><span>🎮 ${x.length} juegos con ranking</span><span>💾 Local</span></div></section><section class="ranking-grid">${x.map(g=>`<article class="ranking-card"><div class="ranking-card-head"><div class="ranking-trophy">🏆</div><div><h3>${escapeHtml(g.game)}</h3><span>Mejores puntuaciones</span></div></div>${g.rows.length?g.rows.map((r,i)=>`<div class="ranking-row ${i===0?'ranking-first':''}"><span class="rank-position">${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span><span class="rank-player">${escapeHtml(r.username)}</span><b class="rank-score">${r.score}<small> pts</small></b></div>`).join(''):'<div class="empty ranking-empty"><span>🎮</span><strong>¡Sé el primero!</strong><p>Aún no hay puntuaciones guardadas.</p></div>'}</article>`).join('')}</section>`;
 view('rank');
}
async function admin(){
 const p=await api.profile();if(p.role!=='admin')throw new Error('Solo el administrador puede abrir este panel.');
 const [u,s]=await Promise.all([api.users(),api.stats()]);
 const admins=u.filter(a=>a.role==='admin').length;
 const totalXp=u.reduce((sum,a)=>sum+(Number(a.xp)||0),0);
 $('#admincontent').innerHTML=`<section class="admin-hero game-panel"><div class="admin-hero-copy"><span class="panel-kicker">CONTROL CENTRAL · ACCESO ADMIN</span><h2>Panel de administración <span>🛠️</span></h2><p>Vista general de la actividad de NEON ARCADE PRO en este navegador.</p><div class="admin-hero-tags"><span>🔒 Acceso administrador</span><span>💾 Datos locales</span></div></div><div class="admin-orb">⚙️</div></section><section class="admin-metric-grid"><article class="admin-metric"><span class="admin-metric-icon">👥</span><div><small>Usuarios registrados</small><strong>${s.users}</strong><span>Perfiles locales</span></div></article><article class="admin-metric"><span class="admin-metric-icon">🎮</span><div><small>Partidas guardadas</small><strong>${s.scores}</strong><span>Resultados registrados</span></div></article><article class="admin-metric"><span class="admin-metric-icon">⭐</span><div><small>Puntos acumulados</small><strong>${Number(s.totalScore||0).toLocaleString('es-CO')}</strong><span>En todos los registros</span></div></article><article class="admin-metric"><span class="admin-metric-icon">✨</span><div><small>XP de los perfiles</small><strong>${totalXp.toLocaleString('es-CO')}</strong><span>${admins} cuenta(s) admin</span></div></article></section><section class="admin-users-panel game-panel"><div class="admin-section-heading"><div><span class="panel-kicker">DIRECTORIO LOCAL</span><h3>Usuarios registrados</h3><p>Consulta cuentas, permisos y progresión.</p></div><span class="admin-count">${u.length} ${u.length===1?'usuario':'usuarios'}</span></div><div class="admin-table-tools"><label class="admin-search"><span>⌕</span><input id="admin-user-search" class="input" type="search" placeholder="Buscar por usuario o correo…" aria-label="Buscar usuarios"></label><span class="admin-table-hint">Solo lectura</span></div><div class="table-wrap"><table class="data-table admin-table"><thead><tr><th>Jugador</th><th>Correo</th><th>Rol</th><th>Nivel</th><th>XP acumulados</th><th>Partidas</th><th>Acciones</th></tr></thead><tbody id="admin-user-rows">${u.map(a=>`<tr data-user-search="${escapeHtml((a.username+' '+a.email).toLocaleLowerCase())}"><td><div class="admin-user-cell"><span class="admin-avatar">${escapeHtml((a.username||'?').slice(0,1).toUpperCase())}</span><strong>${escapeHtml(a.username)}</strong></div></td><td>${escapeHtml(a.email||'—')}</td><td><span class="role-pill ${a.role==='admin'?'role-admin':'role-player'}">${a.role==='admin'?'🛡️ Admin':'🎮 Jugador'}</span></td><td><span class="level-pill">Nv. ${a.level}</span></td><td><strong class="admin-xp">${Number(a.xp||0).toLocaleString('es-CO')} XP</strong></td><td>${Number(a.gamesPlayed||0)}</td><td class="admin-actions"><select class="input role-select" data-role="${a.id}"><option value="player" ${a.role==='player'?'selected':''}>Jugador</option><option value="admin" ${a.role==='admin'?'selected':''}>Admin</option></select><button class="btn danger btn-small" data-delete-user="${a.id}">✕</button></td></tr>`).join('')}</tbody></table><div id="admin-no-users" class="empty admin-no-users" ${u.length?'hidden':''}>Todavía no hay usuarios registrados.</div><div id="admin-no-match" class="empty admin-no-users" hidden>No hay usuarios que coincidan con esa búsqueda.</div></div></section><section class="game-panel"><h3>🧾 Registro de actividad reciente</h3><div class="activity-log">${(await api.activityLog()).map(e=>`<div class="history-row"><span><strong>${escapeHtml(e.action)}</strong> · ${escapeHtml(e.details||'')}</span><small>${escapeHtml(e.user)} · ${new Date(e.date).toLocaleString('es-CO')}</small></div>`).join('')||'<p class="muted">Aún no hay actividad registrada.</p>'}</div></section><section class="admin-danger-zone"><div><span class="danger-icon">⚠️</span><div><h3>Zona de mantenimiento</h3><p>Esta acción elimina las cuentas, la experiencia, las estadísticas y los rankings de este navegador.</p></div></div><button id="reset-local" class="btn danger">🗑️ Borrar datos locales</button></section>`;
 $('#admin-user-search').oninput=e=>{const term=e.target.value.trim().toLocaleLowerCase();let visible=0;$('#admin-user-rows').querySelectorAll('tr').forEach(row=>{const show=row.dataset.userSearch.includes(term);row.hidden=!show;if(show)visible++;});$('#admin-no-match').hidden=visible>0||!term;$('#admin-no-users').hidden=!!term||u.length>0;};
 document.querySelectorAll('[data-role]').forEach(el=>el.onchange=async()=>{try{await api.changeRole(el.dataset.role,el.value);toast('Rol actualizado');await admin();}catch(e){toast(e.message);await admin();}});document.querySelectorAll('[data-delete-user]').forEach(el=>el.onclick=async()=>{if(confirm('¿Eliminar esta cuenta y todos sus resultados? Esta acción no se puede deshacer.'))try{await api.deleteUser(el.dataset.deleteUser);toast('Cuenta eliminada');await admin();}catch(e){toast(e.message);}});$('#reset-local').onclick=()=>{if(confirm('Esto borrará todas las cuentas, XP, estadísticas y rankings de este navegador. ¿Continuar?')){resetLocalData();showAuth();}};
 view('admin');
}
$('#back').onclick=home;$('#backdash').onclick=home;$('#backrank').onclick=home;$('#backadmin').onclick=home;$('#rank1').onclick=rankings;
try{await api.profile();await home();}catch{showAuth();}

})();



};
__factories["js/ui.js"]=function(exports,require){
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function message(t,type=''){return `<div class="message ${type}">${escapeHtml(t)}</div>`}
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.querySelector('#toast-container').append(e);setTimeout(()=>e.remove(),2500)}
function randomInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function gamePanel(content){return `<div class="game-panel">${content}</div>`}
function askName(){
  try {
    const users=JSON.parse(localStorage.getItem('neon_arcade_users_v4')||'[]');
    const id=localStorage.getItem('neon_arcade_active_user_v4');
    return users.find(user=>user.id===id)?.username || 'Jugador';
  } catch { return 'Jugador'; }
}
function $(selector){return document.querySelector(selector)}

exports.escapeHtml = escapeHtml;
exports.message = message;
exports.toast = toast;
exports.randomInt = randomInt;
exports.gamePanel = gamePanel;
exports.askName = askName;
exports.$ = $;

};
__factories["js/storage.js"]=function(exports,require){
const KEY = "sistema_modular_juegos_rankings_v1";

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

function getRanking(game) {
  const data = readAll();
  return Array.isArray(data[game]) ? data[game] : [];
}

function saveScore(game, name, score) {
  if (!name || !Number.isFinite(score) || score < 0) return;
  const data = readAll();
  const ranking = Array.isArray(data[game]) ? data[game] : [];
  ranking.push({ name: name.trim(), score: Math.floor(score) });
  ranking.sort((a, b) => b.score - a.score);
  data[game] = ranking.slice(0, 5);
  localStorage.setItem(KEY, JSON.stringify(data));
}

function clearRankings() {
  localStorage.removeItem(KEY);
}

function allRankings() {
  return readAll();
}

exports.getRanking = getRanking;
exports.saveScore = saveScore;
exports.clearRankings = clearRankings;
exports.allRankings = allRankings;

};
__factories["js/api.js"]=function(exports,require){
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
 const all=scores(), order=['Snake Neon','Golpea al Topo','Neon Breakout','Adivina Número','Piedra, Papel o Tijera','Dados','Memoria PRO','Mayor o Menor','Adivina la Palabra','Serpientes Matemáticas','Quiz Master','Secuencia Neon','Typing Rush','Reflejos Neon','Caza de Color','Tres en Raya'];
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
function firstAdminId(list=users()){const first=list.find(x=>x.role==='admin');return first?.id||null;}
function changeRole(id,role){return adminAction(()=>{if(!['admin','player'].includes(role))throw new Error('Rol inválido.');const list=users(),target=list.find(x=>x.id===id);if(!target)throw new Error('Usuario no encontrado.');if(target.id===firstAdminId(list)&&role!=='admin')throw new Error('La cuenta del primer administrador está protegida y no puede perder su rol.');if(target.id===activeId()&&role!=='admin')throw new Error('No puedes quitarte tu propio rol de administrador.');if(role==='player'&&target.role==='admin'&&list.filter(x=>x.role==='admin').length===1)throw new Error('Debe quedar al menos un administrador.');target.role=role;setUsers(list);logEvent('Rol modificado',`${target.username}: ${role}`);return true;});}
function resetUser(id){throw new Error('El progreso solo se puede borrar mediante el botón Borrar datos locales. El reinicio individual está deshabilitado.');}
function adminDelete(id){return adminAction(()=>{if(id===activeId())throw new Error('No puedes eliminar tu propia cuenta activa.');const list=users(),u=list.find(x=>x.id===id);if(!u)throw new Error('Usuario no encontrado.');if(u.id===firstAdminId(list))throw new Error('La cuenta del primer administrador está protegida y no se puede eliminar.');if(u.role==='admin'&&list.filter(x=>x.role==='admin').length===1)throw new Error('Debe quedar al menos un administrador.');setUsers(list.filter(x=>x.id!==id));write(SCORES_KEY,scores().filter(x=>x.userId!==id));logEvent('Cuenta eliminada',u.username);return true;});}
function activityLog(){return adminAction(()=>read(LOG_KEY,[]).slice(0,40));}
function analytics(){const u=requireUser(),all=scores(),mine=all.filter(x=>x.userId===u.id),byGame={};mine.forEach(x=>{byGame[x.game]=(byGame[x.game]||0)+1;});return {total:mine.length,best:mine.reduce((m,x)=>Math.max(m,x.score),0),byGame:Object.entries(byGame).sort((a,b)=>b[1]-a[1]).slice(0,6),recent:mine.slice(-7)};}
const api={login,register,logout,profile,score:async x=>saveScore(x),rankings:async()=>rankings(),users:async()=>adminUsers(),stats:async()=>adminStats(),editProfile,toggleFavorite,dailyMissions,achievements,userHistory,changeRole,resetUser,deleteUser:adminDelete,activityLog,analytics,health:async()=>({ok:true,storage:'localStorage',database:false})};
const session={save:()=>{},clear:logout,active:()=>!!currentRaw()};
function resetLocalData(){[USERS_KEY,SCORES_KEY,ACTIVE_KEY,'neon_arcade_local_player_v3','neon_arcade_scores_v3',LOG_KEY,'neon_arcade_daily_v1','neon_arcade_expansion_v1','neon_arcade_expansion_v1_challenges'].forEach(k=>localStorage.removeItem(k));}

exports.resetLocalData = resetLocalData;
exports.api = api;
exports.session = session;

};
__factories["js/games/ticTacToe.js"]=function(exports,require){
function render(root, saveScore) {
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

exports.render = render;

};
__factories["js/games/product.js"]=function(exports,require){
const {randomInt, askName, gamePanel, message} = require("js/ui.js");
const {saveGameScore} = require("js/ranking.js");

function render(container) {
  let scoreSaved = false, played = false;
  const saveOnce = (...args) => { if (scoreSaved) return false; scoreSaved = true; return saveGameScore(...args); };
  const game="Adivina el Producto"; let hits=0, level=1, range=12, stopped=false;
  container.innerHTML=gamePanel(`<h3>✖️ Adivina el Producto</h3><div class="stats"><div class="stat"><small>Nivel</small><strong id="level">1</strong></div><div class="stat"><small>Aciertos</small><strong id="hits">0</strong></div></div><div id="question"></div><div class="form-row"><input id="answer" class="input" type="number" placeholder="Respuesta"><button id="check" class="btn btn-primary">Responder</button></div><div id="result"></div><div class="action-row"><button id="finish" class="btn btn-secondary">Guardar puntaje</button></div>`);
  const q=container.querySelector("#question"), result=container.querySelector("#result");
  let a,b;
  const next=()=>{a=randomInt(1,range);b=randomInt(1,range);q.innerHTML=`<h2>${a} × ${b} = ?</h2>`;container.querySelector("#answer").value="";};
  container.querySelector("#check").onclick=()=>{if(stopped)return;const answerInput=container.querySelector("#answer");if(!answerInput.value.trim()){result.innerHTML=message("Escribe una respuesta antes de continuar.","warn");answerInput.focus();return;}played=true;const r=Number(container.querySelector("#answer").value);if(r===a*b){hits++;level++;range+=2;result.innerHTML=message(`¡Correcto! Llevas ${hits} aciertos seguidos.`,"success");container.querySelector("#hits").textContent=hits;container.querySelector("#level").textContent=level;next();}else{stopped=true;result.innerHTML=message(`❌ Incorrecto. La respuesta era ${a*b}.`,"error");}};
  container.querySelector("#finish").onclick=()=>{if(scoreSaved)return;if(!played){result.innerHTML=message("Resuelve al menos una multiplicación antes de guardar.","warn");return;}const name=askName();if(name){saveOnce(game,name,hits);container.querySelector("#finish").disabled=true;container.querySelector("#finish").textContent="Puntaje guardado ✓";}};
  next();
}
exports.render = render;

};
__factories["js/games/guessNumber.js"]=function(exports,require){
const { randomInt, askName, gamePanel, message } = require("js/ui.js");
const { saveGameScore } = require("js/ranking.js");

function render(container) {
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

exports.render = render;

};

__factories["js/games/snakesMath.js"]=function(exports,require){
const {randomInt, askName, gamePanel, message} = require("js/ui.js");
const {saveGameScore} = require("js/ranking.js");
function render(container) {
 const game='Serpientes Matemáticas';let hits=0,level=1,lives=3,combo=0,bestCombo=0,score=0,stopped=false,saved=false,played=false,a=0,b=0,op='+',answer=0,round=0,hintCount=0;
 container.innerHTML=gamePanel(`<section class="snake-arcade"><div class="snake-hero"><span class="badge">🐍 ARCADE SURVIVAL</span><h2>Serpientes Matemáticas</h2><p>Resuelve operaciones, encadena combos y sobrevive a las rondas. ¡Cada 4 aciertos subes de nivel!</p></div><div class="snake-stats"><div class="stat"><small>Nivel</small><strong id="level">1</strong></div><div class="stat"><small>Puntos</small><strong id="snake-score">0</strong></div><div class="stat"><small>Vidas</small><strong id="lives">❤️❤️❤️</strong></div><div class="stat"><small>Combo</small><strong id="combo">x0 🔥</strong></div></div><div class="snake-arena"><div class="snake-path"><span>🐍</span><div class="progress"><div id="snake-progress" style="width:0%"></div></div><span>🏁</span></div><div id="question" class="snake-question"></div><div id="snake-feedback" aria-live="polite">¡Prepárate para la primera operación!</div><form id="snake-form" class="form-row"><input id="answer" class="input" type="number" placeholder="Tu respuesta" autocomplete="off" required><button id="check" class="btn btn-primary" type="submit">Atacar ⚡</button></form><div class="snake-actions"><button id="snake-hint" class="btn btn-secondary">💡 Pista</button><button id="snake-restart" class="btn btn-secondary">↻ Reiniciar</button><button id="finish" class="btn btn-primary" disabled>Guardar récord</button></div><p class="muted">Respuesta correcta: +10 puntos. Combo: puntos extra. Error: pierdes una vida.</p></div></section>`);
 const $=id=>container.querySelector('#'+id),q=$('question'),feedback=$('snake-feedback');
 function next(){round++;const max=Math.min(18,6+level*2);const pool=level<2?['+','-']:level<4?['+','-','×']:level<6?['+','-','×','÷']:['+','-','×','÷','²'];op=pool[randomInt(0,pool.length-1)];a=randomInt(2,max);b=randomInt(2,max);if(op==='-'&&b>a)[a,b]=[b,a];if(op==='×'){a=randomInt(2,Math.min(15,4+level));b=randomInt(2,Math.min(12,3+level));}if(op==='÷'){b=randomInt(2,Math.min(12,3+level));const quotient=randomInt(2,Math.min(15,4+level));a=b*quotient;}if(op==='²'){a=randomInt(2,Math.min(20,5+level));b=2;}answer=op==='+'?a+b:op==='-'?a-b:op==='×'?a*b:op==='÷'?a/b:a*a;q.innerHTML=`<div class="snake-round">RONDA ${round} · NIVEL ${level}</div><strong>${a} ${op==='²'?'al cuadrado':op} ${op==='²'?'':b+' '}= ?</strong><small>${level<2?'Fase 1 · Suma y resta':level<4?'Fase 2 · Multiplicación incluida':level<6?'Fase 3 · División exacta':'Fase ÉLITE · Operaciones mixtas'}</small>`;$('answer').value='';$('answer').focus();$('snake-progress').style.width=(hits%4)/4*100+'%';}
 function draw(){ $('level').textContent=level;$('snake-score').textContent=score;$('lives').textContent='❤️'.repeat(lives)+'🖤'.repeat(3-lives);$('combo').textContent=`x${combo} 🔥`; }
 function end(){stopped=true;$('check').disabled=true;$('answer').disabled=true;$('finish').disabled=!played;feedback.innerHTML=message(`🏁 ¡Fin de la partida! Puntaje: ${score} · Aciertos: ${hits} · Mejor combo: ${bestCombo}`,'success');q.innerHTML=`<div class="snake-gameover"><span>🐍</span><h3>${score>=100?'¡SERPIENTE LEGENDARIA!':'¡Buen intento!'}</h3><p>Alcanza una nueva marca en la siguiente ronda.</p></div>`;}
 $('snake-form').onsubmit=e=>{e.preventDefault();if(stopped)return;const input=$('answer');if(!input.value.trim())return;played=true;const n=Number(input.value);if(n===answer){hits++;combo++;bestCombo=Math.max(bestCombo,combo);score+=10+Math.min(20,combo*2);if(hits%4===0)level++;feedback.innerHTML=message(`⚡ ¡Correcto! +${10+Math.min(20,combo*2)} puntos. ${combo>=3?'¡COMBO IMPARABLE! 🔥':''}`,'success');draw();next();}else{lives--;combo=0;feedback.innerHTML=message(`💥 ¡La respuesta era ${answer}! Pierdes una vida.`, 'error');draw();if(lives<=0){end();return;}next();}};
 $('snake-hint').onclick=()=>{if(stopped)return;let clue=op==='+'?`Empieza por sumar ${a} + ${b}.`:op==='-'?`Calcula la diferencia entre ${a} y ${b}.`:op==='×'?`Multiplica ${a} por ${b}; puedes descomponer ${b} en partes.`:op==='÷'?`¿Qué número multiplicado por ${b} da ${a}?`:`Calcula ${a} × ${a}; recuerda que elevar al cuadrado es multiplicar un número por sí mismo.`;if(hintCount>0)clue+=` La respuesta ${answer%2===0?'es par':'es impar'}.`;hintCount++;feedback.innerHTML=message(`💡 Pista: ${clue}`,'warn');};
 $('snake-restart').onclick=()=>{hits=0;level=1;lives=3;combo=0;bestCombo=0;score=0;stopped=false;saved=false;played=false;hintCount=0;$('check').disabled=false;$('answer').disabled=false;$('finish').disabled=true;$('finish').textContent='Guardar récord';feedback.textContent='¡Nueva carrera!';draw();next();};
 $('finish').onclick=()=>{if(saved||!played)return;const name=askName();if(!name)return;saveGameScore(game,name,score);saved=true;$('finish').disabled=true;$('finish').textContent='✓ Récord guardado';feedback.innerHTML+=message('💾 Récord guardado en el ranking local.','success');};draw();next();
}
exports.render=render;
};

__factories["js/games/dice.js"]=function(exports,require){
const {randomInt, gamePanel, message} = require("js/ui.js");
const {saveGameScore} = require("js/ranking.js");
const {askName} = require("js/ui.js");

function render(container) {
  let scoreSaved = false, played = false;
  const saveOnce = (...args) => { if (scoreSaved) return false; scoreSaved = true; return saveGameScore(...args); };
  const game="Dados"; let wins=0;
  container.innerHTML=gamePanel(`<h3>🎲 Adivina el Dado</h3><p>Elige un número del 1 al 6.</p>
    <div class="choice-grid">${[1,2,3,4,5,6].map(n=>`<button class="choice" data-die="${n}">🎲 ${n}</button>`).join("")}</div>
    <div id="result"></div><div class="action-row"><button id="finish" class="btn btn-primary">Guardar puntaje</button></div>`);
  const result=container.querySelector("#result");
  container.querySelectorAll("[data-die]").forEach(b=>b.onclick=()=>{ played = true;
    const guess=Number(b.dataset.die), die=randomInt(1,6);
    if(guess===die){ wins++; result.innerHTML=message(`🎉 ¡Acertaste! Salió ${die}. Aciertos: ${wins}`,"success"); }
    else result.innerHTML=message(`❌ No acertaste. Salió ${die}.`,"error");
  });
  container.querySelector("#finish").onclick=()=>{if(scoreSaved)return;if(!played){result.innerHTML=message("Juega al menos una ronda antes de guardar el puntaje.","warn");return;}const name=askName();if(name){saveOnce(game,name,wins);container.querySelector("#finish").disabled=true;container.querySelector("#finish").textContent="Puntaje guardado ✓";}};
}
exports.render = render;

};
__factories["js/games/word.js"]=function(exports,require){
const {randomInt, askName, gamePanel, message} = require("js/ui.js");
const {saveGameScore} = require("js/ranking.js");

function render(container) {
  let scoreSaved = false;
  const saveOnce = (...args) => { if (scoreSaved) return false; scoreSaved = true; return saveGameScore(...args); };
  const game="Adivina la Palabra";
  const words=["python","codigo","programa","algoritmo","variable","funcion","clase","objeto","modulo","sistema","software","hardware","computadora","teclado","pantalla","internet","servidor","archivo","datos","ranking","juego","memoria","nivel","puntaje","intentos","dificultad","acierto","secuencia","logica","reto","hacker","terminal","consola","linux","windows","comando","seguridad","encriptar","firewall","palabra","mensaje","numero","usuario","tiempo","color","verde","azul","rojo","negro","rapido","lento","fuerte","simple","complejo"];
  let word=words[randomInt(0,words.length-1)], tries=6, guessed=[];
  container.innerHTML=gamePanel(`<h3>🔤 Adivina la Palabra</h3><div id="hint"></div><div id="word" class="word-display"></div><div id="letters" class="letter-grid"></div><div id="result"></div><div class="action-row"><button id="new" class="btn btn-secondary">Nueva palabra</button></div>`);
  const wordEl=container.querySelector("#word"), letters=container.querySelector("#letters"), result=container.querySelector("#result");
  const draw=()=>{const display=[...word].map(c=>guessed.includes(c)?c:"_").join(" ");wordEl.textContent=display;container.querySelector("#hint").innerHTML=`<div class="message warn">Pista: ${word.length} letras · comienza con "${word[0]}" · intentos: ${tries}</div>`;letters.innerHTML=[..."abcdefghijklmnopqrstuvwxyz"].map(l=>`<button class="letter-btn" data-letter="${l}" ${guessed.includes(l)||tries<=0?"disabled":""}>${l}</button>`).join("");letters.querySelectorAll("[data-letter]").forEach(b=>b.onclick=()=>pick(b.dataset.letter));if(!display.includes("_"))end(true);if(tries<=0&&!display.includes("_")===false){}};
  const pick=l=>{if(guessed.includes(l)||tries<=0)return;guessed.push(l);if(!word.includes(l))tries--;draw();if(tries<=0&&[...word].some(c=>!guessed.includes(c)))end(false);};
  const end=win=>{const score=win?tries:0;result.innerHTML=message(win?"🎉 ¡Felicidades! Adivinaste la palabra.":`💀 Se acabaron los intentos. La palabra era: ${word}`,win?"success":"error");const name=askName();if(name)saveOnce(game,name,score);letters.querySelectorAll("button").forEach(b=>b.disabled=true);};
  const reset=()=>{word=words[randomInt(0,words.length-1)];tries=6;guessed=[];scoreSaved=false;result.innerHTML="";draw();};
  container.querySelector("#new").onclick=reset; draw();
}
exports.render = render;

};
__factories["js/games/memory.js"]=function(exports,require){
const {randomInt, askName, gamePanel, message} = require("js/ui.js");
const {saveGameScore} = require("js/ranking.js");

function render(container) {
  let scoreSaved = false;
  const saveOnce = (...args) => { if (scoreSaved) return false; scoreSaved = true; return saveGameScore(...args); };
  const game="Memoria PRO"; let level=1, lives=3, current=[], showing=true;
  container.innerHTML=gamePanel(`<h3>🧠 Memoria PRO</h3><div class="stats"><div class="stat"><small>Nivel</small><strong id="level">1</strong></div><div class="stat"><small>Vidas</small><strong id="lives">♥ ♥ ♥</strong></div></div><div id="sequence" class="sequence"></div><div id="input-area"></div><div id="result"></div>`);
  const seq=container.querySelector("#sequence"), area=container.querySelector("#input-area"), result=container.querySelector("#result");
  const next=()=>{
    current=Array.from({length:3+level},()=>randomInt(0,9)); showing=true;
    seq.textContent=current.join(" "); area.innerHTML=`<div class="action-row"><button id="ready" class="btn btn-primary">Ya la memoricé</button></div>`;
    result.innerHTML=message("Memoriza la secuencia.", "warn");
    container.querySelector("#ready").onclick=()=>{seq.textContent="• • • • •"; area.innerHTML=`<div class="form-row"><input id="answer" class="input" placeholder="Ejemplo: 1 4 7 2"><button id="check" class="btn btn-primary">Comprobar</button></div>`; container.querySelector("#check").onclick=check;};
  };
  const check=()=>{
    const answerText=container.querySelector("#answer").value.trim(); if(!answerText){result.innerHTML=message("Escribe la secuencia antes de comprobar.","warn");return;} const answer=answerText.split(/\s+/).filter(Boolean).map(Number);
    if(JSON.stringify(answer)===JSON.stringify(current)){level++; if(level%3===0) lives++; result.innerHTML=message(`🎉 ¡Correcto! Nivel ${level}.`,"success"); container.querySelector("#level").textContent=level; container.querySelector("#lives").textContent="♥ ".repeat(lives); setTimeout(next,650);}
    else {lives--; result.innerHTML=message(`❌ Incorrecto. Era ${current.join(" ")}.`,"error"); container.querySelector("#lives").textContent="♥ ".repeat(lives); if(lives<=0){const score=level+lives; const name=askName();if(name)saveOnce(game,name,score); area.innerHTML=`<button id="restart" class="btn btn-primary">Reiniciar</button>`;container.querySelector("#restart").onclick=()=>{level=1;lives=3;scoreSaved=false;next();};}}
  };
  next();
}
exports.render = render;

};
__factories["js/games/typingRush.js"]=function(exports,require){
function render(root, saveScore){
 let words=['neon','arcade','pixel','energia','rapido','teclado','memoria','juego','codigo','estrella','galaxia','robot','nube','rayo','aventura','mision','planeta','velocidad','puzzle','campeon','consola','pantalla','puntos','desafio','tecnologia','dragon','cohete','diamante','fantasma','portal','programa','ventana','tecla','raton','monitor','sonido','musica','camino','tesoro','bosque','montana','oceano','isla','ciudad','puente','reloj','tiempo','espacio','cometa','saturno','marte','tierra','luna','estrella','energia','poder','escudo','espada','magia','nivel','puntos','racha','combo','victoria','rapidez','agilidad','cerebro','logica','memoria','desafio','maquina','circuito','bateria','pantalla','servidor','usuario','archivo','carpeta','teclado','internet','codigo','funcion','variable','objeto','clase','sistema','seguridad','clave','aventura','misterio','secreto','portal','dimension','galaxia','universo','planeta','cohete','astronauta','orbita','meteorito'];
 let round=[],index=0,hits=0,misses=0,started=0,finished=false,saved=false,timer=null,remaining=30;
 const shuffle=a=>[...a].sort(()=>Math.random()-.5);
 function draw(){
  if(finished){clearInterval(timer);const score=Math.max(0,hits*10-misses*2);root.innerHTML=`<section class="game-panel mini-game-result"><div class="mini-emoji">⌨️</div><span class="eyebrow">TIEMPO AGOTADO</span><h2>¡Ronda terminada!</h2><div class="mini-stats"><div><small>Palabras correctas</small><strong>${hits}</strong></div><div><small>Errores</small><strong>${misses}</strong></div><div><small>Puntuación</small><strong>${score}</strong></div></div><button id="typing-save" class="btn btn-primary" ${saved?'disabled':''}>${saved?'✓ Puntaje guardado':'Guardar puntaje y XP'}</button><button id="typing-again" class="btn secondary">↻ Jugar otra vez</button><p id="typing-status" class="muted" aria-live="polite"></p></section>`;
   root.querySelector('#typing-save').onclick=async()=>{if(saved)return;const b=root.querySelector('#typing-save');b.disabled=true;b.textContent='Guardando…';try{await saveScore(score);saved=true;b.textContent='✓ Puntaje guardado';root.querySelector('#typing-status').textContent='Resultado registrado.';}catch(e){b.disabled=false;b.textContent='Guardar puntaje y XP';root.querySelector('#typing-status').textContent=e.message||'No se pudo guardar.';}};
   root.querySelector('#typing-again').onclick=start;return;
  }
  root.innerHTML=`<section class="game-panel mini-game-panel"><div class="mini-game-head"><span class="badge">TYPING RUSH</span><strong class="mini-timer">⏱ ${remaining}s</strong></div><p class="muted">Escribe la palabra exacta y pulsa Enter. ¡Tienes 30 segundos!</p><div class="typing-word">${round[index]}</div><form id="typing-form" class="mini-form"><input id="typing-input" class="input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe aquí…" aria-label="Escribe la palabra" required><button class="btn btn-primary">Comprobar ↵</button></form><div class="mini-stats"><div><small>Correctas</small><strong>${hits}</strong></div><div><small>Errores</small><strong>${misses}</strong></div><div><small>Palabras restantes</small><strong>${round.length-index}</strong></div></div><p id="typing-feedback" class="mini-feedback" aria-live="polite">¡A toda velocidad!</p></section>`;
  root.querySelector('#typing-form').onsubmit=e=>{e.preventDefault();if(finished)return;const val=root.querySelector('#typing-input').value.trim().toLocaleLowerCase('es');const expected=round[index].toLocaleLowerCase('es');if(val===expected)hits++;else misses++;index++;if(index>=round.length){round=shuffle(words);index=0;}draw();root.querySelector('#typing-feedback').textContent=val===expected?'¡Correcto! ⚡':`Era “${expected}”. ¡Sigue!`;root.querySelector('#typing-input').focus();};
  root.querySelector('#typing-input').focus();
 }
 function start(){clearInterval(timer);round=shuffle(words);index=0;hits=0;misses=0;remaining=30;finished=false;saved=false;draw();timer=setInterval(()=>{remaining--;if(remaining<=0){finished=true;draw();}else{const t=root.querySelector('.mini-timer');if(t)t.textContent=`⏱ ${remaining}s`; }},1000);}
 start();
}
exports.render = render;

};
__factories["js/games/quizMaster.js"]=function(exports,require){
const {escapeHtml} = require("js/ui.js");

const VOCAB = [
  ["hello", "hola"],
  ["goodbye", "adios"],
  ["please", "por favor"],
  ["thank you", "gracias"],
  ["sorry", "lo siento"],
  ["yes", "si"],
  ["no", "no"],
  ["good morning", "buenos dias"],
  ["good night", "buenas noches"],
  ["good afternoon", "buenas tardes"],
  ["welcome", "bienvenido"],
  ["friend", "amigo"],
  ["family", "familia"],
  ["mother", "madre"],
  ["father", "padre"],
  ["sister", "hermana"],
  ["brother", "hermano"],
  ["grandmother", "abuela"],
  ["grandfather", "abuelo"],
  ["child", "nino"],
  ["baby", "bebe"],
  ["woman", "mujer"],
  ["man", "hombre"],
  ["people", "gente"],
  ["name", "nombre"],
  ["teacher", "profesor"],
  ["student", "estudiante"],
  ["school", "escuela"],
  ["classroom", "salon"],
  ["book", "libro"],
  ["notebook", "cuaderno"],
  ["pencil", "lapiz"],
  ["pen", "boligrafo"],
  ["eraser", "borrador"],
  ["desk", "escritorio"],
  ["chair", "silla"],
  ["table", "mesa"],
  ["door", "puerta"],
  ["window", "ventana"],
  ["board", "tablero"],
  ["paper", "papel"],
  ["bag", "bolso"],
  ["computer", "computador"],
  ["phone", "telefono"],
  ["screen", "pantalla"],
  ["keyboard", "teclado"],
  ["mouse", "raton"],
  ["internet", "internet"],
  ["website", "sitio web"],
  ["password", "contrasena"],
  ["house", "casa"],
  ["home", "hogar"],
  ["room", "habitacion"],
  ["kitchen", "cocina"],
  ["bathroom", "bano"],
  ["bedroom", "dormitorio"],
  ["bed", "cama"],
  ["sofa", "sofa"],
  ["lamp", "lampara"],
  ["light", "luz"],
  ["wall", "pared"],
  ["floor", "piso"],
  ["roof", "techo"],
  ["garden", "jardin"],
  ["key", "llave"],
  ["city", "ciudad"],
  ["town", "pueblo"],
  ["street", "calle"],
  ["road", "carretera"],
  ["park", "parque"],
  ["store", "tienda"],
  ["market", "mercado"],
  ["hospital", "hospital"],
  ["bank", "banco"],
  ["restaurant", "restaurante"],
  ["hotel", "hotel"],
  ["airport", "aeropuerto"],
  ["station", "estacion"],
  ["library", "biblioteca"],
  ["church", "iglesia"],
  ["beach", "playa"],
  ["mountain", "montana"],
  ["river", "rio"],
  ["sea", "mar"],
  ["country", "pais"],
  ["world", "mundo"],
  ["map", "mapa"],
  ["car", "carro"],
  ["bus", "autobus"],
  ["train", "tren"],
  ["plane", "avion"],
  ["bicycle", "bicicleta"],
  ["boat", "barco"],
  ["taxi", "taxi"],
  ["ticket", "boleto"],
  ["travel", "viajar"],
  ["left", "izquierda"],
  ["right", "derecha"],
  ["straight", "derecho"],
  ["near", "cerca"],
  ["far", "lejos"],
  ["here", "aqui"],
  ["there", "alli"],
  ["food", "comida"],
  ["water", "agua"],
  ["milk", "leche"],
  ["coffee", "cafe"],
  ["tea", "te"],
  ["juice", "jugo"],
  ["bread", "pan"],
  ["rice", "arroz"],
  ["cheese", "queso"],
  ["egg", "huevo"],
  ["meat", "carne"],
  ["chicken", "pollo"],
  ["fish", "pescado"],
  ["apple", "manzana"],
  ["banana", "banano"],
  ["orange", "naranja"],
  ["grape", "uva"],
  ["strawberry", "fresa"],
  ["lemon", "limon"],
  ["potato", "papa"],
  ["tomato", "tomate"],
  ["onion", "cebolla"],
  ["carrot", "zanahoria"],
  ["salad", "ensalada"],
  ["soup", "sopa"],
  ["breakfast", "desayuno"],
  ["lunch", "almuerzo"],
  ["dinner", "cena"],
  ["hungry", "hambriento"],
  ["thirsty", "sediento"],
  ["delicious", "delicioso"],
  ["sweet", "dulce"],
  ["salt", "sal"],
  ["hot", "caliente"],
  ["cold", "frio"],
  ["plate", "plato"],
  ["cup", "taza"],
  ["spoon", "cuchara"],
  ["fork", "tenedor"],
  ["knife", "cuchillo"],
  ["animal", "animal"],
  ["dog", "perro"],
  ["cat", "gato"],
  ["bird", "pajaro"],
  ["fish", "pez"],
  ["horse", "caballo"],
  ["cow", "vaca"],
  ["pig", "cerdo"],
  ["sheep", "oveja"],
  ["goat", "cabra"],
  ["duck", "pato"],
  ["chicken", "gallina"],
  ["lion", "leon"],
  ["tiger", "tigre"],
  ["elephant", "elefante"],
  ["monkey", "mono"],
  ["bear", "oso"],
  ["rabbit", "conejo"],
  ["turtle", "tortuga"],
  ["frog", "rana"],
  ["snake", "serpiente"],
  ["butterfly", "mariposa"],
  ["bee", "abeja"],
  ["spider", "arana"],
  ["tree", "arbol"],
  ["flower", "flor"],
  ["grass", "cesped"],
  ["leaf", "hoja"],
  ["forest", "bosque"],
  ["sky", "cielo"],
  ["sun", "sol"],
  ["moon", "luna"],
  ["star", "estrella"],
  ["cloud", "nube"],
  ["rain", "lluvia"],
  ["wind", "viento"],
  ["snow", "nieve"],
  ["weather", "clima"],
  ["rainy", "lluvioso"],
  ["sunny", "soleado"],
  ["cloudy", "nublado"],
  ["day", "dia"],
  ["night", "noche"],
  ["morning", "manana"],
  ["afternoon", "tarde"],
  ["evening", "atardecer"],
  ["today", "hoy"],
  ["tomorrow", "manana"],
  ["yesterday", "ayer"],
  ["week", "semana"],
  ["month", "mes"],
  ["year", "ano"],
  ["time", "tiempo"],
  ["hour", "hora"],
  ["minute", "minuto"],
  ["early", "temprano"],
  ["late", "tarde"],
  ["now", "ahora"],
  ["always", "siempre"],
  ["never", "nunca"],
  ["sometimes", "a veces"],
  ["often", "a menudo"],
  ["happy", "feliz"],
  ["sad", "triste"],
  ["angry", "enojado"],
  ["tired", "cansado"],
  ["excited", "emocionado"],
  ["afraid", "asustado"],
  ["worried", "preocupado"],
  ["kind", "amable"],
  ["nice", "agradable"],
  ["funny", "gracioso"],
  ["beautiful", "hermoso"],
  ["ugly", "feo"],
  ["big", "grande"],
  ["small", "pequeno"],
  ["long", "largo"],
  ["short", "corto"],
  ["tall", "alto"],
  ["young", "joven"],
  ["old", "viejo"],
  ["new", "nuevo"],
  ["good", "bueno"],
  ["bad", "malo"],
  ["easy", "facil"],
  ["difficult", "dificil"],
  ["fast", "rapido"],
  ["slow", "lento"],
  ["strong", "fuerte"],
  ["weak", "debil"],
  ["clean", "limpio"],
  ["dirty", "sucio"],
  ["open", "abierto"],
  ["closed", "cerrado"],
  ["full", "lleno"],
  ["empty", "vacio"],
  ["cheap", "barato"],
  ["expensive", "costoso"],
  ["beautiful", "bonito"],
  ["red", "rojo"],
  ["blue", "azul"],
  ["green", "verde"],
  ["yellow", "amarillo"],
  ["black", "negro"],
  ["white", "blanco"],
  ["pink", "rosado"],
  ["purple", "morado"],
];
function buildEnglishQuestions() {
 const out=[];
 const makeOptions=(correctIndex, spanish)=>{
  const vals=VOCAB.map(p=>p[spanish?1:0]); const answer=vals[correctIndex];
  const wrong=[]; for(let step=37;wrong.length<3;step+=29){const v=vals[(correctIndex+step)%vals.length];if(v!==answer&&!wrong.includes(v))wrong.push(v);}
  const opts=[answer,...wrong]; for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];} return {opts, correct:opts.indexOf(answer)};
 };
 VOCAB.forEach(([en,es],i)=>{
  const styles=[
   {q:`How do you say "${es}" in English?`, answer:en, spanish:false, c:"English vocabulary", why:`"${en}" means "${es}".`},
   {q:`What does "${en}" mean in Spanish?`, answer:es, spanish:true, c:"Basic English", why:`"${en}" means "${es}".`},
   {q:`Choose the English word for "${es}".`, answer:en, spanish:false, c:"Everyday English", why:`The English word is "${en}".`},
   {q:`Which Spanish meaning matches "${en}"?`, answer:es, spanish:true, c:"Word meanings", why:`"${en}" means "${es}" in Spanish.`}
  ];
  styles.forEach(st=>{const all=VOCAB.map(p=>p[st.spanish?1:0]);const wrong=[];for(let k=1;wrong.length<3;k++){const v=all[(i+k*17+13)%all.length];if(v!==st.answer&&!wrong.includes(v))wrong.push(v);}const opts=[st.answer,...wrong];for(let j=opts.length-1;j>0;j--){const r=Math.floor(Math.random()*(j+1));[opts[j],opts[r]]=[opts[r],opts[j]];}out.push({c:st.c,q:st.q,a:opts,correct:opts.indexOf(st.answer),why:st.why});});
 });
 return out;
}
const QUESTIONS = buildEnglishQuestions();

// Evita repetir preguntas recientes entre rondas y también después de recargar la página.
const RECENT_KEY = 'neonArcadeQuizRecentQuestionsV2';
function startQuizRound() {
 let recent=[];
 try { recent=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]'); if(!Array.isArray(recent))recent=[]; } catch(e) { recent=[]; }
 const recentSet=new Set(recent);
 let available=QUESTIONS.filter(item=>!recentSet.has(item.q));
 if(available.length<10) { recent=[]; available=QUESTIONS.slice(); }
 const copy=available.slice(); for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];} const selected=copy.slice(0,10);
 recent=recent.concat(selected.map(item=>item.q)).slice(-300);
 try { localStorage.setItem(RECENT_KEY,JSON.stringify(recent)); } catch(e) {}
 return selected;
}

function render(root, saveScore) {
 let round=[], index=0, hits=0, answered=false, finished=false, saved=false;
 const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
 round=startQuizRound();
 function draw(){
  if(finished){const score=hits*10;root.innerHTML=`<section class="game-panel quiz-result"><div class="quiz-big">${hits>=8?'🏆':hits>=5?'⚡':'🎮'}</div><span class="eyebrow">RONDA COMPLETADA</span><h2>${hits}/10 respuestas correctas</h2><p>Tu puntuación: <strong>${score}/100</strong></p><div class="progress"><div style="width:${score}%"></div></div><p>${hits>=8?'¡Impresionante! Eres una máquina de conocimiento.':hits>=5?'¡Buen trabajo! Sigue entrenando.':'¡Cada ronda te enseña algo nuevo!'}</p><button id="quiz-save" class="btn btn-primary" ${saved?'disabled':''}>${saved?'✓ Puntaje guardado':'Guardar puntaje y XP'}</button><button id="quiz-again" class="btn secondary">↻ Nueva ronda</button><div id="quiz-save-status" role="status" class="muted"></div></section>`;
   root.querySelector('#quiz-save').onclick=async()=>{if(saved)return; saved=true;const b=root.querySelector('#quiz-save');b.disabled=true;b.textContent='Guardando…';try{await saveScore(score);b.textContent='✓ Puntaje guardado';root.querySelector('#quiz-save-status').textContent='Esta ronda ya fue registrada.';}catch(e){saved=false;b.disabled=false;b.textContent='Guardar puntaje y XP';root.querySelector('#quiz-save-status').textContent=e.message||'No se pudo guardar.';}};
   root.querySelector('#quiz-again').onclick=()=>{round=startQuizRound();index=0;hits=0;answered=false;finished=false;saved=false;draw();};return;
  }
  const item=round[index];
  root.innerHTML=`<section class="game-panel quiz-panel"><div class="quiz-top"><span class="badge">QUIZ MASTER</span><span class="quiz-score">⭐ ${hits*10} puntos</span></div><div class="quiz-meta"><span>${escapeHtml(item.c)}</span><span>Pregunta ${index+1} de ${round.length}</span></div><div class="progress"><div style="width:${index/round.length*100}%"></div></div><h2 class="quiz-question">${escapeHtml(item.q)}</h2><div class="quiz-answers">${item.a.map((x,i)=>`<button class="quiz-answer" data-answer="${i}" ${answered?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${escapeHtml(x)}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback" aria-live="polite"></div><div class="quiz-bottom"><span class="muted">10 puntos por respuesta correcta</span><button id="quiz-next" class="btn btn-primary" ${answered?'':'disabled'}>${index===round.length-1?'Ver resultado':'Siguiente →'}</button></div></section>`;
  root.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));
  root.querySelector('#quiz-next').onclick=()=>{if(!answered)return;index++;if(index>=round.length)finished=true;answered=false;draw();};
 }
 function answer(choice){if(answered||finished)return;answered=true;const item=round[index];const ok=choice===item.correct;if(ok)hits++;root.querySelectorAll('[data-answer]').forEach((b,i)=>{b.disabled=true;if(i===item.correct)b.classList.add('correct');else if(i===choice)b.classList.add('incorrect');});root.querySelector('#quiz-feedback').innerHTML=`<strong>${ok?'¡Correcto! 🎉':'No exactamente 😅'}</strong><p>${escapeHtml(item.why)}</p>`;root.querySelector('#quiz-next').disabled=false;root.querySelector('#quiz-next').focus();}
 draw();
}

exports.render = render;

};
__factories["js/games/catalog.js"]=function(exports,require){
const games={snakeNeon:{title:'Snake Neon',category:'Arcade',icon:'🐍',description:'Recoge frutas, activa potenciadores y supera tu récord sin chocar.',module:'./games/snakeNeon.js',arcadeV2:'snake'},whackMole:{title:'Golpea al Topo',category:'Arcade',icon:'🔨',description:'Haz combos, atrapa al topo dorado y evita los señuelos.',module:'./games/whackMole.js',arcadeV2:'whack'},neonBreakout:{title:'Neon Breakout',category:'Arcade',icon:'🧱',description:'Rompe bloques, recoge poderes y completa niveles con vidas extra.',module:'./games/neonBreakout.js',arcadeV2:'breakout'},guessNumber:{title:'Adivina Número',category:'Lógica',icon:'🎯',description:'Encuentra el número secreto.',module:'./games/guessNumber.js'},rps:{title:'Piedra, Papel o Tijera',category:'Clásico',icon:'✊',description:'Compite contra la computadora.',module:'./games/rps.js'},dice:{title:'Dados',category:'Azar',icon:'🎲',description:'Adivina el dado.',module:'./games/dice.js'},memory:{title:'Memoria PRO',category:'Memoria',icon:'🧠',description:'Recuerda secuencias.',module:'./games/memory.js'},higherLower:{title:'Mayor o Menor',category:'Predicción',icon:'📈',description:'Predice el siguiente número.',module:'./games/higherLower.js'},word:{title:'Adivina la Palabra',category:'Palabras',icon:'🔤',description:'Descubre la palabra.',module:'./games/word.js'},snakesMath:{title:'Serpientes Matemáticas',category:'Matemática',icon:'🐍',description:'Operaciones y niveles.',module:'./games/snakesMath.js'},quizMaster:{title:'Quiz Master',category:'Conocimiento',icon:'🧠',description:'Responde preguntas de ciencia, tecnología, cultura general y videojuegos.',module:'./games/quizMaster.js'},sequenceNeon:{title:'Secuencia Neon',category:'Memoria',icon:'💡',description:'Memoriza luces y sonidos, y repite secuencias cada vez más largas.',module:'./games/sequenceNeon.js'},typingRush:{title:'Typing Rush',category:'Velocidad',icon:'⌨️',description:'Escribe tantas palabras como puedas en 30 segundos.',module:'./games/typingRush.js'},reactionNeon:{title:'Reflejos Neon',category:'Reflejos',icon:'⚡',description:'Mide tu tiempo de reacción en cinco intentos.',module:'./games/reactionNeon.js'},colorRush:{title:'Caza de Color',category:'Reflejos',icon:'🎨',description:'Encuentra el color correcto antes de que se acabe el tiempo.',module:'./games/colorRush.js'},ticTacToe:{title:'Tres en Raya',category:'Estrategia',icon:'⭕',description:'Desafía a la máquina en un duelo clásico.',module:'./games/ticTacToe.js'}};

exports.games = games;

};
__factories["js/games/sequenceNeon.js"]=function(exports,require){
const {escapeHtml} = require("js/ui.js");

const COLORS = [
 {id:'cyan',name:'Cian',symbol:'◆',tone:740},
 {id:'pink',name:'Rosa',symbol:'●',tone:587},
 {id:'green',name:'Verde',symbol:'▲',tone:494},
 {id:'yellow',name:'Amarillo',symbol:'■',tone:392}
];

function render(root, saveScore) {
 let sequence=[], inputIndex=0, level=0, best=0, playingBack=false, locked=true, gameOver=false, saved=false, runId=0;
 let audio=null;
 const sound=(freq)=>{try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.13,audio.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.21);}catch{}}
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const randomColor=()=>Math.floor(Math.random()*COLORS.length);
 function cardMarkup(){return COLORS.map((c,i)=>`<button class="sequence-pad pad-${c.id}" data-pad="${i}" aria-label="${c.name}" ${locked?'disabled':''}><span>${c.symbol}</span><small>${c.name}</small></button>`).join('');}
 function draw(){
  root.innerHTML=`<section class="game-panel sequence-panel">
   <div class="sequence-heading"><div><span class="badge">MEMORIA · REFLEJOS</span><h2>💡 Secuencia Neon</h2><p>Observa las luces, memoriza el orden y repítelo sin equivocarte.</p></div><div class="sequence-stats"><div><small>Ronda</small><strong>${level}</strong></div><div><small>Récord local</small><strong>${best}</strong></div></div></div>
   <div class="sequence-status" id="sequence-status" aria-live="polite">${level===0?'Pulsa «Comenzar» para jugar.':gameOver?'Fin de la partida.':'Tu turno: repite la secuencia.'}</div>
   <div class="sequence-board">${cardMarkup()}</div>
   <div class="sequence-actions">${level===0||gameOver?`<button class="btn btn-primary" id="sequence-start">${gameOver?'↻ Jugar de nuevo':'▶ Comenzar'}</button>`:`<button class="btn secondary" id="sequence-repeat" ${playingBack?'disabled':''}>↻ Repetir secuencia</button>`}<button class="btn secondary" id="sequence-sound">${audio?'♫ Sonido activo':'♫ Sonido activado al jugar'}</button></div>
   <p class="muted sequence-help">Consejo: puedes jugar con ratón o usar las teclas 1, 2, 3 y 4.</p>
   <div id="sequence-result"></div>
  </section>`;
  root.querySelector('#sequence-start')?.addEventListener('click',start);
  root.querySelector('#sequence-repeat')?.addEventListener('click',playSequence);
  root.querySelector('#sequence-sound')?.addEventListener('click',()=>{sound(660);status('Sonido activado. ¡Escucha la secuencia!');});
  root.querySelectorAll('[data-pad]').forEach(b=>b.addEventListener('click',()=>pick(Number(b.dataset.pad))));
  if(!root.dataset.sequenceKeys){root.dataset.sequenceKeys='1';root.addEventListener('keydown',e=>{if(['1','2','3','4'].includes(e.key)&&!locked&&!playingBack&&!gameOver){e.preventDefault();pick(Number(e.key)-1);}});}
 }
 function status(msg){const el=root.querySelector('#sequence-status');if(el)el.textContent=msg;}
 async function flash(i,ms=300){const b=root.querySelector(`[data-pad="${i}"]`);if(!b)return;sound(COLORS[i].tone);b.classList.add('lit');await wait(ms);b.classList.remove('lit');}
 async function playSequence(){if(!sequence.length||gameOver)return;playingBack=true;locked=true;draw();status('Observa y escucha…');const myRun=runId;await wait(400);for(const i of sequence){if(myRun!==runId||gameOver)return;await flash(i,300);await wait(180);}if(myRun!==runId||gameOver)return;playingBack=false;locked=false;inputIndex=0;draw();status('¡Tu turno! Repite la secuencia.');}
 function start(){runId++;sequence=[randomColor()];level=1;best=Math.max(best,level);inputIndex=0;gameOver=false;saved=false;playingBack=false;locked=true;draw();playSequence();}
 async function pick(i){if(locked||playingBack||gameOver)return;await flash(i,130);if(gameOver||locked)return;if(sequence[inputIndex]!==i){finish();return;}inputIndex++;if(inputIndex>=sequence.length){level++;best=Math.max(best,level-1);locked=true;status('¡Correcto! Preparando la siguiente ronda…');const myRun=runId;await wait(550);if(myRun!==runId||gameOver)return;sequence.push(randomColor());inputIndex=0;playSequence();}}
 function finish(){gameOver=true;locked=true;playingBack=false;best=Math.max(best,level-1);draw();status(`Fin de la partida. Llegaste a la ronda ${Math.max(1,level)}.`);const score=Math.max(0,(level-1)*10);root.querySelector('#sequence-result').innerHTML=`<div class="sequence-result"><h3>${best>=8?'🏆 ¡Memoria extraordinaria!':best>=4?'⚡ ¡Buen reflejo!':'🎮 ¡Sigue practicando!'}</h3><p>Secuencia completada: <strong>${best}</strong> pasos · Puntuación: <strong>${score}</strong></p><button id="sequence-save" class="btn btn-primary" ${saved?'disabled':''}>${saved?'✓ Puntaje guardado':'Guardar puntaje y XP'}</button><span id="sequence-save-status" class="muted" role="status"></span></div>`;root.querySelector('#sequence-save').onclick=async()=>{if(saved)return;saved=true;const b=root.querySelector('#sequence-save');b.disabled=true;b.textContent='Guardando…';try{await saveScore(score);b.textContent='✓ Puntaje guardado';root.querySelector('#sequence-save-status').textContent=' Esta partida ya fue registrada.';}catch(e){saved=false;b.disabled=false;b.textContent='Guardar puntaje y XP';root.querySelector('#sequence-save-status').textContent=' '+(e.message||'No se pudo guardar.');}};}
 draw();
}

exports.render = render;

};
__factories["js/games/colorRush.js"]=function(exports,require){
function render(root,saveScore){
 const colors=[{name:'ROJO',css:'#ff4568',emoji:'🟥'},{name:'AZUL',css:'#35baff',emoji:'🟦'},{name:'VERDE',css:'#24e58a',emoji:'🟩'},{name:'AMARILLO',css:'#ffe45c',emoji:'🟨'},{name:'MORADO',css:'#bd83ff',emoji:'🟪'}];
 let left=20,points=0,miss=0,target=null,finished=false,saved=false,timer;
 function next(){target=colors[Math.floor(Math.random()*colors.length)];draw();}
 function draw(){
  if(finished){clearInterval(timer);const score=Math.max(0,points*10-miss*3);root.innerHTML=`<section class="game-panel mini-game-result"><div class="mini-emoji">🎨</div><span class="eyebrow">CAZA DE COLOR</span><h2>¡Ronda completada!</h2><div class="mini-stats"><div><small>Aciertos</small><strong>${points}</strong></div><div><small>Fallos</small><strong>${miss}</strong></div><div><small>Puntos</small><strong>${score}</strong></div></div><button id="color-save" class="btn btn-primary" ${saved?'disabled':''}>${saved?'✓ Puntaje guardado':'Guardar puntaje y XP'}</button><button id="color-again" class="btn secondary">↻ Otra ronda</button><p id="color-status" class="muted" aria-live="polite"></p></section>`;root.querySelector('#color-save').onclick=async()=>{if(saved)return;const b=root.querySelector('#color-save');b.disabled=true;b.textContent='Guardando…';try{await saveScore(score);saved=true;b.textContent='✓ Puntaje guardado';root.querySelector('#color-status').textContent='Resultado registrado.';}catch(e){b.disabled=false;b.textContent='Guardar puntaje y XP';root.querySelector('#color-status').textContent=e.message||'No se pudo guardar.';}};root.querySelector('#color-again').onclick=start;return;}
  root.innerHTML=`<section class="game-panel mini-game-panel"><div class="mini-game-head"><span class="badge">CAZA DE COLOR</span><strong class="mini-timer">⏱ ${left}s</strong></div><p class="muted">Pulsa el bloque cuyo color coincide con el nombre objetivo.</p><div class="color-target">OBJETIVO: <strong style="color:${target.css}">${target.name}</strong></div><div class="color-grid">${colors.map(c=>`<button class="color-tile" data-color="${c.name}" style="--tile:${c.css}" aria-label="${c.name}">${c.emoji}</button>`).join('')}</div><div class="mini-stats"><div><small>Aciertos</small><strong>${points}</strong></div><div><small>Fallos</small><strong>${miss}</strong></div></div><p class="mini-feedback" aria-live="polite">¡No te distraigas!</p></section>`;
  root.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{if(finished)return;const ok=b.dataset.color===target.name;if(ok)points++;else miss++;const feedback=root.querySelector('.mini-feedback');feedback.textContent=ok?'¡Bien visto! ✨':'¡Ese no era!';next();});
 }
 function start(){clearInterval(timer);left=20;points=0;miss=0;finished=false;saved=false;target=colors[0];draw();timer=setInterval(()=>{left--;if(left<=0){finished=true;draw();}else{const t=root.querySelector('.mini-timer');if(t)t.textContent=`⏱ ${left}s`; }},1000);}
 start();
}
exports.render = render;

};
__factories["js/games/rps.js"]=function(exports,require){
const {askName, gamePanel, message} = require("js/ui.js");
const {saveGameScore} = require("js/ranking.js");

function render(container) {
  let scoreSaved = false, played = false;
  const saveOnce = (...args) => { if (scoreSaved) return false; scoreSaved = true; return saveGameScore(...args); };
  const game = "Piedra, Papel o Tijera";
  let wins=0, losses=0, ties=0;
  const options = ["piedra","papel","tijera"];
  container.innerHTML = gamePanel(`
    <h3>✊ Piedra, Papel o Tijera</h3>
    <p>Juega contra la computadora.</p>
    <div class="stats"><div class="stat"><small>Victorias</small><strong id="wins">0</strong></div><div class="stat"><small>Derrotas</small><strong id="losses">0</strong></div><div class="stat"><small>Empates</small><strong id="ties">0</strong></div></div>
    <div class="choice-grid">${options.map((x,i)=>`<button class="choice" data-choice="${x}">${["✊","✋","✌️"][i]}<br>${x}</button>`).join("")}</div>
    <div id="result"></div><div class="action-row"><button class="btn btn-primary" id="finish">Guardar resultado</button></div>
  `);
  const result=container.querySelector("#result");
  container.querySelectorAll("[data-choice]").forEach(btn => btn.onclick=()=>{ played = true;
    const player=btn.dataset.choice, cpu=options[Math.floor(Math.random()*3)];
    if(player===cpu) { ties++; result.innerHTML=message(`🤝 Empate. La computadora eligió ${cpu}.`,"warn"); }
    else if((player==="piedra"&&cpu==="tijera")||(player==="papel"&&cpu==="piedra")||(player==="tijera"&&cpu==="papel")) { wins++; result.innerHTML=message(`🎉 ¡Ganaste! La computadora eligió ${cpu}.`,"success"); }
    else { losses++; result.innerHTML=message(`❌ Perdiste. La computadora eligió ${cpu}.`,"error"); }
    container.querySelector("#wins").textContent=wins; container.querySelector("#losses").textContent=losses; container.querySelector("#ties").textContent=ties;
  });
  container.querySelector("#finish").onclick=()=>{
    if(scoreSaved)return; if(!played){result.innerHTML=message("Juega al menos una ronda antes de guardar el resultado.","warn");return;} const name=askName(); if(name){saveOnce(game,name,wins);container.querySelector("#finish").disabled=true;container.querySelector("#finish").textContent="Resultado guardado ✓";result.innerHTML=message(`Resultado guardado: ${wins} victorias.`,"success");}
  };
}
exports.render = render;

};
__factories["js/games/higherLower.js"]=function(exports,require){
const {randomInt, askName, gamePanel, message} = require("js/ui.js");
const {saveGameScore} = require("js/ranking.js");

function render(container) {
  let scoreSaved = false, played = false;
  const saveOnce = (...args) => { if (scoreSaved) return false; scoreSaved = true; return saveGameScore(...args); };
  const game="Mayor o Menor"; let previous=randomInt(1,50), hits=0, stopped=false;
  container.innerHTML=gamePanel(`<h3>📈 Mayor o Menor</h3><p>Predice si el siguiente número será mayor o menor que el actual.</p><div class="sequence" id="current">${previous}</div><div class="choice-grid"><button class="choice" data-v="M">⬆️ Mayor</button><button class="choice" data-v="m">⬇️ Menor</button></div><div id="result"></div><div class="action-row"><button id="finish" class="btn btn-primary">Guardar puntaje</button></div>`);
  const result=container.querySelector("#result"), current=container.querySelector("#current");
  container.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{if(stopped)return;played=true;const next=randomInt(1,50),choice=b.dataset.v,correct=(choice==="M"&&next>previous)||(choice==="m"&&next<previous);if(correct){hits++;result.innerHTML=message(`🎉 Correcto. Salió ${next}. Aciertos: ${hits}`,"success");previous=next;current.textContent=previous;}else{stopped=true;result.innerHTML=message(`❌ Incorrecto. Salió ${next}. Aciertos: ${hits}`,"error");}});
  container.querySelector("#finish").onclick=()=>{if(scoreSaved)return;if(!played){result.innerHTML=message("Haz al menos una predicción antes de guardar.","warn");return;}const name=askName();if(name){saveOnce(game,name,hits);container.querySelector("#finish").disabled=true;container.querySelector("#finish").textContent="Puntaje guardado ✓";}};
}
exports.render = render;

};
__factories["js/games/math.js"]=function(exports,require){
const {randomInt, askName, gamePanel, message} = require("js/ui.js");
const {saveGameScore} = require("js/ranking.js");

function render(container) {
  let scoreSaved = false, played = false;
  const saveOnce = (...args) => { if (scoreSaved) return false; scoreSaved = true; return saveGameScore(...args); };
  const game="Matemática Rápida"; let hits=0, level=1, range=50, stopped=false;
  container.innerHTML=gamePanel(`<h3>➕ Matemática Rápida</h3><div class="stats"><div class="stat"><small>Nivel</small><strong id="level">1</strong></div><div class="stat"><small>Aciertos</small><strong id="hits">0</strong></div></div><div id="question"></div><div class="form-row"><input id="answer" class="input" type="number" placeholder="Respuesta"><button id="check" class="btn btn-primary">Responder</button></div><div id="result"></div><div class="action-row"><button id="finish" class="btn btn-secondary">Guardar puntaje</button></div>`);
  const q=container.querySelector("#question"), result=container.querySelector("#result");
  let a,b;
  const next=()=>{a=randomInt(1,range);b=randomInt(1,range);q.innerHTML=`<h2>${a} + ${b} = ?</h2>`;container.querySelector("#answer").value="";};
  container.querySelector("#check").onclick=()=>{if(stopped)return;const answerInput=container.querySelector("#answer");if(!answerInput.value.trim()){result.innerHTML=message("Escribe una respuesta antes de continuar.","warn");answerInput.focus();return;}played=true;const r=Number(container.querySelector("#answer").value);if(r===a+b){hits++;level++;range+=10;result.innerHTML=message(`¡Correcto! Llevas ${hits} aciertos seguidos.`,"success");container.querySelector("#hits").textContent=hits;container.querySelector("#level").textContent=level;next();}else{stopped=true;result.innerHTML=message(`❌ Incorrecto. La respuesta era ${a+b}.`,"error");}};
  container.querySelector("#finish").onclick=()=>{if(scoreSaved)return;if(!played){result.innerHTML=message("Resuelve al menos una operación antes de guardar.","warn");return;}const name=askName();if(name){saveOnce(game,name,hits);container.querySelector("#finish").disabled=true;container.querySelector("#finish").textContent="Puntaje guardado ✓";}};
  next();
}
exports.render = render;

};
__factories["js/games/reactionNeon.js"]=function(exports,require){
function render(root,saveScore){
 let phase='ready',startAt=0,reaction=0,tries=[],timer=null,early=false,saved=false;
 function draw(){
  clearTimeout(timer);
  if(phase==='result'){const avg=Math.round(tries.reduce((a,b)=>a+b,0)/tries.length);const best=Math.min(...tries);const score=Math.max(0,Math.round(1000-avg));root.innerHTML=`<section class="game-panel mini-game-result"><div class="mini-emoji">⚡</div><span class="eyebrow">REFLEJOS NEON</span><h2>${avg} ms de promedio</h2><p>Mejor reacción: <strong>${best} ms</strong></p><div class="reaction-history">${tries.map((t,i)=>`<span>Intento ${i+1}: <b>${t} ms</b></span>`).join('')}</div><button id="reaction-save" class="btn btn-primary" ${saved?'disabled':''}>${saved?'✓ Puntaje guardado':'Guardar puntaje y XP'}</button><button id="reaction-again" class="btn secondary">↻ Repetir prueba</button><p id="reaction-status" class="muted" aria-live="polite"></p></section>`;
   root.querySelector('#reaction-save').onclick=async()=>{if(saved)return;const b=root.querySelector('#reaction-save');b.disabled=true;b.textContent='Guardando…';try{await saveScore(score);saved=true;b.textContent='✓ Puntaje guardado';root.querySelector('#reaction-status').textContent='Resultado registrado.';}catch(e){b.disabled=false;b.textContent='Guardar puntaje y XP';root.querySelector('#reaction-status').textContent=e.message||'No se pudo guardar.';}};root.querySelector('#reaction-again').onclick=()=>{tries=[];saved=false;phase='ready';draw();};return;}
  const label=phase==='wait'?'ESPERA…':phase==='go'?'¡PULSA AHORA!':'EMPEZAR PRUEBA';
  root.innerHTML=`<section class="game-panel mini-game-panel"><span class="badge">REFLEJOS NEON</span><h2>¿Qué tan rápido reaccionas?</h2><p class="muted">Espera a que la pantalla se ponga verde. No pulses antes. 5 intentos.</p><button id="reaction-pad" class="reaction-pad ${phase==='go'?'reaction-go':''}">${phase==='go'?'¡YA!':phase==='wait'?'NO TODAVÍA':label}</button><p class="mini-feedback" aria-live="polite">${phase==='ready'?`Intentos completados: ${tries.length}/5`:phase==='wait'?'Concéntrate…':'¡Ahora mismo!'}</p></section>`;
  root.querySelector('#reaction-pad').onclick=()=>{if(phase==='ready'){phase='wait';early=false;draw();timer=setTimeout(()=>{phase='go';startAt=performance.now();draw();},900+Math.random()*2400);}else if(phase==='wait'){clearTimeout(timer);phase='ready';draw();const p=root.querySelector('.mini-feedback');if(p)p.textContent='¡Demasiado pronto! Pulsa para intentar otra vez.';}else if(phase==='go'){reaction=Math.round(performance.now()-startAt);tries.push(reaction);phase=tries.length>=5?'result':'ready';draw();}};
 }
 draw();
}
exports.render = render;

};
try{__load('js/app.js');}catch(e){console.error('NEON ARCADE PRO:',e);const el=document.createElement('pre');el.style.cssText='margin:20px;padding:18px;background:#300;color:#fff;white-space:pre-wrap';el.textContent='No se pudo iniciar NEON ARCADE PRO: '+e.message;document.body.appendChild(el);}})();

