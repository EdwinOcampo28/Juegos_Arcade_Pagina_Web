import { escapeHtml } from '../ui.js';

const COLORS = [
 {id:'cyan',name:'Cian',symbol:'◆',tone:740},
 {id:'pink',name:'Rosa',symbol:'●',tone:587},
 {id:'green',name:'Verde',symbol:'▲',tone:494},
 {id:'yellow',name:'Amarillo',symbol:'■',tone:392}
];

export function render(root, saveScore) {
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
