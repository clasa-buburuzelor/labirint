"use strict";

const LEVELS = [
  { cols: 3, rows: 3 },
  { cols: 4, rows: 4 },
  { cols: 5, rows: 5 },
  { cols: 6, rows: 6 },
  { cols: 8, rows: 8 },
  { cols: 10, rows: 10 },
];

let levelIndex = 0;
let COLS = LEVELS[0].cols;
let ROWS = LEVELS[0].rows;

const mazeEl = document.getElementById("maze");
const winEl = document.getElementById("win");
const confettiEl = document.getElementById("confetti");
const levelEl = document.getElementById("level");
const nextEl = document.getElementById("next");

let cells = [];
let player = { x: 0, y: 0 };
let ladybugEl = null;
let finished = false;
let audioCtx = null;

// Per-page settings (set via data-* attributes on <body>)
const GOAL = document.body.dataset.goal || "🖥️";
const CONFETTI = (document.body.dataset.confetti || "🎉 ⭐ 🐞 🌸 🎈 ✨").split(" ");
const SOUND = document.body.dataset.sound || "fanfare"; // "fanfare" or "jingle"

// DFS
function generateMaze() {
  cells = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ n: true, e: true, s: true, w: true, seen: false }))
  );
  
  const stack = [{ x: 0, y: 0 }];
  
  cells[0][0].seen = true;

  const moves = [
    { dx: 0, dy: -1, a: "n", b: "s" },
    { dx: 1, dy: 0, a: "e", b: "w" },
    { dx: 0, dy: 1, a: "s", b: "n" },
    { dx: -1, dy: 0, a: "w", b: "e" },
  ];

  while (stack.length) {
    const cur = stack[stack.length - 1];
    const options = moves
      .map((m) => ({ ...m, nx: cur.x + m.dx, ny: cur.y + m.dy }))
      .filter((m) => m.nx >= 0 && m.ny >= 0 && m.nx < COLS && m.ny < ROWS && !cells[m.ny][m.nx].seen);
    
    if (!options.length) {
      stack.pop();

      continue;
    }

    const pick = options[Math.floor(Math.random() * options.length)];
    
    cells[cur.y][cur.x][pick.a] = false;
    cells[pick.ny][pick.nx][pick.b] = false;
    cells[pick.ny][pick.nx].seen = true;

    stack.push({ x: pick.nx, y: pick.ny });
  }
}

function placeAt(el, x, y) {
  el.style.left = (x * 100) / COLS + "%";
  el.style.top = (y * 100) / ROWS + "%";
}

function drawMaze() {
  mazeEl.innerHTML = "";
  mazeEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  mazeEl.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

  mazeEl.style.setProperty("--wall-w", (COLS >= 15 ? 3 : COLS >= 10 ? 4 : 6) + "px");
  mazeEl.style.setProperty("--child-size", "calc(var(--maze-size) / " + COLS + " * 0.7)");

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = cells[y][x];
      const div = document.createElement("div");
      div.className = "cell" + ["n", "e", "s", "w"].filter((d) => c[d]).map((d) => " " + d).join("");
      mazeEl.appendChild(div);
    }
  }

  const child = document.createElement("div");
  child.className = "child";
  child.textContent = GOAL;
  child.style.width = 100 / COLS + "%";
  child.style.height = 100 / ROWS + "%";
  placeAt(child, COLS - 1, ROWS - 1);
  mazeEl.appendChild(child);

  ladybugEl = document.createElement("div");
  ladybugEl.className = "ladybug";
  ladybugEl.style.width = 100 / COLS + "%";
  ladybugEl.style.height = 100 / ROWS + "%";
  const img = document.createElement("img");
  img.src = "images/bubu-very-small.png";
  img.alt = "Buburuza";
  img.onerror = () => { img.replaceWith(document.createTextNode("🐞")); };
  ladybugEl.appendChild(img);
  placeAt(ladybugEl, player.x, player.y);
  mazeEl.appendChild(ladybugEl);
}

function move(dir) {
  if (finished) return;

  const c = cells[player.y][player.x];
  
  const map = {
    up: { wall: "n", dx: 0, dy: -1 },
    right: { wall: "e", dx: 1, dy: 0 },
    down: { wall: "s", dx: 0, dy: 1 },
    left: { wall: "w", dx: -1, dy: 0 },
  };

  const m = map[dir];
  
  if (!m) return;
  
  if (c[m.wall]) { blip(160); return; } // there is a wall
  
  player.x += m.dx;
  player.y += m.dy;
  
  placeAt(ladybugEl, player.x, player.y);
  
  blip(520 + player.x * 30 + player.y * 30);
  
  if (player.x === COLS - 1 && player.y === ROWS - 1)
    finishLevel();
}

document.addEventListener("keydown", (e) => {
  const keys = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  
  if (keys[e.key]) {
    e.preventDefault();

    move(keys[e.key]);
  }
});

document.querySelectorAll(".pad button").forEach((b) =>
  b.addEventListener("click", () => move(b.dataset.dir))
);

// sounds
function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;

    if (AC) audioCtx = new AC();
  }

  return audioCtx;
}

