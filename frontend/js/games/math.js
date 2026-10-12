import { randomInt, askName, gamePanel, message } from "../ui.js";
import { saveGameScore } from "../ranking.js";

export function render(container) {
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