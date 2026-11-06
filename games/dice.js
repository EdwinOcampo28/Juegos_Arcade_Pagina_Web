import { randomInt, gamePanel, message } from "../ui.js";
import { saveGameScore } from "../ranking.js";
import { askName } from "../ui.js";

export function render(container) {
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