import { askName, gamePanel, message } from "../ui.js";
import { saveGameScore } from "../ranking.js";

export function render(container) {
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