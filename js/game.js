/* ==========================================================================
   Txtr — game engine
   Bold Cartoon Arcade. True-perspective pseudo-3D highway + typing layer.
   Depends on: content.js (data), audio.js (AudioManager).
   ========================================================================== */
"use strict";

/* --- DOM ------------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");

const el = {
  scoreVal: $("scoreVal"), bestVal: $("bestVal"), coinVal: $("coinVal"), mphVal: $("mphVal"),
  comboWrap: $("comboWrap"), comboMult: $("comboMult"), comboCount: $("comboCount"), comboBar: $("comboBar"),
  threadName: $("threadName"), btnPause: $("btnPause"), btnMute: $("btnMute"),
  fxLayer: $("fxLayer"), bannerLayer: $("bannerLayer"), pickupRow: $("pickupRow"),
  dock: $("dock"), incoming: $("incoming"), typeBox: $("typeBox"), typeInput: $("typeInput"),
  sendTimer: $("sendTimer"), sendTimerFill: $("sendTimerFill"),
  steerLeft: $("steerLeft"), steerRight: $("steerRight"),
  // screens
  screenStart: $("screenStart"), screenPause: $("screenPause"), screenOver: $("screenOver"),
  screenGarage: $("screenGarage"), screenTrophies: $("screenTrophies"),
  startBest: $("startBest"), startCoins: $("startCoins"), dailyState: $("dailyState"),
  btnPlay: $("btnPlay"), btnGarage: $("btnGarage"), btnTrophies: $("btnTrophies"), btnDaily: $("btnDaily"), modeDesc: $("modeDesc"),
  btnResume: $("btnResume"), btnRestartPause: $("btnRestartPause"), btnMenuPause: $("btnMenuPause"),
  overTitle: $("overTitle"), overScore: $("overScore"), overNewBest: $("overNewBest"),
  overCoinsEarned: $("overCoinsEarned"), overTexts: $("overTexts"), overNear: $("overNear"),
  overCombo: $("overCombo"), overAcc: $("overAcc"), overWpm: $("overWpm"), overDist: $("overDist"),
  overUnlocks: $("overUnlocks"), btnRetry: $("btnRetry"), btnGarageOver: $("btnGarageOver"), btnMenuOver: $("btnMenuOver"),
  garageGrid: $("garageGrid"), garageCoins: $("garageCoins"), btnGarageBack: $("btnGarageBack"),
  achList: $("achList"), leaderList: $("leaderList"), statList: $("statList"), btnTrophiesBack: $("btnTrophiesBack"),
};

/* --- Tunables ------------------------------------------------------------- */
const LANE_COUNT = 5;
const CENTER_LANE = (LANE_COUNT - 1) / 2;          // 2
const CAM_DEPTH = 1.0;                              // perspective strength
const PLAYER_DEPTH = 0.6;                           // keeps the car above the dock
const SPAWN_DEPTH = 14;                             // where traffic / coins appear
const ROAD_FAR = 30;                                // road drawn beyond spawn
const HALF_LANES = LANE_COUNT / 2;                  // road edge = 2.5 lane-units
const LANE_SPREAD = 0.205;                          // screen px per lane-unit per scale per width
const HORIZON_RATIO = 0.30;
const DEPTH_PER_SPEED = 0.15;                       // world closing speed -> depth/sec
const COLLIDE_LANE = 0.55;
const NEARMISS_LANE = 1.35;
const COMBO_TIME = 6.0;
const MULT_STEP = 0.15;
const MULT_MAX = 12;
const STORE_KEY = "txtr-profile-v2";

/* --- Math / RNG ----------------------------------------------------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// gameplay RNG (seeded in daily mode); cosmetics use Math.random directly
let rng = Math.random;
const rand = (min, max) => min + rng() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dailySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

/* --- Profile (persistent) ------------------------------------------------- */
function defaultProfile() {
  return {
    coins: 0, best: 0,
    ownedCars: ["cherry"], selectedCar: "cherry",
    achievements: [], leaderboard: [],
    daily: { date: "", best: 0 },
    stats: { runs: 0, perfectTexts: 0, totalCoins: 0, daysPlayed: 0, lastDay: "", bestMult: 0, topMph: 0, bestDistance: 0 },
    muted: false, difficulty: "normal",
  };
}
function loadProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    const p = defaultProfile();
    Object.assign(p, raw);
    p.stats = Object.assign(defaultProfile().stats, raw.stats || {});
    p.daily = Object.assign(defaultProfile().daily, raw.daily || {});
    if (!Array.isArray(p.ownedCars) || !p.ownedCars.length) p.ownedCars = ["cherry"];
    if (!CARS.some((c) => c.id === p.selectedCar)) p.selectedCar = "cherry";
    return p;
  } catch (e) {
    return defaultProfile();
  }
}
function saveProfile() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ }
}
const profile = loadProfile();

/* --- Audio ---------------------------------------------------------------- */
const audio = new AudioManager();
audio.setMuted(profile.muted);

/* --- Game state ----------------------------------------------------------- */
const game = {
  state: "menu",          // menu | playing | paused | gameover
  width: 0, height: 0,
  time: 0, lastFrame: 0,
  scroll: 0,              // world scroll for road animation
  speed: 30, baseSpeed: 30,
  score: 0, distance: 0, coins: 0, texts: 0,
  currentLane: CENTER_LANE, targetLane: CENTER_LANE, safeLane: CENTER_LANE,
  traffic: [], pickups: [], particles: [],
  spawnTimer: 0.8,
  combo: 0, mult: 1, comboTimer: 0,
  shield: false, invuln: 0, magnet: 0, boost: 0,
  shake: 0, slowmo: 0, flashT: 0,
  difficulty: DIFFICULTIES[profile.difficulty] || DIFFICULTIES.normal,
  daily: false,
  // conversation
  threadOrder: [], threadIndex: 0, thread: null, lineIndex: 0,
  awaiting: false, expected: "", typingStart: null,
  timedReply: false, replyTimer: 0, replyTimerMax: 0,
  // typing stats
  charsTyped: 0, typingMs: 0, correctChars: 0, expectedChars: 0,
  // run summary
  run: { nearMisses: 0, bestMult: 0, topMph: 0, perfectTexts: 0 },
  timers: [],
};

/* --- Scheduled tasks (cleared on reset) ----------------------------------- */
function schedule(fn, delay) {
  const id = window.setTimeout(() => {
    game.timers = game.timers.filter((t) => t !== id);
    fn();
  }, delay);
  game.timers.push(id);
}
function clearTasks() {
  game.timers.forEach((id) => window.clearTimeout(id));
  game.timers.length = 0;
}

/* --- Projection (true perspective) ---------------------------------------- */
function project(depth, lane) {
  const w = game.width, h = game.height;
  const horizonY = h * HORIZON_RATIO;
  const scale = CAM_DEPTH / (depth + CAM_DEPTH);   // 1 at camera, ->0 at distance
  const y = horizonY + (h - horizonY) * scale;
  const laneUnit = scale * LANE_SPREAD * w;
  const x = w / 2 + (lane - CENTER_LANE) * laneUnit;
  return { x, y, scale, laneUnit, horizonY };
}

