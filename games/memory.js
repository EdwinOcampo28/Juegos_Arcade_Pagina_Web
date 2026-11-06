import { randomInt, askName, gamePanel, message } from "../ui.js";
import { saveGameScore } from "../ranking.js";

export function render(container) {
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