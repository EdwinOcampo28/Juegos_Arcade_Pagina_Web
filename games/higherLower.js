import { randomInt, askName, gamePanel, message } from "../ui.js";
import { saveGameScore } from "../ranking.js";

export function render(container) {
  let scoreSaved = false, played = false;
  const saveOnce = (...args) => { if (scoreSaved) return false; scoreSaved = true; return saveGameScore(...args); };
  const game="Mayor o Menor"; let previous=randomInt(1,50), hits=0, stopped=false;
  container.innerHTML=gamePanel(`<h3>📈 Mayor o Menor</h3><p>Predice si el siguiente número será mayor o menor que el actual.</p><div class="sequence" id="current">${previous}</div><div class="choice-grid"><button class="choice" data-v="M">⬆️ Mayor</button><button class="choice" data-v="m">⬇️ Menor</button></div><div id="result"></div><div class="action-row"><button id="finish" class="btn btn-primary">Guardar puntaje</button></div>`);
  const result=container.querySelector("#result"), current=container.querySelector("#current");
  container.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{if(stopped)return;played=true;const next=randomInt(1,50),choice=b.dataset.v,correct=(choice==="M"&&next>previous)||(choice==="m"&&next<previous);if(correct){hits++;result.innerHTML=message(`🎉 Correcto. Salió ${next}. Aciertos: ${hits}`,"success");previous=next;current.textContent=previous;}else{stopped=true;result.innerHTML=message(`❌ Incorrecto. Salió ${next}. Aciertos: ${hits}`,"error");}});
  container.querySelector("#finish").onclick=()=>{if(scoreSaved)return;if(!played){result.innerHTML=message("Haz al menos una predicción antes de guardar.","warn");return;}const name=askName();if(name){saveOnce(game,name,hits);container.querySelector("#finish").disabled=true;container.querySelector("#finish").textContent="Puntaje guardado ✓";}};
}