/* --- HUD ------------------------------------------------------------------ */
const mphOf = (speed) => Math.round(38 + speed * 1.42);
function updateHud() {
  el.scoreVal.textContent = game.score.toLocaleString();
  el.bestVal.textContent = profile.best.toLocaleString();
  el.coinVal.textContent = game.coins.toLocaleString();
  el.mphVal.textContent = mphOf(game.speed);
  el.threadName.textContent = game.thread ? game.thread.contact : "—";
  if (game.combo > 0) {
    el.comboWrap.classList.add("show");
    el.comboMult.textContent = "x" + game.mult.toFixed(1);
    el.comboCount.textContent = game.combo + " combo";
    el.comboBar.style.width = clamp(game.comboTimer / COMBO_TIME, 0, 1) * 100 + "%";
  } else {
    el.comboWrap.classList.remove("show");
  }
  renderPickupRow();
}
function renderPickupRow() {
  const items = [];
  if (game.shield) items.push(`<span class="pu pu-shield">🛡 Shield</span>`);
  if (game.magnet > 0) items.push(`<span class="pu pu-magnet">🧲 ${game.magnet.toFixed(0)}s</span>`);
  if (game.boost > 0) items.push(`<span class="pu pu-boost">✦ x2 ${game.boost.toFixed(0)}s</span>`);
  el.pickupRow.innerHTML = items.join("");
}

/* --- Combo ---------------------------------------------------------------- */
function recomputeMult() { game.mult = clamp(1 + game.combo * MULT_STEP, 1, MULT_MAX); }
function addCombo(n = 1) {
  game.combo += n;
  game.comboTimer = COMBO_TIME;
  recomputeMult();
  if (game.mult > game.run.bestMult) game.run.bestMult = game.mult;
  if (game.combo > 0 && game.combo % 5 === 0) {
    audio.combo(game.combo);
    banner(`x${game.mult.toFixed(1)} MULTIPLIER`, `${game.combo} combo!`, "gold");
  }
}
function breakCombo() {
  if (game.combo === 0) return;
  game.combo = 0; game.mult = 1; game.comboTimer = 0;
}

/* --- Scoring -------------------------------------------------------------- */
function addScore(base) {
  const gained = Math.round(base * game.mult * (game.boost > 0 ? 2 : 1));
  game.score += gained;
  return gained;
}

/* --- Juice: popups, banners, particles, shake, flash, slowmo -------------- */
function popup(text, sx, sy, cls = "") {
  const d = document.createElement("div");
  d.className = "popup " + cls;
  d.textContent = text;
  d.style.left = sx + "px";
  d.style.top = sy + "px";
  el.fxLayer.appendChild(d);
  schedule(() => d.remove(), 950);
}
function banner(main, sub, cls = "") {
  const d = document.createElement("div");
  d.className = "banner " + cls;
  d.innerHTML = `<span class="banner-main">${main}</span>` + (sub ? `<span class="banner-sub">${sub}</span>` : "");
  el.bannerLayer.appendChild(d);
  schedule(() => d.remove(), 1100);
}
function flash(alpha = 0.5) { game.flashT = alpha; }
function addShake(amount) { game.shake = Math.min(28, game.shake + amount); }
function spawnParticles(x, y, colors, count, power) {
  for (let i = 0; i < count; i += 1) {
    game.particles.push({
      x, y,
      vx: (Math.random() * 2 - 1) * power,
      vy: (Math.random() * 1.6 - 2.2) * power,
      size: 2 + Math.random() * 6,
      life: 0.4 + Math.random() * 0.5, max: 0.9,
      color: colors[(Math.random() * colors.length) | 0],
      grav: 9 + Math.random() * 6,
    });
  }
}

/* ==========================================================================
   SCREENS
   ========================================================================== */
function hideAllScreens() {
  [el.screenStart, el.screenPause, el.screenOver, el.screenGarage, el.screenTrophies]
    .forEach((s) => s.classList.remove("show"));
}
function showStart() {
  game.state = "menu";
  hideAllScreens();
  el.screenStart.classList.add("show");
  el.startBest.textContent = profile.best.toLocaleString();
  el.startCoins.textContent = profile.coins.toLocaleString();
  syncDailyLabel();
  syncDifficultyButtons();
  el.dock.classList.remove("active");
}
function syncDailyLabel() {
  el.dailyState.textContent = game.daily ? "ON" : "OFF";
  el.btnDaily.classList.toggle("on", game.daily);
}
function syncDifficultyButtons() {
  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.classList.toggle("on", b.dataset.mode === game.difficulty.id);
  });
  if (el.modeDesc) el.modeDesc.textContent = game.difficulty.label;
}

/* --- Garage --------------------------------------------------------------- */
function carThumb(car) {
  // tiny inline SVG-ish preview via canvas data is overkill; use CSS shapes
  return `<span class="thumb" style="--body:${car.body};--shade:${car.shade};--roof:${car.roof}"></span>`;
}
function renderGarage() {
  el.garageCoins.textContent = profile.coins.toLocaleString();
  el.garageGrid.innerHTML = CARS.map((car) => {
    const owned = profile.ownedCars.includes(car.id);
    const selected = profile.selectedCar === car.id;
    const canBuy = !owned && profile.coins >= car.price;
    let action;
    if (selected) action = `<button class="car-btn" disabled>Equipped</button>`;
    else if (owned) action = `<button class="car-btn equip" data-equip="${car.id}">Equip</button>`;
    else action = `<button class="car-btn buy ${canBuy ? "" : "locked"}" data-buy="${car.id}">🪙 ${car.price}</button>`;
    return `<div class="car-card ${selected ? "selected" : ""} ${owned ? "" : "locked"}">
      ${carThumb(car)}
      <div class="car-name">${car.name}</div>
      ${action}
    </div>`;
  }).join("");
  el.garageGrid.querySelectorAll("[data-equip]").forEach((b) =>
    b.addEventListener("click", () => { equipCar(b.dataset.equip); }));
  el.garageGrid.querySelectorAll("[data-buy]").forEach((b) =>
    b.addEventListener("click", () => { buyCar(b.dataset.buy); }));
}
function equipCar(id) {
  if (!profile.ownedCars.includes(id)) return;
  profile.selectedCar = id; saveProfile(); audio.uiClick(); renderGarage();
}
function buyCar(id) {
  const car = CARS.find((c) => c.id === id);
  if (!car || profile.ownedCars.includes(id)) return;
  if (profile.coins < car.price) { audio.denied(); shakeEl(el.garageCoins); return; }
  profile.coins -= car.price;
  profile.ownedCars.push(id);
  profile.selectedCar = id;
  saveProfile(); audio.purchase(); renderGarage();
}
function shakeEl(node) { node.classList.remove("nope"); void node.offsetWidth; node.classList.add("nope"); }
function showGarage() { hideAllScreens(); el.screenGarage.classList.add("show"); renderGarage(); }

/* --- Trophies / stats / leaderboard --------------------------------------- */
function renderTrophies() {
  el.achList.innerHTML = ACHIEVEMENTS.map((a) => {
    const got = profile.achievements.includes(a.id);
    return `<div class="ach ${got ? "got" : ""}">
      <span class="ach-icon">${got ? "🏆" : "🔒"}</span>
      <span class="ach-body"><strong>${a.name}</strong><span>${a.desc}</span></span>
    </div>`;
  }).join("");
  const lb = [...profile.leaderboard].sort((a, b) => b.score - a.score).slice(0, 8);
  el.leaderList.innerHTML = lb.length
    ? lb.map((r, i) => `<li><span class="rank">${i + 1}</span><span class="lb-score">${r.score.toLocaleString()}</span><span class="lb-meta">${r.daily ? "Daily · " : ""}${r.mode}</span></li>`).join("")
    : `<li class="empty">No runs yet — go drive!</li>`;
  const s = profile.stats;
  const rows = [
    ["Total runs", s.runs], ["Best score", profile.best.toLocaleString()],
    ["Perfect texts", s.perfectTexts], ["Coins banked", profile.coins.toLocaleString()],
    ["Lifetime coins", s.totalCoins.toLocaleString()], ["Top speed", mphOf(0) && (s.topMph + " mph")],
    ["Best multiplier", "x" + (s.bestMult || 1).toFixed(1)], ["Longest drive", Math.round(s.bestDistance) + " m"],
    ["Cars owned", profile.ownedCars.length + " / " + CARS.length],
  ];
  el.statList.innerHTML = rows.map(([k, v]) => `<div class="stat-row"><span>${k}</span><strong>${v}</strong></div>`).join("");
}
function showTrophies() { hideAllScreens(); el.screenTrophies.classList.add("show"); renderTrophies(); }

