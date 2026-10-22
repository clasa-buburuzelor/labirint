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
  mazeEl.style.setProperty("--child-size", "calc(min(92vw, 62vh, 560px) / " + COLS + " * 0.7)");

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
  child.textContent = "👦";
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

function playWinSound() {
  // Uses sounds/final.mp3 if it exists, otherwise a built-in fanfare.
  const audio = new Audio("sounds/final.mp3");

  audio.play().catch(fanfare);
}

function win() {
  finished = true;

  winEl.hidden = false;
  
  playWinSound();
  
  confettiEl.innerHTML = "";
  
  const pieces = ["🎉", "⭐", "🐞", "🌸", "🎈", "✨"];
  
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
    fanfare();

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
