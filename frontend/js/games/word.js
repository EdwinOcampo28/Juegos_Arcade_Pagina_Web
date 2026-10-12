import { randomInt, askName, gamePanel, message } from "../ui.js";
import { saveGameScore } from "../ranking.js";

export function render(container) {
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