/* ==========================================================================
   TYPING SYSTEM
   ========================================================================== */
const tokenize = (t) => t.replace(/\n/g, " ").split(" ");
function analyze(input, target) {
  const inW = tokenize(input), tgW = tokenize(target);
  const n = Math.max(inW.length, tgW.length);
  let mistakes = 0, correct = 0, total = 0, exactWords = 0;
  const words = [];
  for (let i = 0; i < n; i += 1) {
    const typed = inW[i] ?? "", want = tgW[i] ?? "";
    const len = Math.max(typed.length, want.length);
    const chars = [];
    let wm = 0;
    for (let j = 0; j < len; j += 1) {
      const tc = typed[j] ?? "", wc = want[j] ?? "";
      if (tc && wc && tc === wc) { correct += 1; chars.push({ ch: tc, st: "correct" }); }
      else { mistakes += 1; wm += 1;
        if (tc && !wc) chars.push({ ch: tc, st: "extra" });
        else if (!tc && wc) chars.push({ ch: wc, st: "missing" });
        else chars.push({ ch: tc, st: "incorrect" });
      }
    }
    total += len;
    if ((typed || want) && wm === 0 && typed === want) exactWords += 1;
    words.push({ chars, want, typed });
  }
  return { mistakes, correct, total, exactWords, wordCount: n, words, perfect: input === target && target.length > 0 };
}

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function renderTypeBox(input) {
  if (!game.awaiting) return;
  const target = game.expected;
  const inW = tokenize(input), tgW = tokenize(target);
  const curWord = inW.length - 1;
  const html = [];
  for (let wi = 0; wi < tgW.length; wi += 1) {
    const want = tgW[wi], typed = inW[wi] ?? "";
    const isCur = wi === curWord && curWord < tgW.length;
    let w = `<span class="tw">`;
    for (let ci = 0; ci < want.length; ci += 1) {
      if (isCur && ci === typed.length) w += `<span class="caret"></span>`;
      if (ci < typed.length) {
        w += `<span class="${typed[ci] === want[ci] ? "c-ok" : "c-bad"}">${esc(want[ci])}</span>`;
      } else {
        w += `<span class="c-rem">${esc(want[ci])}</span>`;
      }
    }
    for (let ci = want.length; ci < typed.length; ci += 1) w += `<span class="c-extra">${esc(typed[ci])}</span>`;
    if (isCur && typed.length >= want.length) w += `<span class="caret"></span>`;
    w += `</span>`;
    html.push(w);
  }
  el.typeBox.innerHTML = html.join(" ");
}

function beginReply(text) {
  game.awaiting = true;
  game.expected = text;
  game.typingStart = null;
  el.typeInput.value = "";
  el.typeInput.disabled = false;
  el.dock.classList.add("composing");
  el.dock.classList.remove("review", "perfect", "error");
  renderTypeBox("");
  startSendTimer(text);
  focusInput();
}
function focusInput() {
  if (game.state === "playing" && game.awaiting) {
    window.requestAnimationFrame(() => { try { el.typeInput.focus({ preventScroll: true }); } catch (e) { el.typeInput.focus(); } });
  }
}

/* --- Send timer (Normal/Mayhem): reply before the bar empties -------------- */
function sendTimeFor(text) {
  const cfg = game.difficulty.send;
  return cfg ? cfg.base + text.length * cfg.per : 0; // 0 = no timer (Chill)
}
function startSendTimer(text) {
  const t = sendTimeFor(text);
  game.timedReply = t > 0;
  game.replyTimerMax = t;
  game.replyTimer = t;
  updateSendTimerUI();
}
function stopSendTimer() {
  game.timedReply = false;
  el.sendTimer.classList.remove("show");
}
function updateSendTimerUI() {
  if (game.timedReply && game.awaiting && game.replyTimerMax > 0) {
    el.sendTimer.classList.add("show");
    const frac = clamp(game.replyTimer / game.replyTimerMax, 0, 1);
    el.sendTimerFill.style.width = frac * 100 + "%";
    el.sendTimerFill.className = "send-timer-fill" + (frac < 0.25 ? " danger" : frac < 0.5 ? " warn" : "");
  } else {
    el.sendTimer.classList.remove("show");
  }
}
function replyTimeout() {
  if (!game.awaiting) return;
  stopSendTimer();
  if (el.typeInput.value.length > 0) {
    submitReply();                 // send what's typed — partial = penalty + combo break
    return;
  }
  // nothing typed: the message is missed
  breakCombo();
  game.awaiting = false;
  game.lineIndex += 1;
  el.typeInput.value = "";
  el.typeInput.disabled = true;
  el.dock.classList.remove("composing", "ready");
  el.dock.classList.add("error");
  audio.typo();
  banner("TOO SLOW", "Message missed", "");
  updateHud();
  schedule(advanceConversation, 800);
}
function onType() {
  if (!game.awaiting) return;
  const v = el.typeInput.value;
  audio.type();
  if (v.length > 0 && game.typingStart === null) game.typingStart = performance.now();
  renderTypeBox(v);
  const a = analyze(v, game.expected);
  el.dock.classList.toggle("error", a.mistakes > 0);
  el.dock.classList.toggle("ready", a.perfect);
}
function submitReply() {
  if (game.state !== "playing" || !game.awaiting) return;
  const sent = el.typeInput.value;
  if (sent.length === 0) return; // ignore empty sends
  stopSendTimer();
  const a = analyze(sent, game.expected);
  game.charsTyped += sent.length;
  game.typingMs += game.typingStart ? performance.now() - game.typingStart : 0;
  game.correctChars += a.correct;
  game.expectedChars += a.total;
  game.texts += 1;

  const proj = project(PLAYER_DEPTH, game.currentLane);
  if (a.perfect) {
    addCombo(1);
    const gained = addScore(90 + game.expected.length * 4);
    game.run.perfectTexts += 1;
    profile.stats.perfectTexts += 1;
    audio.perfect();
    popup(`PERFECT +${gained}`, proj.x, proj.y - proj.laneUnit * 1.6, "perfect");
    el.dock.classList.add("perfect");
  } else {
    breakCombo();
    const base = clamp(40 + a.correct * 2 - a.mistakes * 8, 6, 9999);
    const gained = Math.round(base);
    game.score += gained;
    audio.typo();
    popup(`+${gained}`, proj.x, proj.y - proj.laneUnit * 1.6, "ok");
    el.dock.classList.add("error");
  }

  game.awaiting = false;
  game.lineIndex += 1;
  el.typeInput.value = "";
  el.typeInput.disabled = true;
  el.dock.classList.remove("composing", "ready");
  el.dock.classList.add("review");
  updateHud();
  schedule(advanceConversation, 850);
}

/* --- Conversation flow ---------------------------------------------------- */
function getThread() { return CONVERSATIONS[game.threadOrder[game.threadIndex]]; }
function beginThread(index) {
  game.threadIndex = index % game.threadOrder.length;
  game.thread = getThread();
  game.lineIndex = 0;
  game.awaiting = false;
  stopSendTimer();
  el.incoming.textContent = "…";
  el.typeBox.innerHTML = "";
  updateHud();
  schedule(advanceConversation, 700);
}
function advanceConversation() {
  if (game.state !== "playing" || !game.thread) return;
  if (game.lineIndex >= game.thread.lines.length) {
    el.incoming.textContent = "Thread archived — loading your next bad decision…";
    schedule(() => beginThread((game.threadIndex + 1) % game.threadOrder.length), 900);
    return;
  }
  const line = game.thread.lines[game.lineIndex];
  if (line.from === "other") {
    el.incoming.textContent = line.text;
    audio.receive();
    game.lineIndex += 1;
    el.dock.classList.remove("composing", "review", "perfect", "error", "ready");
    el.typeBox.innerHTML = "";
    schedule(advanceConversation, 850 + Math.min(1100, line.text.length * 16));
  } else {
    beginReply(line.text);
  }
}

