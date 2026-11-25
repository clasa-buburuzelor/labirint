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

// Sleigh bells (zurgălăi)
// A real strap of sleigh bells = many small closed bells, each with a loose
// pellet inside. Every shake makes several bells ring a few milliseconds
// apart, and inside each bell the pellet bounces 2-5 times, quieter each
// time. Each strike rings with inharmonic metallic partials that die out
// fast (higher partials faster), plus a short "tick" of the pellet.
// The samples are computed once in plain JS (shortly after the page loads)
// and then played as a buffer, so playing them costs almost no CPU.

const BELL_RATE = 44100;
const BELL_RATIOS = [1, 1.47, 2.09, 2.56, 3.22];
const BELLS = Array.from({ length: 14 }, () => ({
  freq: 2300 + Math.random() * 2400,
  pan: Math.random() * 1.4 - 0.7,
}));

function addStrike(L, R, bell, t, vel) {
  const start = Math.round(t * BELL_RATE);
  const angle = ((bell.pan + 1) * Math.PI) / 4;
  const gl = Math.cos(angle);
  const gr = Math.sin(angle);
  const attack = Math.round(0.0015 * BELL_RATE);

  BELL_RATIOS.forEach((ratio, i) => {
    const f = bell.freq * ratio * (1 + (Math.random() - 0.5) * 0.008);
    const decay = (0.32 / (1 + i * 0.7)) * (0.7 + Math.random() * 0.6); // seconds to -60 dB
    const n = Math.min(Math.ceil(decay * BELL_RATE), L.length - start);
    const w = (2 * Math.PI * f) / BELL_RATE;
    const r = Math.exp(-6.9 / (decay * BELL_RATE)); // per-sample damping
    const a = vel / Math.pow(i + 1, 0.7);
    const phase = Math.random() * 2 * Math.PI;
    // damped sine via recurrence: y[k] = 2 r cos(w) y[k-1] - r^2 y[k-2]
    const c = 2 * r * Math.cos(w);
    const r2 = r * r;
    let y2 = a * Math.sin(phase - w) / r;
    let y1 = a * Math.sin(phase);

    for (let k = 0; k < n; k++) {
      const env = k < attack ? k / attack : 1;
      L[start + k] += y1 * env * gl;
      R[start + k] += y1 * env * gr;
      const y = c * y1 - r2 * y2;
      y2 = y1;
      y1 = y;
    }
  });

  // pellet tick: high-passed noise (first difference) with a 15 ms decay
  const n = Math.min(Math.round(0.015 * BELL_RATE), L.length - start);
  let prev = 0;
  for (let k = 0; k < n; k++) {
    const white = Math.random() * 2 - 1;
    const v = (white - prev) * vel * 0.35 * Math.exp((-k / n) * 6);
    prev = white;
    L[start + k] += v * gl;
    R[start + k] += v * gr;
  }
}

function shakeBells(L, R, t, strength) {
  const count = 5 + Math.floor(Math.random() * 5);

  for (let b = 0; b < count; b++) {
    const bell = BELLS[Math.floor(Math.random() * BELLS.length)];
    // bells on the strap move a little after one another
    let at = t + ((Math.random() + Math.random() + Math.random()) / 3) * 0.09;
    let vel = strength * (0.5 + Math.random() * 0.5);
    const bounces = 2 + Math.floor(Math.random() * 4);

    for (let k = 0; k < bounces; k++) {
      addStrike(L, R, bell, at, vel);
      at += 0.012 + Math.random() * 0.02;
      vel *= 0.4 + Math.random() * 0.25;
    }
  }
}

// Small-room feel: a few early echoes, each later one quieter and darker,
// alternating left/right.
function addEchoes(L, R) {
  const dry = [Float32Array.from(L), Float32Array.from(R)];
  const out = [L, R];
  let lowL = 0;
  let lowR = 0;

  for (let k = 0; k < L.length; k++) { // one-pole low-pass (~5 kHz)
    lowL += (dry[0][k] - lowL) * 0.5;
    lowR += (dry[1][k] - lowR) * 0.5;
    dry[0][k] = lowL;
    dry[1][k] = lowR;
  }

  [0.023, 0.031, 0.041, 0.059, 0.073, 0.097, 0.131, 0.17].forEach((time, i) => {
    const d = Math.round(time * BELL_RATE);
    const g = 0.3 * Math.pow(0.72, i);
    const to = out[i % 2];
    const from = dry[(i + 1) % 2]; // cross over for width

    for (let k = d; k < to.length; k++) to[k] += from[k - d] * g;
  });
}

function renderSleighBells(seconds) {
  const len = Math.ceil(BELL_RATE * (seconds + 0.6));
  const L = new Float32Array(len);
  const R = new Float32Array(len);

  // back-and-forth shaking: strong swing, weaker swing, slightly uneven
  let t = 0.01;
  for (let i = 0; t < seconds; i++) {
    const fade = 1 - (t / seconds) * 0.6;
    shakeBells(L, R, t, (i % 2 ? 0.6 : 1) * fade);
    t += 0.17 + (Math.random() - 0.5) * 0.03;
  }

  addEchoes(L, R);

  let peak = 0;
  for (let k = 0; k < len; k++) peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k]));
  const norm = peak ? 0.7 / peak : 0;
  for (let k = 0; k < len; k++) { L[k] *= norm; R[k] *= norm; }

  return [L, R];
}

const SONG_SECONDS = 5;
let bellsShort = null; // [L, R] for a level finish
let bellsLong = null; // [L, R] under the final song

function prepareBells() {
  if (SOUND !== "jingle" || bellsShort) return;

  bellsShort = renderSleighBells(1.8);
  bellsLong = renderSleighBells(SONG_SECONDS);
}

function playSamples(channels) {
  const ctx = getCtx();

  if (!ctx || !channels) return;

  const buf = ctx.createBuffer(2, channels[0].length, BELL_RATE);
  buf.getChannelData(0).set(channels[0]);
  buf.getChannelData(1).set(channels[1]);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
}

function jingleBells() {
  prepareBells();
  playSamples(bellsShort);
}

// compute the bells while the child looks at the maze, not at the goal
if (SOUND === "jingle") setTimeout(prepareBells, 500);

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

  prepareBells();
  playSamples(bellsLong);
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
