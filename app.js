// =====================
// 1) Datos
// =====================

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
const STORAGE_KEY = "nintendomash_state_v1";

// =====================
// 2) Estado
// =====================

function defaultState(){
  const buckets = {};
  for (const s in segmentos){
    for (const c in contextos){
      const key = `${s}__${c}`;
      buckets[key] = {};
      consolas.forEach(x => buckets[key][x] = RATING_INICIAL);
    }
  }
  return {
    buckets,
    votes: []
  };
}

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// =====================
// 3) Elo
// =====================

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
  let a = consolas[Math.floor(Math.random() * consolas.length)];
  let b = a;
  while (a === b){
    b = consolas[Math.floor(Math.random() * consolas.length)];
  }
  return [a, b];
}

// =====================
// 4) UI
// =====================

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

let A = null;
let B = null;

function newDuel(){
  [A, B] = randomPair();
  labelA.textContent = A;
  labelB.textContent = B;
  question.textContent = contextos[ctxSel.value];
}

function vote(winner){
  const seg = segSel.value;
  const ctx = ctxSel.value;
  const key = `${seg}__${ctx}`;
  const bucket = state.buckets[key];

  updateElo(bucket, A, B, winner);

  const ganador = winner === "A" ? A : B;
  const perdedor = winner === "A" ? B : A;

  state.votes.push({
    timestamp: new Date().toISOString(),
    segmento: segmentos[seg],
    contexto: contextos[ctx],
    consola_A: A,
    consola_B: B,
    ganador,
    perdedor
  });

  save();
  newDuel();
}

document.getElementById("btnA").onclick = () => vote("A");
document.getElementById("btnB").onclick = () => vote("B");

document.getElementById("btnShowTop").onclick = () => {
  const key = `${segSel.value}__${ctxSel.value}`;
  const arr = Object.entries(state.buckets[key])
    .sort((a,b) => b[1] - a[1])
    .slice(0,10);

  topBox.innerHTML = arr.map(
    (x,i) =>
      `<div class="toprow">
        <div><b>${i+1}.</b> ${x[0]}</div>
        <div>${x[1].toFixed(1)}</div>
      </div>`
  ).join("");
};

document.getElementById("btnReset").onclick = () => {
  if (!confirm("Esto borrará todos los votos guardados. ¿Continuar?")) return;
  state = defaultState();
  save();
  newDuel();
};

// =====================
// 5) Exportar CSV
// =====================

document.getElementById("btnExport").onclick = () => {
  if (state.votes.length === 0){
    alert("Aún no hay votos para exportar.");
    return;
  }

  const headers = [
    "timestamp",
    "segmento",
    "contexto",
    "consola_A",
    "consola_B",
    "ganador",
    "perdedor"
  ];

  const lines = [headers.join(",")];

  for (const v of state.votes){
    const row = headers.map(h => {
      const val = String(v[h]).replaceAll('"','""');
      return `"${val}"`;
    }).join(",");
    lines.push(row);
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "nintendomash_votos.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
};

// Init
newDuel();