/* ==========================================================================
   SPAWNING
   ========================================================================== */
function spawnWave() {
  const drift = pick([-1, 0, 1]);
  game.safeLane = clamp(game.safeLane + drift, 0, LANE_COUNT - 1);
  const wide = game.speed > 44 && rng() < game.difficulty.doubleChance ? 2 : 1;

  const patterns = [];
  for (let start = 0; start <= LANE_COUNT - wide; start += 1) {
    const lanes = Array.from({ length: wide }, (_, k) => start + k);
    if (!lanes.includes(game.safeLane)) patterns.push(lanes);
  }
  const blocked = pick(patterns) || [game.safeLane === 0 ? 2 : 0];
  const open = [];
  for (let l = 0; l < LANE_COUNT; l += 1) if (!blocked.includes(l)) open.push(l);

  for (const lane of blocked) {
    game.traffic.push({
      lane, depth: SPAWN_DEPTH + rand(0, 2.5),
      pal: pick(TRAFFIC_PALETTE), bob: rand(0, Math.PI * 2),
      passed: false,
    });
  }

  // reward lane: coins or (rarely) a power-up
  if (open.length) {
    const lane = pick(open);
    const roll = rng();
    if (roll < 0.018) {
      game.pickups.push(makePickup(lane, "shield"));
    } else if (roll < 0.032) {
      game.pickups.push(makePickup(lane, "magnet"));
    } else if (roll < 0.05) {
      game.pickups.push(makePickup(lane, "boost"));
    } else {
      const chain = rng() < 0.5 ? randInt(2, 4) : 1;
      for (let i = 0; i < chain; i += 1) {
        game.pickups.push({ kind: "coin", lane, depth: SPAWN_DEPTH + 1 + i * 0.85, spin: rand(0, Math.PI * 2), dead: false });
      }
    }
  }
}
function makePickup(lane, kind) {
  return { kind, lane, depth: SPAWN_DEPTH + 1, spin: rand(0, Math.PI * 2), dead: false };
}

/* ==========================================================================
   UPDATE
   ========================================================================== */
function update(dtRaw) {
  // slow-mo handling
  if (game.slowmo > 0) game.slowmo = Math.max(0, game.slowmo - dtRaw);
  const dt = dtRaw * (game.slowmo > 0 ? 0.35 : 1);

  game.time += dt;
  game.scroll += game.speed * dt;
  game.distance += game.speed * dt * 1.25;
  game.speed += dt * game.difficulty.ramp;
  game.score += Math.floor(game.speed * dt * 3);
  game.currentLane = lerp(game.currentLane, game.targetLane, 1 - Math.exp(-13 * dt));

  // timers
  if (game.invuln > 0) game.invuln = Math.max(0, game.invuln - dt);
  if (game.magnet > 0) game.magnet = Math.max(0, game.magnet - dt);
  if (game.boost > 0) game.boost = Math.max(0, game.boost - dt);
  // combo timer holds steady while you're actively typing a reply — you're busy,
  // not idle — and only drains during free driving.
  if (game.comboTimer > 0 && !game.awaiting) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) breakCombo();
  }

  // send timer (Normal/Mayhem): must finish the reply before it runs out
  if (game.timedReply && game.awaiting) {
    game.replyTimer -= dt;
    if (game.replyTimer <= 0) { game.replyTimer = 0; replyTimeout(); }
  }
  updateSendTimerUI();

  // run records
  const mph = mphOf(game.speed);
  if (mph > game.run.topMph) game.run.topMph = mph;

  // spawn
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    spawnWave();
    const interval = Math.max(0.52, game.difficulty.spawnBase - (game.speed - game.baseSpeed) * 0.006);
    game.spawnTimer += interval * rand(0.88, 1.12);
  }

  const closing = game.speed * DEPTH_PER_SPEED * dt;

  // move traffic + collisions / near-miss
  for (const car of game.traffic) {
    car.depth -= closing;
    if (!car.passed && car.depth <= PLAYER_DEPTH) {
      car.passed = true;
      const laneDist = Math.abs(game.currentLane - car.lane);
      if (laneDist < COLLIDE_LANE) {
        if (game.invuln > 0) { /* phasing through */ }
        else if (game.shield) {
          game.shield = false; game.invuln = 1.3;
          audio.shieldBreak(); flash(0.6); addShake(14);
          const p = project(PLAYER_DEPTH, car.lane);
          spawnParticles(p.x, p.y, ["#8de1ff", "#ffffff", "#3a86ff"], 26, 3.4);
          banner("SHIELD DOWN", "Lucky.", "shield");
        } else {
          return crash(car);
        }
      } else if (laneDist < NEARMISS_LANE) {
        onNearMiss(car);
      }
    }
  }

  // move pickups
  for (const p of game.pickups) {
    p.depth -= closing;
    const magnetActive = game.magnet > 0 && p.kind === "coin";
    if (!p.dead) {
      const reach = magnetActive ? 6 : (p.kind === "coin" ? 0.6 : 0.7);
      if (p.depth <= PLAYER_DEPTH + (magnetActive ? 3 : 0.3) && Math.abs(game.currentLane - p.lane) < reach) {
        collectPickup(p);
      }
    }
  }

  game.traffic = game.traffic.filter((c) => c.depth > -2);
  game.pickups = game.pickups.filter((p) => p.depth > -2 && !p.dead);

  // particles
  for (const pt of game.particles) {
    pt.life -= dt;
    pt.x += pt.vx * 120 * dt;
    pt.y += pt.vy * 120 * dt;
    pt.vy += pt.grav * dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);

  game.shake = Math.max(0, game.shake - dt * 26);
  game.flashT = Math.max(0, game.flashT - dt * 2.2);
  audio.updateEngine(game.speed, true);
  updateHud();
}

function onNearMiss(car) {
  game.run.nearMisses += 1;
  addCombo(1);
  const gained = addScore(120);
  audio.nearMiss();
  const p = project(PLAYER_DEPTH, car.lane);
  popup(`NEAR MISS +${gained}`, p.x, p.y - p.laneUnit, "near");
  spawnParticles(p.x, p.y, ["#ffffff", "#ffd23f"], 8, 2.2);
}

function collectPickup(p) {
  p.dead = true;
  const proj = project(Math.max(p.depth, 0), p.lane);
  if (p.kind === "coin") {
    game.coins += 1;
    profile.stats.totalCoins += 1;
    addCombo(1);
    const gained = addScore(25);
    audio.coin();
    popup(`+${gained}`, proj.x, proj.y - proj.laneUnit, "coin");
    spawnParticles(proj.x, proj.y, ["#ffe680", "#ffd23f", "#fff7cc"], 8, 2.2);
  } else {
    audio.powerup();
    flash(0.32);
    spawnParticles(proj.x, proj.y, ["#ffffff", "#8de1ff"], 16, 2.6);
    if (p.kind === "shield") { game.shield = true; banner("SHIELD UP", "Survive one hit", "shield"); }
    if (p.kind === "magnet") { game.magnet = 7; banner("COIN MAGNET", "7 seconds", "magnet"); }
    if (p.kind === "boost") { game.boost = 7; banner("x2 SCORE", "7 seconds", "boost"); }
  }
}

/* ==========================================================================
   RENDER
   ========================================================================== */
