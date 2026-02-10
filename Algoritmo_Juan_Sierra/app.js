const consolas = [
  "NES",
  "Super Nintendo (SNES)",
  "Nintendo 64",
  "GameCube",
  "Wii",
  "Wii U",
  "Nintendo Switch",
  "Game Boy",
  "Game Boy Advance",
  "Nintendo DS",
  "Nintendo 3DS"
];

const segmentos = {
  C: "Jugador casual",
  H: "Jugador hardcore",
  N: "Jugador nostálgico",
  F: "Jugador familiar",
  M: "Jugador portátil"
};

const contextos = {
  D: "¿Cuál consola ofrece mejor diversión general?",
  I: "¿Cuál consola fue más innovadora?",
  B: "¿Cuál tiene mejor catálogo de juegos?",
  A: "¿Cuál envejeció mejor?"
};

const RATING_INICIAL = 1000;
const K = 32;
const STORAGE_KEY = "nintendomash_v1";

function defaultState(){
  const buckets = {};
  for (let s in segmentos){
    for (let c in contextos){
      const key = `${s}__${c}`;
      buckets[key] = {};
      consolas.forEach(x => buckets[key][x] = RATING_INICIAL);
    }
  }
  return { buckets };
}

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function expected(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner){
  const ra = bucket[a], rb = bucket[b];
  const ea = expected(ra, rb);
  const eb = expected(rb, ra);

  bucket[a] = ra + K * ((winner === "A") - ea);
  bucket[b] = rb + K * ((winner === "B") - eb);
}

function randomPair(){
  let a = consolas[Math.floor(Math.random()*consolas.length)];
  let b = a;
  while (a === b){
    b = consolas[Math.floor(Math.random()*consolas.length)];
  }
  return [a,b];
}

/* UI */
const segSel = document.getElementById("segmentSelect");
const ctxSel = document.getElementById("contextSelect");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const question = document.getElementById("question");
const topBox = document.getElementById("topBox");

Object.entries(segmentos).forEach(([k,v])=>{
  segSel.innerHTML += `<option value="${k}">${v}</option>`;
});
Object.entries(contextos).forEach(([k,v])=>{
  ctxSel.innerHTML += `<option value="${k}">${v}</option>`;
});

let A,B;

function newDuel(){
  [A,B] = randomPair();
  labelA.textContent = A;
  labelB.textContent = B;
  question.textContent = contextos[ctxSel.value];
}

function vote(w){
  const key = `${segSel.value}__${ctxSel.value}`;
  updateElo(state.buckets[key], A, B, w);
  save();
  newDuel();
}

document.getElementById("btnA").onclick = ()=>vote("A");
document.getElementById("btnB").onclick = ()=>vote("B");

document.getElementById("btnShowTop").onclick = ()=>{
  const key = `${segSel.value}__${ctxSel.value}`;
  const arr = Object.entries(state.buckets[key])
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10);

  topBox.innerHTML = arr.map(
    (x,i)=>`<div class="toprow"><b>${i+1}. ${x[0]}</b><span>${x[1].toFixed(1)}</span></div>`
  ).join("");
};

document.getElementById("btnReset").onclick = ()=>{
  state = defaultState();
  save();
  newDuel();
};

newDuel();