function blip(freq) {
  // const ctx = getCtx();
  // if (!ctx) return;
  // const osc = ctx.createOscillator();
  // const gain = ctx.createGain();
  // osc.type = "sine";
  // osc.frequency.value = freq;
  // gain.gain.setValueAtTime(0.08, ctx.currentTime);
  // gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  // osc.connect(gain).connect(ctx.destination);
  // osc.start();
  // osc.stop(ctx.currentTime + 0.12);
}

function fanfare() {
  const ctx = getCtx();

  if (!ctx) return;

  [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
    const t = ctx.currentTime + i * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

// Sleigh bells (zurgălăi), copied from "Trenul lui Bubu"
// (shared/js/audio/music.js: jingle() and rattleNoise()).
// One shake = a few tiny high bells struck together, and their rattle.
// They are shaken on every half beat, a little louder on the beat.

const BELLS_TEMPO = 116; // beats per minute, as in the "Clopoței" song
const BELLS_VOLUME = 2; // relative to the original game's levels
let rattleBuffer = null;

/** Half a second of noise for the bells' rattle (made once). */
function rattleNoise(ctx) {
  if (!rattleBuffer) {
    rattleBuffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = rattleBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return rattleBuffer;
}

/** A shake of sleigh bells; `accent` = on the beat (a little louder). */
function jingle(ctx, t, out, accent) {
  const level = (accent ? 0.05 : 0.03) * BELLS_VOLUME;
  const g = ctx.createGain();
  g.gain.value = level;
  g.connect(out);
  for (let i = 0; i < 4; i++) {
    const start = t + Math.random() * 0.025;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 4800 + Math.random() * 3600;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, start);
    og.gain.exponentialRampToValueAtTime(0.5, start + 0.002);
    og.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.connect(og).connect(g);
    osc.start(start);
    osc.stop(start + 0.2);
  }
  const src = ctx.createBufferSource();
  src.buffer = rattleNoise(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 6500;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.6, t + 0.004);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(hp).connect(ng).connect(g);
  src.start(t, Math.random() * 0.4, 0.12);
}

/** Shakes the bells on every half beat for `seconds`. */
function jingleBells(seconds = 1.8, halfBeat = 30 / BELLS_TEMPO) {
  const ctx = getCtx();

  if (!ctx) return;

  const t0 = ctx.currentTime + 0.02;
  for (let k = 0; k * halfBeat < seconds; k++)
    jingle(ctx, t0 + k * halfBeat, ctx.destination, k % 2 === 0);
}

// "Jingle bells, jingle bells, jingle all the way" with bells in the background
function jingleSong() {
  const ctx = getCtx();

  if (!ctx) return;

  const E = 659, G = 784, C = 523, D = 587;
  const notes = [[E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 4]];
  const beat = 0.28;
  let t = ctx.currentTime;

  notes.forEach(([f, len]) => {
    [1, 2, 3.01].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? "triangle" : "sine";
      osc.frequency.value = f * ratio;
      gain.gain.setValueAtTime(0.18 / (i * 2 + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + len * beat + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len * beat + 0.2);
    });
    t += len * beat;
  });

  // the bells on every half beat of the melody, louder on the beat
  jingleBells(t - ctx.currentTime, beat / 2);
}

function playGoalSound() {
  if (SOUND === "jingle") jingleBells();
  else fanfare();
}

function playWinSound() {
  if (SOUND === "jingle") { jingleSong(); return; }

  // Uses sounds/final.mp3 if it exists, otherwise a built-in fanfare.
  const audio = new Audio("sounds/final.mp3");

  audio.play().catch(fanfare);
}

function win() {
  finished = true;

  winEl.hidden = false;
  
  playWinSound();
  
  confettiEl.innerHTML = "";
  
  const pieces = CONFETTI;
  
  for (let i = 0; i < 200; i++) {
    const s = document.createElement("span");
    s.textContent = pieces[i % pieces.length];
    s.style.left = Math.random() * 100 + "%";
    s.style.animationDuration = 3 + Math.random() * 3 + "s";
    s.style.animationDelay = Math.random() * 2 + "s";
    confettiEl.appendChild(s);
  }
}

function finishLevel() {
  finished = true;

  if (levelIndex < LEVELS.length - 1) {
    playGoalSound();

    nextEl.hidden = false;
  } else {
    win();
  }
}

function startLevel() {
  COLS = LEVELS[levelIndex].cols;
  ROWS = LEVELS[levelIndex].rows;
  
  finished = false;
  player = { x: 0, y: 0 };
  winEl.hidden = true;
  nextEl.hidden = true;
  levelEl.textContent =
    "Nivelul " + (levelIndex + 1) + " din " + LEVELS.length + "  " +
    "⭐".repeat(levelIndex + 1) + "☆".repeat(LEVELS.length - levelIndex - 1);

  generateMaze();

  drawMaze();
}

document.getElementById("go-next").addEventListener("click", () => {
  levelIndex++;
  
  startLevel();
});

document.getElementById("again").addEventListener("click", () => {
  levelIndex = 0;

  startLevel();
});

startLevel();