const CLOUDS = Array.from({ length: 6 }, (_, i) => ({
  x: (i / 6), y: 0.08 + (i % 3) * 0.05, s: 0.7 + (i % 4) * 0.18, spd: 0.004 + (i % 3) * 0.002,
}));
const HILLS = Array.from({ length: 7 }, (_, i) => ({ x: i / 6, r: 0.10 + (i % 3) * 0.04 }));

function drawBackground() {
  const w = game.width, h = game.height, horizonY = h * HORIZON_RATIO;
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, "#4cc9f0");
  sky.addColorStop(1, "#a8e6ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizonY + 2);
  // sun
  const sunX = w * 0.8, sunY = horizonY * 0.42, sunR = Math.min(w, h) * 0.07;
  ctx.fillStyle = "#fff3b0";
  ctx.strokeStyle = "#1b1b2b";
  ctx.lineWidth = Math.max(2, sunR * 0.08);
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // hills
  ctx.fillStyle = "#7bdff2";
  for (const hl of HILLS) {
    const hx = ((hl.x - game.scroll * 0.0009) % 1.2 + 1.2) % 1.2 * w - w * 0.1;
    const hr = hl.r * w;
    ctx.beginPath(); ctx.arc(hx, horizonY, hr, Math.PI, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#57cc99";
  for (let i = 0; i < HILLS.length; i += 1) {
    const hx = ((i / 5 - game.scroll * 0.0014) % 1.3 + 1.3) % 1.3 * w - w * 0.15;
    const hr = (0.13 + (i % 2) * 0.05) * w;
    ctx.beginPath(); ctx.arc(hx, horizonY + 4, hr, Math.PI, Math.PI * 2); ctx.fill();
  }
  // clouds
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(27,27,43,0.18)";
  ctx.lineWidth = 2;
  for (const c of CLOUDS) {
    const cx = ((c.x - game.scroll * c.spd * 0.02) % 1.2 + 1.2) % 1.2 * w - w * 0.1;
    const cy = c.y * h;
    const s = c.s * w * 0.04;
    cloud(cx, cy, s);
  }
  // grass (below horizon)
  const grass = ctx.createLinearGradient(0, horizonY, 0, h);
  grass.addColorStop(0, "#52b788");
  grass.addColorStop(1, "#2d6a4f");
  ctx.fillStyle = grass;
  ctx.fillRect(0, horizonY, w, h - horizonY);
}
// Clean cartoon cloud: a dark silhouette drawn slightly larger, then white
// blobs on top — gives one crisp outer outline with no internal seams.
function cloud(x, y, s) {
  const parts = [[0, 0, s], [s, s * 0.18, s * 0.78], [-s, s * 0.18, s * 0.72], [s * 0.45, -s * 0.42, s * 0.64], [-s * 0.55, -s * 0.18, s * 0.54]];
  const ow = Math.max(2.5, s * 0.16);
  ctx.fillStyle = "#1b1b2b";
  for (const [dx, dy, r] of parts) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r + ow, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#ffffff";
  for (const [dx, dy, r] of parts) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill(); }
}

function roadEdgeX(depth, side) {
  const p = project(depth, CENTER_LANE);
  return p.x + side * HALF_LANES * p.laneUnit;
}
function drawRoad() {
  const w = game.width, h = game.height;
  const nearL = roadEdgeX(0, -1), nearR = roadEdgeX(0, 1);
  const farL = roadEdgeX(ROAD_FAR, -1), farR = roadEdgeX(ROAD_FAR, 1);
  const farY = project(ROAD_FAR, CENTER_LANE).y;
  const nearY = h;

  // shoulder (slightly wider dark band)
  ctx.fillStyle = "#1b1b2b";
  ctx.beginPath();
  const sh = (depth, side) => roadEdgeX(depth, side) + side * project(depth, CENTER_LANE).laneUnit * 0.28;
  ctx.moveTo(sh(ROAD_FAR, -1), farY); ctx.lineTo(sh(ROAD_FAR, 1), farY);
  ctx.lineTo(sh(0, 1), nearY); ctx.lineTo(sh(0, -1), nearY); ctx.closePath(); ctx.fill();

  // asphalt
  const asph = ctx.createLinearGradient(0, farY, 0, h);
  asph.addColorStop(0, "#41414e");
  asph.addColorStop(1, "#2a2a33");
  ctx.fillStyle = asph;
  ctx.beginPath();
  ctx.moveTo(farL, farY); ctx.lineTo(farR, farY); ctx.lineTo(nearR, nearY); ctx.lineTo(nearL, nearY);
  ctx.closePath(); ctx.fill();

  // edge lines (bright, solid)
  drawEdgeLine(-1, "#ffd23f");
  drawEdgeLine(1, "#ffd23f");

  // dashed lane dividers (only the 4 interior dividers, never the road edges)
  for (let div = 0.5; div < LANE_COUNT - 1; div += 1) drawLaneDashes(div);
}
function drawEdgeLine(side, color) {
  const h = game.height;
  const farY = project(ROAD_FAR, CENTER_LANE).y;
  const fp = project(ROAD_FAR, CENTER_LANE), np = project(0, CENTER_LANE);
  const farX = fp.x + side * HALF_LANES * fp.laneUnit;
  const nearX = np.x + side * HALF_LANES * np.laneUnit;
  const farIn = fp.x + side * (HALF_LANES * fp.laneUnit - fp.laneUnit * 0.12);
  const nearIn = np.x + side * (HALF_LANES * np.laneUnit - np.laneUnit * 0.12);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(farX, farY); ctx.lineTo(farIn, farY); ctx.lineTo(nearIn, h); ctx.lineTo(nearX, h);
  ctx.closePath(); ctx.fill();
}
function drawLaneDashes(lane) {
  const DASH = 0.85, GAP = 1.7;
  const phase = ((game.scroll * 0.5) % GAP);
  ctx.fillStyle = "#f4f4f8";
  for (let i = 0; i < 24; i += 1) {
    const nearD = i * GAP - phase;
    if (nearD < 0 || nearD > ROAD_FAR) continue;
    const farD = nearD + DASH;
    const a = project(nearD, lane), b = project(farD, lane);
    const wN = Math.max(1, a.laneUnit * 0.06), wF = Math.max(0.5, b.laneUnit * 0.06);
    ctx.beginPath();
    ctx.moveTo(a.x - wN, a.y); ctx.lineTo(a.x + wN, a.y);
    ctx.lineTo(b.x + wF, b.y); ctx.lineTo(b.x - wF, b.y);
    ctx.closePath(); ctx.fill();
  }
}

/* --- Cartoon car (chunky 3/4 view down the road) -------------------------- */
// Drawn as a rounded trapezoid: wider at the near end (bottom), narrower at the
// far end (top), so it reads as a real car seen from behind/ahead at the road's
// angle. The near vertical end-face is shaded darker; the top surface (roof/
// hood) catches light. facing "rear" = player (taillights); "front" = oncoming.
function drawCar(x, y, laneUnit, pal, facing, t, opts = {}) {
  const W = laneUnit * 0.8;
  if (W < 4) return;
  const H = W * 1.5;
  const lw = Math.max(2, W * 0.07);
  const rot = opts.rot || 0;
  const topW = W * 0.66;                       // far end narrower (perspective)
  const nearY = H * 0.5, farY = -H * 0.5;
  const faceY = H * 0.18;                       // end-face spans faceY..nearY
  const r = W * 0.16;
  const widthAt = (yy) => lerp(W, topW, (nearY - yy) / (nearY - farY));
  const ink = "#1b1b2b";

  ctx.save();
  ctx.translate(x, y);
  // ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.ellipse(0, nearY - H * 0.02, W * 0.6, H * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  if (rot) ctx.rotate(rot);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.lineWidth = lw; ctx.strokeStyle = ink;

  // wheels first, so they poke out behind the body
  const wheel = (cx, cy, ww, hh) => {
    ctx.fillStyle = "#17171f";
    roundRect(ctx, cx - ww / 2, cy - hh / 2, ww, hh, Math.min(ww, hh) * 0.4);
    ctx.fill(); ctx.stroke();
  };
  const rwW = W * 0.17, rwH = H * 0.2;
  wheel(-W * 0.5, nearY - rwH * 0.6, rwW, rwH);
  wheel(W * 0.5, nearY - rwH * 0.6, rwW, rwH);
  const fwW = rwW * 0.82, fwH = rwH * 0.82;
  const fwX = widthAt(farY + H * 0.28) / 2;
  wheel(-fwX, farY + H * 0.3, fwW, fwH);
  wheel(fwX, farY + H * 0.3, fwW, fwH);

  // body silhouette (rounded trapezoid)
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-W / 2 + r, nearY);
    ctx.lineTo(W / 2 - r, nearY);
    ctx.quadraticCurveTo(W / 2, nearY, W / 2, nearY - r);
    ctx.lineTo(topW / 2, farY + r);
    ctx.quadraticCurveTo(topW / 2, farY, topW / 2 - r * 0.7, farY);
    ctx.lineTo(-topW / 2 + r * 0.7, farY);
    ctx.quadraticCurveTo(-topW / 2, farY, -topW / 2, farY + r);
    ctx.lineTo(-W / 2, nearY - r);
    ctx.quadraticCurveTo(-W / 2, nearY, -W / 2 + r, nearY);
    ctx.closePath();
  };
  body();
  ctx.fillStyle = pal.body;
  ctx.fill(); ctx.stroke();

  // shade the near vertical end-face; gloss the top surface
  ctx.save();
  body(); ctx.clip();
  ctx.fillStyle = pal.shade;
  ctx.fillRect(-W / 2, faceY, W, nearY - faceY);
  const gloss = ctx.createLinearGradient(0, farY, 0, faceY);
  gloss.addColorStop(0, "rgba(255,255,255,0.26)");
  gloss.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = gloss;
  ctx.fillRect(-W / 2, farY, W, faceY - farY);
  ctx.restore();

  // edge where the end-face meets the top surface
  const fW = widthAt(faceY);
  ctx.beginPath(); ctx.moveTo(-fW / 2, faceY); ctx.lineTo(fW / 2, faceY); ctx.stroke();

  // cabin glass
  const gBotY = faceY - H * 0.03, gTopY = farY + H * 0.32;
  const gbW = widthAt(gBotY) * 0.78, gtW = widthAt(gTopY) * 0.74;
  ctx.fillStyle = facing === "front" ? "#bfe6ff" : "#21384f";
  ctx.beginPath();
  ctx.moveTo(-gbW / 2, gBotY); ctx.lineTo(gbW / 2, gBotY);
  ctx.lineTo(gtW / 2, gTopY); ctx.lineTo(-gtW / 2, gTopY);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // roof accent strip (uses the car's roof colour)
  const rTopY = farY + H * 0.03, rBotY = gTopY;
  const rtW = widthAt(rTopY) * 0.68, rbW = widthAt(rBotY) * 0.72;
  ctx.fillStyle = pal.roof;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-rbW / 2, rBotY); ctx.lineTo(rbW / 2, rBotY);
  ctx.lineTo(rtW / 2, rTopY); ctx.lineTo(-rtW / 2, rTopY);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  // lights + details on the end-face
  const faceH = nearY - faceY;
  const lY = nearY - faceH * 0.46, lH = faceH * 0.34, lW = W * 0.2;
  if (facing === "front") {
    ctx.fillStyle = "#fff3b0";
    roundRect(ctx, -W * 0.42, lY - lH / 2, lW, lH, lH * 0.3); ctx.fill(); ctx.stroke();
    roundRect(ctx, W * 0.42 - lW, lY - lH / 2, lW, lH, lH * 0.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#10141d";
    roundRect(ctx, -W * 0.17, lY - lH * 0.28, W * 0.34, lH * 0.56, lH * 0.2); ctx.fill();
  } else {
    ctx.fillStyle = "#ff4d5e";
    roundRect(ctx, -W * 0.44, lY - lH / 2, lW, lH, lH * 0.3); ctx.fill(); ctx.stroke();
    roundRect(ctx, W * 0.44 - lW, lY - lH / 2, lW, lH, lH * 0.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f4f4ea";
    roundRect(ctx, -W * 0.13, nearY - faceH * 0.36, W * 0.26, faceH * 0.22, 2); ctx.fill(); ctx.stroke();
  }

  ctx.restore();
}

function drawCoin(x, y, laneUnit, spin) {
  const r = laneUnit * 0.30;
  if (r < 2) return;
  const squash = Math.abs(Math.sin(game.time * 6 + spin)) * 0.85 + 0.15;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.ellipse(0, r * 1.2, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.strokeStyle = "#1b1b2b";
  ctx.fillStyle = "#ffd23f";
  ctx.beginPath(); ctx.ellipse(0, 0, r * squash, r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (squash > 0.4) {
    ctx.fillStyle = "#b8860b";
    ctx.font = `bold ${Math.round(r * 1.1)}px Fredoka, Arial, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("T", 0, r * 0.06);
  }
  ctx.restore();
}

function drawPowerup(x, y, laneUnit, kind, spin) {
  const r = laneUnit * 0.36;
  if (r < 3) return;
  const bob = Math.sin(game.time * 4 + spin) * r * 0.18;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.ellipse(0, r * 1.5 - bob, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.strokeStyle = "#1b1b2b";
  const colors = { shield: "#8de1ff", magnet: "#c774e8", boost: "#ffd23f" };
  ctx.fillStyle = colors[kind] || "#fff";
  roundRect(ctx, -r, -r, r * 2, r * 2, r * 0.5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#16263b";
  ctx.font = `bold ${Math.round(r * 1.2)}px Fredoka, Arial, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(kind === "shield" ? "🛡" : kind === "magnet" ? "🧲" : "✦", 0, r * 0.08);
  ctx.restore();
}

function drawPlayer() {
  const proj = project(PLAYER_DEPTH, game.currentLane);
  const steer = game.currentLane - game.targetLane;
  const bob = Math.sin(game.time * 10) * proj.laneUnit * 0.012;
  // small steering bank only while actively changing lanes (brief, reads as juice)
  const rot = clamp(steer * 0.08, -0.1, 0.1);
  const car = CARS.find((c) => c.id === profile.selectedCar) || CARS[0];
  let pal = { body: car.body, shade: car.shade, roof: car.roof };
  if (car.rainbow) {
    const hue = (game.time * 90) % 360;
    pal = { body: `hsl(${hue},90%,60%)`, shade: `hsl(${hue},90%,42%)`, roof: `hsl(${hue},90%,82%)` };
  }
  // exhaust flames at high speed / boost
  const flame = clamp((game.speed - 46) / 24, 0, 1) + (game.boost > 0 ? 0.6 : 0);
  if (game.state === "playing" && flame > 0.15) {
    ctx.save();
    ctx.translate(proj.x, proj.y + proj.laneUnit * 0.7);
    ctx.globalCompositeOperation = "lighter";
    const fl = proj.laneUnit * (0.3 + flame * 0.5) * (0.8 + Math.random() * 0.4);
    const fg = ctx.createLinearGradient(0, 0, 0, fl);
    fg.addColorStop(0, "rgba(255,220,120,0.9)");
    fg.addColorStop(1, "rgba(255,90,60,0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-proj.laneUnit * 0.18, 0); ctx.lineTo(0, fl); ctx.lineTo(proj.laneUnit * 0.18, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.save();
  // invulnerability blink
  if (game.invuln > 0 && Math.floor(game.time * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  drawCar(proj.x, proj.y + bob, proj.laneUnit * 1.05, pal, "rear", game.time, { rot });
  // shield bubble
  if (game.shield) {
    ctx.globalAlpha = 0.5 + Math.sin(game.time * 6) * 0.15;
    ctx.strokeStyle = "#8de1ff";
    ctx.lineWidth = Math.max(2, proj.laneUnit * 0.06);
    ctx.beginPath(); ctx.ellipse(proj.x, proj.y, proj.laneUnit * 0.7, proj.laneUnit * 0.95, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawObjects() {
  const items = [];
  for (const car of game.traffic) {
    if (car.depth > ROAD_FAR || car.depth < -2) continue;
    items.push({ depth: car.depth, kind: "car", ref: car });
  }
  for (const p of game.pickups) {
    if (p.dead || p.depth > ROAD_FAR || p.depth < -2) continue;
    items.push({ depth: p.depth, kind: p.kind, ref: p });
  }
  items.sort((a, b) => b.depth - a.depth); // far first
  for (const it of items) {
    const o = it.ref;
    const proj = project(o.depth, o.lane);
    if (it.kind === "car") {
      const bob = Math.sin(game.time * 7 + o.bob) * proj.laneUnit * 0.02;
      drawCar(proj.x, proj.y + bob, proj.laneUnit, o.pal, "front", game.time);
    } else if (it.kind === "coin") {
      drawCoin(proj.x, proj.y - proj.laneUnit * 0.5, proj.laneUnit, o.spin);
    } else {
      drawPowerup(proj.x, proj.y - proj.laneUnit * 0.6, proj.laneUnit, it.kind, o.spin);
    }
  }
}

function drawParticles() {
  for (const p of game.particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * clamp(p.life / p.max, 0.2, 1), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSpeedLines() {
  if (game.state !== "playing") return;
  const intensity = clamp((game.speed - 40) / 30, 0, 1);
  if (intensity <= 0.02) return;
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${0.05 + intensity * 0.14})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i += 1) {
    const x = Math.random() * game.width;
    const y = game.height * 0.32 + Math.random() * game.height * 0.6;
    const len = (10 + Math.random() * 26) * intensity;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
  }
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, game.width, game.height);
  const sx = game.shake > 0 ? (Math.random() * 2 - 1) * game.shake : 0;
  const sy = game.shake > 0 ? (Math.random() * 2 - 1) * game.shake * 0.5 : 0;
  ctx.save();
  ctx.translate(sx, sy);
  drawBackground();
  drawRoad();
  drawObjects();
  drawSpeedLines();
  drawPlayer();
  drawParticles();
  ctx.restore();
  // white flash
  if (game.flashT > 0) {
    ctx.fillStyle = `rgba(255,255,255,${game.flashT})`;
    ctx.fillRect(0, 0, game.width, game.height);
  }
}

/* ==========================================================================
   GAME LIFECYCLE
   ========================================================================== */
function startGame() {
  clearTasks();
  el.fxLayer.innerHTML = "";
  el.bannerLayer.innerHTML = "";
  hideAllScreens();

  game.difficulty = DIFFICULTIES[profile.difficulty] || DIFFICULTIES.normal;
  game.baseSpeed = game.difficulty.startSpeed;
  rng = game.daily ? mulberry32(dailySeed()) : Math.random;

  game.state = "playing";
  game.time = 0; game.scroll = 0;
  game.speed = game.baseSpeed;
  game.score = 0; game.distance = 0; game.coins = 0; game.texts = 0;
  game.currentLane = CENTER_LANE; game.targetLane = CENTER_LANE; game.safeLane = CENTER_LANE;
  game.traffic = []; game.pickups = []; game.particles = [];
  game.spawnTimer = 1.0;
  game.combo = 0; game.mult = 1; game.comboTimer = 0;
  game.shield = false; game.invuln = 0; game.magnet = 0; game.boost = 0;
  game.shake = 0; game.slowmo = 0; game.flashT = 0;
  game.charsTyped = 0; game.typingMs = 0; game.correctChars = 0; game.expectedChars = 0;
  game.run = { nearMisses: 0, bestMult: 0, topMph: 0, perfectTexts: 0 };

  game.threadOrder = shuffle(CONVERSATIONS.map((_, i) => i));
  game.threadIndex = 0;

  game.timedReply = false; game.replyTimer = 0; game.replyTimerMax = 0;
  stopSendTimer();
  el.dock.classList.add("active");
  el.dock.classList.remove("composing", "review", "perfect", "error", "ready");
  updateHud();
  beginThread(0);
}

function pauseGame() {
  if (game.state !== "playing") return;
  game.state = "paused";
  el.typeInput.disabled = true;
  hideAllScreens();
  el.screenPause.classList.add("show");
  audio.updateEngine(10, false);
}
function resumeGame() {
  if (game.state !== "paused") return;
  game.state = "playing";
  hideAllScreens();
  if (game.awaiting) { el.typeInput.disabled = false; focusInput(); }
}

function crash(car) {
  game.state = "gameover";
  game.awaiting = false;
  stopSendTimer();
  clearTasks();
  el.typeInput.disabled = true;
  el.dock.classList.remove("active", "composing");
  audio.crash();
  addShake(26); flash(0.7);
  const p = project(Math.max(car.depth, 0), car.lane);
  spawnParticles(p.x, p.y, ["#ff5566", "#ffd23f", "#ffffff", "#8de1ff"], 46, 4.2);

  finalizeRun();
  schedule(showGameOver, 780);
}

function finalizeRun() {
  // persist coins + stats
  profile.coins += game.coins;
  const s = profile.stats;
  s.runs += 1;
  if (game.run.topMph > s.topMph) s.topMph = game.run.topMph;
  if (game.run.bestMult > s.bestMult) s.bestMult = game.run.bestMult;
  if (game.distance > s.bestDistance) s.bestDistance = game.distance;
  const today = todayStr();
  if (s.lastDay !== today) { s.daysPlayed += 1; s.lastDay = today; }

  const isBest = game.score > profile.best;
  if (isBest) profile.best = game.score;
  game._newBest = isBest;

  if (game.daily) {
    if (game.daily && profile.daily.date !== today) { profile.daily.date = today; profile.daily.best = 0; }
    if (game.score > profile.daily.best) profile.daily.best = game.score;
  }

  profile.leaderboard.push({ score: game.score, mode: game.difficulty.name, daily: game.daily, ts: Date.now() });
  profile.leaderboard.sort((a, b) => b.score - a.score);
  profile.leaderboard = profile.leaderboard.slice(0, 20);

  // achievements
  const ctxData = {
    stats: { ...s, carsOwned: profile.ownedCars.length },
    run: { ...game.run, score: game.score, distance: game.distance, perfectTexts: game.run.perfectTexts },
  };
  game._newAch = [];
  for (const a of ACHIEVEMENTS) {
    if (!profile.achievements.includes(a.id) && a.check(ctxData)) {
      profile.achievements.push(a.id);
      game._newAch.push(a);
    }
  }
  saveProfile();
}

function showGameOver() {
  hideAllScreens();
  el.screenOver.classList.add("show");
  const avgWpm = game.typingMs > 0 ? Math.round((game.charsTyped / 5) / (game.typingMs / 60000)) : 0;
  const acc = game.expectedChars > 0 ? Math.round((game.correctChars / game.expectedChars) * 100) : 0;
  el.overTitle.textContent = game._newBest ? "NEW BEST!" : "WRECKED";
  el.overScore.textContent = game.score.toLocaleString();
  el.overNewBest.style.display = game._newBest ? "inline-flex" : "none";
  el.overCoinsEarned.textContent = game.coins.toLocaleString();
  el.overTexts.textContent = game.texts;
  el.overNear.textContent = game.run.nearMisses;
  el.overCombo.textContent = "x" + game.run.bestMult.toFixed(1);
  el.overAcc.textContent = game.expectedChars ? acc + "%" : "—";
  el.overWpm.textContent = avgWpm > 0 ? avgWpm : "—";
  el.overDist.textContent = Math.round(game.distance) + " m";
  if (game._newAch && game._newAch.length) {
    el.overUnlocks.innerHTML = `<div class="unlock-title">Unlocked</div>` +
      game._newAch.map((a) => `<div class="unlock">🏆 ${a.name}</div>`).join("");
    el.overUnlocks.style.display = "block";
    audio.achievement();
  } else {
    el.overUnlocks.style.display = "none";
  }
}

/* ==========================================================================
   INPUT
   ========================================================================== */
function moveLane(dir) {
  if (game.state !== "playing") return;
  const next = clamp(game.targetLane + dir, 0, LANE_COUNT - 1);
  if (next === game.targetLane) return;
  game.targetLane = next;
  audio.laneShift();
  updateHud();
}

window.addEventListener("keydown", (e) => {
  const k = e.key;
  const playing = game.state === "playing";
  // Only the arrow keys steer — letter keys are reserved for typing replies.
  if (k === "ArrowLeft") { if (playing) { e.preventDefault(); moveLane(-1); } return; }
  if (k === "ArrowRight") { if (playing) { e.preventDefault(); moveLane(1); } return; }

  if (k === "Enter") {
    if (game.awaiting) { e.preventDefault(); submitReply(); }
    else if (game.state === "gameover") { e.preventDefault(); audio.arm(); startGame(); }
    return;
  }
  // Escape always pauses; 'p' only when not composing (it's a typeable letter).
  if (k === "Escape" || (!game.awaiting && (k === "p" || k === "P"))) {
    if (playing) { e.preventDefault(); pauseGame(); }
    else if (game.state === "paused") { e.preventDefault(); resumeGame(); }
    return;
  }
  if ((k === "r" || k === "R") && game.state === "gameover" && !game.awaiting) {
    e.preventDefault(); audio.arm(); startGame(); return;
  }
  // refocus the typing field if a character key is pressed mid-reply
  if (game.awaiting && k.length === 1 && document.activeElement !== el.typeInput) focusInput();
});

el.typeInput.addEventListener("input", onType);
el.typeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); submitReply(); }
});

// steer buttons (touch) — don't steal focus from the typing field
function bindSteer(node, dir) {
  node.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    moveLane(dir);
    if (game.awaiting) focusInput();
  });
}
bindSteer(el.steerLeft, -1);
bindSteer(el.steerRight, 1);

// tap the left / right third of the play field to steer; center keeps the
// typing field focused (works on mobile even while the keyboard is up)
canvas.addEventListener("pointerdown", (e) => {
  if (game.state !== "playing") return;
  const x = e.clientX / game.width;
  if (x < 0.33) moveLane(-1);
  else if (x > 0.67) moveLane(1);
  if (game.awaiting) focusInput();
});

// Horizontal trackpad swipe (two-finger swipe / horizontal scroll) changes lanes
// so laptop players can steer without the A/D keys they need for typing.
// Hysteresis keeps it to exactly one lane per swipe while still letting the next
// swipe register: we fire once when a swipe passes the HIGH threshold, then
// re-arm only after that swipe's momentum settles below LOW (same direction) or
// a strong swipe arrives in the opposite direction. Mac momentum scrolling
// fires for ~1s after a flick, so a simple time-gap reset never opens — this
// magnitude-based reset does. deltaX is inverted for Mac natural scrolling.
const SWIPE_HIGH = 6, SWIPE_LOW = 2.5;
let swipeArmed = true, swipeSign = 0;
window.addEventListener("wheel", (e) => {
  if (game.state !== "playing") return;
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // ignore vertical scroll
  e.preventDefault();
  const ad = Math.abs(e.deltaX), s = e.deltaX < 0 ? -1 : 1;
  if (s === swipeSign && ad <= SWIPE_LOW) swipeArmed = true;      // our swipe settled
  else if (s !== swipeSign && ad >= SWIPE_HIGH) swipeArmed = true; // strong reverse = new
  if (swipeArmed && ad >= SWIPE_HIGH) {
    moveLane(s < 0 ? 1 : -1);
    swipeArmed = false; swipeSign = s;
  }
}, { passive: false });

/* --- Buttons -------------------------------------------------------------- */
function wire(node, fn) { if (node) node.addEventListener("click", fn); }
wire(el.btnPlay, async () => { audio.uiClick(); await audio.arm(); startGame(); });
wire(el.btnGarage, () => { audio.uiClick(); showGarage(); });
wire(el.btnTrophies, () => { audio.uiClick(); showTrophies(); });
wire(el.btnDaily, () => { audio.uiClick(); game.daily = !game.daily; syncDailyLabel(); });
wire(el.btnGarageBack, () => { audio.uiBack(); showStart(); });
wire(el.btnTrophiesBack, () => { audio.uiBack(); showStart(); });
wire(el.btnResume, () => { audio.uiClick(); resumeGame(); });
wire(el.btnRestartPause, async () => { audio.uiClick(); await audio.arm(); startGame(); });
wire(el.btnMenuPause, () => { audio.uiBack(); game.state = "menu"; clearTasks(); showStart(); });
wire(el.btnRetry, async () => { audio.uiClick(); await audio.arm(); startGame(); });
wire(el.btnGarageOver, () => { audio.uiClick(); showGarage(); });
wire(el.btnMenuOver, () => { audio.uiBack(); showStart(); });
wire(el.btnPause, () => { audio.uiClick(); if (game.state === "playing") pauseGame(); else if (game.state === "paused") resumeGame(); });
wire(el.btnMute, () => {
  profile.muted = !profile.muted; audio.setMuted(profile.muted); saveProfile();
  el.btnMute.textContent = profile.muted ? "🔇" : "🔊";
  el.btnMute.classList.toggle("muted", profile.muted);
});
document.querySelectorAll("[data-mode]").forEach((b) => {
  b.addEventListener("click", () => {
    profile.difficulty = b.dataset.mode; game.difficulty = DIFFICULTIES[b.dataset.mode]; saveProfile();
    audio.uiClick(); syncDifficultyButtons();
  });
});

/* --- Resize / loop -------------------------------------------------------- */
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  game.width = window.innerWidth;
  game.height = window.innerHeight;
  canvas.width = Math.round(game.width * dpr);
  canvas.height = Math.round(game.height * dpr);
  canvas.style.width = game.width + "px";
  canvas.style.height = game.height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
window.addEventListener("focus", () => { if (game.awaiting) focusInput(); });

// auto-pause when the tab is hidden so you don't return mid-crash
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "playing") pauseGame();
});

// lift the typing dock above the on-screen keyboard on mobile
if (window.visualViewport) {
  const vv = window.visualViewport;
  const onVV = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    el.dock.style.bottom = kb > 90 ? kb + 10 + "px" : "";
  };
  vv.addEventListener("resize", onVV);
  vv.addEventListener("scroll", onVV);
}

function frame(ts) {
  if (!game.lastFrame) game.lastFrame = ts;
  const dt = Math.min((ts - game.lastFrame) / 1000, 0.033);
  game.lastFrame = ts;
  if (game.state === "playing") update(dt);
  else { audio.updateEngine(game.state === "paused" ? 10 : 16, false); }
  render();
  window.requestAnimationFrame(frame);
}

/* --- Boot ----------------------------------------------------------------- */
el.btnMute.textContent = profile.muted ? "🔇" : "🔊";
el.btnMute.classList.toggle("muted", profile.muted);
resize();
showStart();
updateHud();
window.requestAnimationFrame(frame);
