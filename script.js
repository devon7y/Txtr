const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreValue = document.getElementById("scoreValue");
const coinValue = document.getElementById("coinValue");
const textValue = document.getElementById("textValue");
const bestValue = document.getElementById("bestValue");
const startBestValue = document.getElementById("startBestValue");
const speedValue = document.getElementById("speedValue");
const laneValue = document.getElementById("laneValue");
const threadValue = document.getElementById("threadValue");

const incomingBubble = document.getElementById("incomingBubble");
const composer = document.getElementById("composer");
const replyInput = document.getElementById("replyInput");
const replyMirror = document.getElementById("replyMirror");
const sendButton = document.getElementById("sendButton");
const composerNote = document.getElementById("composerNote");
const wpmValue = document.getElementById("wpmValue");
const composerField = document.querySelector(".composer-field--road");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const finalScoreValue = document.getElementById("finalScoreValue");
const finalCoinValue = document.getElementById("finalCoinValue");
const finalTextValue = document.getElementById("finalTextValue");
const finalBestValue = document.getElementById("finalBestValue");
const gameOverSummary = document.getElementById("gameOverSummary");
const finalWpmValue = document.getElementById("finalWpmValue");
const finalAccuracyValue = document.getElementById("finalAccuracyValue");

const LANE_COUNT = 5;
const VIEW_DISTANCE = 120;
const PLAYER_CAR_Z = 20;
const PLAYER_COLLISION_Z = PLAYER_CAR_Z;
const PLAYER_LANE_CENTER = (LANE_COUNT - 1) / 2;
const BEST_SCORE_KEY = "txtr-best-score";
const HORIZON_RATIO = 0.22;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, t) => start + (end - start) * t;
const rand = (min, max) => min + Math.random() * (max - min);
const pick = (items) => items[Math.floor(Math.random() * items.length)];

function shuffle(items) {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}

function roundedRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawRoundedRect(context, x, y, width, height, radius, fillStyle, strokeStyle = null) {
  roundedRectPath(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
  if (strokeStyle) {
    context.strokeStyle = strokeStyle;
    context.stroke();
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapMarkupChar(char, className) {
  const safeChar = char === "" ? " " : char;
  return `<span class="${className}">${escapeHtml(safeChar)}</span>`;
}

function setComposerMirrorMarkup(markup) {
  replyMirror.innerHTML = markup;
}

function setComposerMirrorHint(text) {
  setComposerMirrorMarkup(`<span class="mirror-char--hint">${escapeHtml(text)}</span>`);
}

function buildGhostMarkup(text) {
  return text
    .split("")
    .map((char) => wrapMarkupChar(char, char === " " ? "mirror-char--ghost-space" : "mirror-char--remaining"))
    .join("");
}

function buildPartialGhostMarkup(fullText, typedText) {
  const expectedWords = tokenizeWords(fullText);
  const typedWords = typedText.split(" ");
  const currentWordIndex = typedWords.length - 1;
  const parts = [];

  for (let wi = 0; wi < expectedWords.length; wi++) {
    const expectedWord = expectedWords[wi];
    const typedWord = typedWords[wi] ?? "";
    const isCurrentWord = wi === currentWordIndex;

    for (let ci = 0; ci < expectedWord.length; ci++) {
      if (isCurrentWord && ci === typedWord.length) {
        parts.push('<span class="mirror-caret"></span>');
      }
      if (ci < typedWord.length) {
        parts.push(wrapMarkupChar(expectedWord[ci], typedWord[ci] === expectedWord[ci] ? "mirror-char--correct" : "mirror-char--incorrect"));
      } else {
        parts.push(wrapMarkupChar(expectedWord[ci], "mirror-char--remaining"));
      }
    }

    for (let ci = expectedWord.length; ci < typedWord.length; ci++) {
      parts.push(wrapMarkupChar(typedWord[ci], "mirror-char--extra"));
    }

    if (isCurrentWord && typedWord.length >= expectedWord.length) {
      parts.push('<span class="mirror-caret"></span>');
    }

    if (wi < expectedWords.length - 1) {
      parts.push(wrapMarkupChar(" ", "mirror-char--ghost-space"));
    }
  }

  return parts.join("");
}

function tokenizeWords(text) {
  return text.replaceAll("\n", " ").split(" ");
}

function analyzeWord(typedWord, targetWord) {
  const maxLength = Math.max(typedWord.length, targetWord.length);
  const chars = [];
  let mistakes = 0;
  let correct = 0;

  for (let index = 0; index < maxLength; index += 1) {
    const typedChar = typedWord[index] ?? "";
    const expectedChar = targetWord[index] ?? "";

    if (typedChar && expectedChar && typedChar === expectedChar) {
      correct += 1;
      chars.push({ char: typedChar, state: "correct" });
      continue;
    }

    mistakes += 1;
    if (typedChar && !expectedChar) {
      chars.push({ char: typedChar, state: "extra" });
    } else if (!typedChar && expectedChar) {
      chars.push({ char: expectedChar, state: "missing" });
    } else {
      chars.push({ char: typedChar, state: "incorrect" });
    }
  }

  return {
    typedWord,
    targetWord,
    chars,
    mistakes,
    correct,
    length: maxLength,
  };
}

function analyzeReply(input, target) {
  const inputWords = tokenizeWords(input);
  const targetWords = tokenizeWords(target);
  const wordCount = Math.max(inputWords.length, targetWords.length);
  let mistakes = 0;
  let correct = 0;
  let maxLength = 0;
  let exactWords = 0;
  const words = [];

  for (let index = 0; index < wordCount; index += 1) {
    const wordAnalysis = analyzeWord(inputWords[index] ?? "", targetWords[index] ?? "");
    words.push(wordAnalysis);
    mistakes += wordAnalysis.mistakes;
    correct += wordAnalysis.correct;
    maxLength += wordAnalysis.length;
    if (wordAnalysis.targetWord || wordAnalysis.typedWord) {
      if (wordAnalysis.mistakes === 0 && wordAnalysis.typedWord === wordAnalysis.targetWord) {
        exactWords += 1;
      }
    }
  }

  return {
    maxLength,
    mistakes,
    correct,
    accuracy: maxLength ? correct / maxLength : 1,
    exactWords,
    wordCount,
    words,
  };
}

function buildReviewMarkup(analysis) {
  if (!analysis.maxLength) {
    return `<span class="mirror-char--hint">No message sent.</span>`;
  }

  return analysis.words
    .map((wordAnalysis) =>
      wordAnalysis.chars.map(({ char, state }) => wrapMarkupChar(char, `mirror-char--${state}`)).join("")
    )
    .join(" ");
}

class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.engine = null;
    this.lastTypeTime = 0;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.42;
        this.master.connect(this.ctx.destination);
        this.noiseBuffer = this.createNoiseBuffer();
      }
    } catch (error) {
      this.ctx = null;
    }
  }

  async arm() {
    if (!this.ctx) {
      return;
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.ensureEngine();
  }

  ensureEngine() {
    if (!this.ctx || this.engine) {
      return;
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;

    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = "sawtooth";
    bodyOsc.frequency.value = 80;

    const whineOsc = this.ctx.createOscillator();
    whineOsc.type = "triangle";
    whineOsc.frequency.value = 150;

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.value = 0.001;

    const whineGain = this.ctx.createGain();
    whineGain.gain.value = 0.001;

    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 4.8;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 8;

    bodyOsc.connect(filter);
    filter.connect(bodyGain);
    bodyGain.connect(this.master);

    whineOsc.connect(whineGain);
    whineGain.connect(this.master);

    lfo.connect(lfoGain);
    lfoGain.connect(bodyOsc.frequency);

    bodyOsc.start();
    whineOsc.start();
    lfo.start();

    this.engine = { filter, bodyOsc, whineOsc, bodyGain, whineGain, lfo, lfoGain };
  }

  createNoiseBuffer() {
    if (!this.ctx) {
      return null;
    }

    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  updateEngine(speed, active = true) {
    if (!this.ctx) {
      return;
    }

    this.ensureEngine();
    const now = this.ctx.currentTime;
    const volume = active ? 0.022 : 0.007;

    this.engine.bodyOsc.frequency.setTargetAtTime(62 + speed * 2.7, now, 0.08);
    this.engine.whineOsc.frequency.setTargetAtTime(120 + speed * 5.4, now, 0.08);
    this.engine.bodyGain.gain.setTargetAtTime(volume, now, 0.09);
    this.engine.whineGain.gain.setTargetAtTime(volume * 0.68, now, 0.09);
    this.engine.filter.frequency.setTargetAtTime(340 + speed * 17, now, 0.12);
  }

  tone(type, startFrequency, endFrequency, duration, gainAmount, options = {}) {
    if (!this.ctx) {
      return;
    }

    const { delay = 0, attack = 0.003, release = 0.035 } = options;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, this.ctx.currentTime + delay);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(0.001, endFrequency),
      this.ctx.currentTime + delay + duration
    );
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(gainAmount, this.ctx.currentTime + delay + attack);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + delay + duration + release
    );
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(this.ctx.currentTime + delay);
    oscillator.stop(this.ctx.currentTime + delay + duration + release + 0.02);
  }

  noise(duration, gainAmount, filterType, filterFrequency) {
    if (!this.ctx || !this.noiseBuffer) {
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFrequency;
    const gain = this.ctx.createGain();
    gain.gain.value = gainAmount;
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    source.stop(this.ctx.currentTime + duration + 0.03);
  }

  laneShift() {
    this.tone("triangle", 350, 690, 0.11, 0.06);
  }

  type() {
    if (!this.ctx) {
      return;
    }

    const now = this.ctx.currentTime;
    if (now - this.lastTypeTime < 0.045) {
      return;
    }

    this.lastTypeTime = now;
    this.tone("square", rand(560, 780), rand(460, 620), 0.024, 0.02);
  }

  send() {
    this.tone("sine", 700, 920, 0.085, 0.055);
    this.tone("sine", 980, 1280, 0.1, 0.045, { delay: 0.065 });
  }

  receive() {
    this.tone("sine", 920, 720, 0.07, 0.043);
    this.tone("triangle", 660, 600, 0.09, 0.035, { delay: 0.055 });
  }

  coin() {
    this.tone("triangle", 920, 1520, 0.12, 0.05);
    this.tone("sine", 1280, 1880, 0.13, 0.032, { delay: 0.03 });
  }

  crash() {
    this.noise(0.42, 0.18, "bandpass", 620);
    this.tone("sawtooth", 160, 42, 0.45, 0.12, { release: 0.05 });
  }
}

const audio = new AudioManager();

const TRAFFIC_COLORS = [
  ["#ffd145", "#ff9d00"],
  ["#49a6ff", "#2458ff"],
  ["#b7c0c9", "#5e6d7c"],
  ["#9df06a", "#2b8f36"],
  ["#f38db6", "#b63561"],
  ["#f6f7fb", "#adb5c2"],
  ["#fd8b6d", "#c14b2a"],
];

const SKYLINE_BLOCKS = Array.from({ length: 28 }, (_, index) => ({
  offset: index / 27,
  width: 18 + ((index * 17) % 31),
  height: 26 + ((index * 29) % 64),
  yOffset: ((index * 13) % 16) - 6,
  xOffset: ((index * 19) % 18) - 9,
}));

const conversations = [
  {
    avatar: "PP",
    contact: "Dr. Penelope Park",
    role: "Therapist",
    lines: [
      { from: "other", text: "How did the honesty exercise with Casey go?" },
      {
        from: "player",
        text: "I said I needed space, so she labeled my side of the closet 'museum exhibit.'",
      },
      { from: "other", text: "That is passive aggressive, but also exceptionally organized." },
      { from: "player", text: "She even added a gift shop. It only sells tiny apology candles." },
      { from: "other", text: "Did you use an 'I feel' statement like we practiced?" },
      { from: "player", text: "Yes. I said, 'I feel attacked by artisanal lavender.'" },
      { from: "other", text: "And how did she respond?" },
      { from: "player", text: "She said, 'I feel married to a man who argues with candles.'" },
      { from: "other", text: "Progress. You are both naming feelings now." },
      { from: "player", text: "Wonderful. Our relationship has evolved into scented debate club." },
    ],
  },
  {
    avatar: "CY",
    contact: "Casey",
    role: "Wife",
    lines: [
      { from: "other", text: "Can you pick up pasta on the way home?" },
      { from: "player", text: "Yes, but only if we agree spaghetti is not a personality." },
      {
        from: "other",
        text: "You lost pantry voting rights after organizing noodles by astrological sign.",
      },
      { from: "player", text: "Capricorn rigatoni had leadership energy." },
      {
        from: "other",
        text: "Also, our sink is making the same noise you make during couples counseling.",
      },
      { from: "player", text: "A soft groan followed by dramatic silence?" },
      { from: "other", text: "Exactly. Please call the plumber before the sink asks for boundaries." },
      { from: "player", text: "Fine. But if the plumber flirts with the faucet, I'm leaving." },
      { from: "other", text: "Bring garlic bread too." },
      { from: "player", text: "Peace talks require carbs. I'm on it." },
    ],
  },
  {
    avatar: "OL",
    contact: "Olive",
    role: "Daughter",
    lines: [
      { from: "other", text: "Dad, Mr. Biscuits is missing again." },
      { from: "player", text: "Did you check the laundry basket he calls his cave of reflection?" },
      {
        from: "other",
        text: "Yes. He left one sock and a note that said 'meow,' which feels smug.",
      },
      { from: "player", text: "Classic Biscuits. How was school?" },
      { from: "other", text: "We made volcanoes. Mine erupted early and took out Trevor's diorama farm." },
      { from: "player", text: "That's science. Trevor now owns extremely fertile land." },
      { from: "other", text: "Mom said if I find the cat I can name the new class plant." },
      { from: "player", text: "Name it Detective Leaf. It sounds employable." },
      { from: "other", text: "Found Mr. Biscuits. He was inside the board game closet judging us." },
      { from: "player", text: "Tell him dinner is in ten and the parole board meets at six." },
    ],
  },
  {
    avatar: "MR",
    contact: "Marco",
    role: "Best Friend",
    lines: [
      { from: "other", text: "You still doing date night tonight?" },
      { from: "player", text: "Yes. Last week I booked mini golf and accidentally chose competitive mini golf." },
      { from: "other", text: "Isn't all mini golf competitive?" },
      { from: "player", text: "Not when your wife gives a TED Talk about your putting posture." },
      { from: "other", text: "Fair. Did therapy help?" },
      {
        from: "player",
        text: "A little. I learned marriage is mostly saying, 'That's not what I meant,' with better shoes.",
      },
      { from: "other", text: "Deep. Also your bowling team needs you Thursday." },
      { from: "player", text: "Tell them I'm emotionally available but physically bad at bowling." },
      { from: "other", text: "That's the team slogan." },
      { from: "player", text: "Then print me a jersey and one emergency nacho." },
    ],
  },
  {
    avatar: "MOM",
    contact: "Mom",
    role: "Professional Worrier",
    lines: [
      { from: "other", text: "Sweetie, are you and Casey doing okay?" },
      { from: "player", text: "We are, although the dishwasher has taken sides." },
      { from: "other", text: "Appliances should never be allowed opinions." },
      { from: "player", text: "Too late. It only starts when Casey says 'please.'" },
      { from: "other", text: "I warned you that buying a smart kitchen was arrogant." },
      { from: "player", text: "The toaster called me 'buddy' in a pitying tone." },
      { from: "other", text: "I am dropping off casserole." },
      { from: "player", text: "Is it apology casserole or surveillance casserole?" },
      { from: "other", text: "Both. The noodles are shaped like concern." },
      { from: "player", text: "Fine, but no surprise prayer circle in the driveway this time." },
    ],
  },
  {
    avatar: "HOA",
    contact: "Pineview HOA",
    role: "Neighborhood Group Chat",
    lines: [
      { from: "other", text: "Reminder: decorative geese must not wear seasonal wigs." },
      { from: "player", text: "Counterpoint: my goose was expressing autumn." },
      { from: "other", text: "Autumn does not require a magenta bob." },
      { from: "player", text: "Tell that to fashion week." },
      { from: "other", text: "Separate issue, your car alarm played saxophone at 2 a.m." },
      { from: "player", text: "That was not the alarm. I was practicing conflict resolution." },
      { from: "other", text: "Please resolve it indoors." },
      { from: "player", text: "Can I keep the goose wig if I stop the midnight saxophone?" },
      { from: "other", text: "We will allow one tasteful beret." },
      { from: "player", text: "My goose accepts these terms under protest." },
    ],
  },
  {
    avatar: "GY",
    contact: "Gary",
    role: "Mechanic",
    lines: [
      { from: "other", text: "Your supercar is ready for pickup." },
      { from: "player", text: "Did you fix the squeak or just give it a motivational speech again?" },
      { from: "other", text: "Both. The squeak responded to firm leadership." },
      { from: "player", text: "Respect. Any bad news?" },
      { from: "other", text: "Only that you somehow wore out the left tires faster than the right." },
      { from: "player", text: "I have been making emotionally complex turns." },
      { from: "other", text: "Your transmission also contains two arcade tokens and a gummy bear." },
      { from: "player", text: "Those are factory morale boosters." },
      { from: "other", text: "Please stop eating in the car like a raccoon with a credit score." },
      { from: "player", text: "No promises, Gary. Greatness is sticky." },
    ],
  },
  {
    avatar: "NN",
    contact: "Nina",
    role: "Sister",
    lines: [
      { from: "other", text: "Mom says you're having 'marriage weather.'" },
      { from: "player", text: "That's rude. We are having a light drizzle with decorative thunder." },
      { from: "other", text: "So... medium bad." },
      { from: "player", text: "No, medium theatrical." },
      { from: "other", text: "Want me to watch Olive Saturday so you two can go out?" },
      { from: "player", text: "Yes, but don't teach her your card tricks again." },
      { from: "other", text: "She asked. The child craves mystery." },
      { from: "player", text: "Last time she made the principal disappear from the signup sheet." },
      { from: "other", text: "That is leadership." },
      { from: "player", text: "That is paperwork, Nina." },
    ],
  },
];

const game = {
  state: "start",
  width: 0,
  height: 0,
  time: 0,
  lastFrame: 0,
  visualScroll: 0,
  speed: 30,
  score: 0,
  distance: 0,
  coins: 0,
  texts: 0,
  best: Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10),
  currentLane: 2,
  targetLane: 2,
  safeLane: 2,
  traffic: [],
  coinsOnRoad: [],
  particles: [],
  spawnTimer: 0.75,
  threadOrder: [],
  threadIndex: 0,
  activeThread: null,
  lineIndex: 0,
  expectedReply: "",
  awaitingReply: false,
  typingStartTime: null,
  totalCharsTyped: 0,
  totalTypingMs: 0,
  totalCorrectChars: 0,
  totalExpectedChars: 0,
  timers: [],
  shake: 0,
};

function syncBestReadouts() {
  bestValue.textContent = String(game.best);
  startBestValue.textContent = String(game.best);
  finalBestValue.textContent = String(game.best);
}

function updateHud() {
  scoreValue.textContent = String(game.score);
  coinValue.textContent = String(game.coins);
  textValue.textContent = String(game.texts);
  bestValue.textContent = String(game.best);
  speedValue.textContent = `${Math.round(58 + game.speed * 1.6)} mph`;
  laneValue.textContent = `${Math.round(game.targetLane + 1)} / ${LANE_COUNT}`;
  threadValue.textContent = game.activeThread ? game.activeThread.contact : "Standing By";
}

function setTypingState(state) {
  composerField.classList.toggle("is-error", state === "error");
  composerField.classList.toggle("is-ready", state === "ready");
}

function setComposerMode(mode) {
  composerField.classList.toggle("is-idle", mode === "idle");
  composerField.classList.toggle("is-typing", mode === "typing");
  composerField.classList.toggle("is-review", mode === "review");
}

function clearScheduledTasks() {
  for (const timerId of game.timers) {
    window.clearTimeout(timerId);
  }
  game.timers.length = 0;
}

function scheduleTask(callback, delay) {
  const timerId = window.setTimeout(() => {
    game.timers = game.timers.filter((candidate) => candidate !== timerId);
    callback();
  }, delay);
  game.timers.push(timerId);
}

function resizeReplyInput() {
  replyInput.scrollLeft = replyInput.scrollWidth;
}

function resetTypingUi(note) {
  composerNote.textContent = note;
  replyInput.value = "";
  replyInput.disabled = true;
  sendButton.disabled = true;
  setComposerMirrorHint("...");
  setComposerMode("idle");
  resizeReplyInput();
  setTypingState("");
}

function getCurrentThread() {
  return conversations[game.threadOrder[game.threadIndex]];
}

function beginThread(index) {
  game.threadIndex = index % game.threadOrder.length;
  game.activeThread = getCurrentThread();
  game.lineIndex = 0;
  game.awaitingReply = false;
  game.expectedReply = "";
  incomingBubble.textContent = "Incoming message...";
  resetTypingUi("Left and right arrow keys still steer while the message field is focused.");
  updateHud();
  scheduleTask(advanceConversation, 650);
}

function advanceToNextThread() {
  if (game.state !== "playing") {
    return;
  }

  incomingBubble.textContent = "Thread archived. Loading the next life choice.";
  setComposerMirrorHint("Incoming draft...");
  scheduleTask(() => {
    beginThread((game.threadIndex + 1) % game.threadOrder.length);
  }, 1000);
}

function advanceConversation() {
  if (game.state !== "playing" || !game.activeThread) {
    return;
  }

  if (game.lineIndex >= game.activeThread.lines.length) {
    advanceToNextThread();
    return;
  }

  const line = game.activeThread.lines[game.lineIndex];
  if (line.from === "other") {
    incomingBubble.textContent = line.text;
    audio.receive();
    game.lineIndex += 1;
    resetTypingUi("Wrong or missing letters only affect their current word. Each one costs 10 points.");
    const delay = 900 + Math.min(1200, line.text.length * 18);
    scheduleTask(advanceConversation, delay);
    return;
  }

  game.awaitingReply = true;
  game.expectedReply = line.text;
  game.typingStartTime = null;
  wpmValue.textContent = "—";
  replyInput.value = "";
  replyInput.disabled = false;
  sendButton.disabled = false;
  setComposerMirrorMarkup(buildGhostMarkup(line.text));
  setComposerMode("typing");
  composerNote.textContent = `${line.text.length} characters. Press space to move to the next word.`;
  resizeReplyInput();
  setTypingState("");
  window.requestAnimationFrame(() => replyInput.focus());
}

function handleTypingProgress() {
  if (!game.awaitingReply) {
    return;
  }

  audio.type();
  const value = replyInput.value;

  if (value.length > 0 && game.typingStartTime === null) {
    game.typingStartTime = performance.now();
  }

  setComposerMirrorMarkup(buildPartialGhostMarkup(game.expectedReply, value));

  if (game.typingStartTime !== null && value.length > 0) {
    const elapsedMinutes = (performance.now() - game.typingStartTime) / 60000;
    wpmValue.textContent = String(Math.round((value.length / 5) / elapsedMinutes));
  }

  const analysis = analyzeReply(value, game.expectedReply);
  const projectedPenalty = analysis.mistakes * 10;

  composerNote.textContent = `Projected penalty if sent now: -${projectedPenalty}. ${analysis.exactWords}/${tokenizeWords(game.expectedReply).length} words currently perfect.`;
  resizeReplyInput();

  if (analysis.mistakes === 0 && value === game.expectedReply) {
    setTypingState("ready");
    return;
  }

  setTypingState(value.length > 0 && analysis.mistakes > 0 ? "error" : "");
}

function submitReply() {
  if (game.state !== "playing" || !game.awaitingReply) {
    return;
  }

  const sentReply = replyInput.value;
  const analysis = analyzeReply(sentReply, game.expectedReply);
  const penalty = analysis.mistakes * 10;
  const scoreDelta = 70 + game.expectedReply.length * 3 - penalty;

  audio.send();
  game.awaitingReply = false;
  game.lineIndex += 1;
  game.texts += 1;
  game.score += scoreDelta;
  game.totalCharsTyped += sentReply.length;
  game.totalTypingMs += game.typingStartTime ? (performance.now() - game.typingStartTime) : 0;
  game.totalCorrectChars += analysis.correct;
  game.totalExpectedChars += analysis.maxLength;
  setComposerMode("review");
  setComposerMirrorMarkup(buildReviewMarkup(analysis));
  composerNote.textContent =
    analysis.mistakes === 0
      ? `Perfect send. +${scoreDelta} points.`
      : `${analysis.exactWords}/${analysis.wordCount} words perfect. -${penalty} points for mistakes. ${scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} total.`;
  replyInput.value = "";
  replyInput.disabled = true;
  sendButton.disabled = true;
  resizeReplyInput();
  setTypingState(analysis.mistakes === 0 ? "ready" : "error");
  updateHud();
  scheduleTask(advanceConversation, 950);
}

function createParticle(x, y, color, speedScale = 1) {
  return {
    x,
    y,
    vx: rand(-1.6, 1.6) * speedScale,
    vy: rand(-2.4, 1.4) * speedScale,
    size: rand(2, 7),
    life: rand(0.3, 0.75),
    maxLife: rand(0.3, 0.75),
    color,
  };
}

function spawnCoinBurst(screenX, screenY) {
  for (let index = 0; index < 10; index += 1) {
    game.particles.push(createParticle(screenX, screenY, pick(["#ffe680", "#ffd34d", "#fff7cc"]), 2.2));
  }
}

function spawnCrashBurst(screenX, screenY) {
  for (let index = 0; index < 42; index += 1) {
    game.particles.push(createParticle(screenX, screenY, pick(["#ff7b6b", "#ffd34d", "#ffffff", "#82c8ff"]), 3.6));
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  game.width = rect.width;
  game.height = rect.height;
}

function projectPoint(z, lanePosition) {
  const h = game.height;
  const w = game.width;
  const horizonY = h * HORIZON_RATIO;
  const laneDepth = clamp(1 - z / VIEW_DISTANCE, 0, 1);
  const eased = Math.pow(laneDepth, 1.52);
  const roadCenterX = lerp(w * 0.47, w * 0.5, eased);
  const roadWidth = lerp(w * 0.11, w * 0.9, eased);
  const laneGap = roadWidth / LANE_COUNT;
  const y = horizonY + eased * (h * 0.74);
  const x = roadCenterX + (lanePosition - PLAYER_LANE_CENTER) * laneGap;
  const scale = lerp(0.18, 1.08, eased);
  return { x, y, scale, roadWidth, laneGap, eased, roadCenterX, horizonY };
}

function projectDepth(depth, lanePosition) {
  return projectPoint(VIEW_DISTANCE * (1 - clamp(depth, 0, 1)), lanePosition);
}

function laneWorldX(lanePosition) {
  const projection = projectPoint(PLAYER_CAR_Z, lanePosition);
  return projection.x;
}

function spawnTrafficWave() {
  const laneShift = pick([-1, 0, 1]);
  game.safeLane = clamp(game.safeLane + laneShift, 0, LANE_COUNT - 1);

  const blockedCount = game.speed > 42 && Math.random() < 0.44 ? 2 : 1;
  const candidatePatterns = [];

  for (let start = 0; start <= LANE_COUNT - blockedCount; start += 1) {
    const lanes = Array.from({ length: blockedCount }, (_, offset) => start + offset);
    if (lanes.includes(game.safeLane)) {
      continue;
    }
    candidatePatterns.push(lanes);
  }

  const blockedLanes = pick(candidatePatterns) || [game.safeLane === 0 ? 2 : 0];
  const openLanes = [];
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    if (!blockedLanes.includes(lane)) {
      openLanes.push(lane);
    }
  }

  for (const lane of blockedLanes) {
    const [primary, secondary] = pick(TRAFFIC_COLORS);
    game.traffic.push({
      lane,
      z: VIEW_DISTANCE + rand(4, 16),
      wobble: rand(-0.02, 0.02),
      colors: [primary, secondary],
    });
  }

  const coinLane = pick([...openLanes]);
  const coinChain = Math.random() < 0.46 ? Math.floor(rand(2, 5)) : 1;
  for (let index = 0; index < coinChain; index += 1) {
    game.coinsOnRoad.push({
      lane: coinLane,
      z: VIEW_DISTANCE + 12 + index * 7,
      spin: rand(0, Math.PI * 2),
      collected: false,
    });
  }
}

function collectCoin(coin) {
  coin.collected = true;
  game.coins += 1;
  game.score += 35;
  audio.coin();
  const screen = projectPoint(Math.max(coin.z, 0), coin.lane);
  spawnCoinBurst(screen.x, screen.y);
  updateHud();
}

function triggerCrash(obstacle) {
  if (game.state !== "playing") {
    return;
  }

  game.state = "gameover";
  game.awaitingReply = false;
  replyInput.disabled = true;
  sendButton.disabled = true;
  composerNote.textContent = "You crashed. The phone has lost confidence in you.";
  incomingBubble.textContent = "You crashed. Conversation paused.";
  setComposerMirrorHint("Run ended.");
  setComposerMode("idle");
  setTypingState("error");
  clearScheduledTasks();
  audio.crash();
  game.shake = 18;

  const crashPoint = projectPoint(Math.max(obstacle.z, 0), obstacle.lane);
  spawnCrashBurst(crashPoint.x, crashPoint.y);

  game.best = Math.max(game.best, game.score);
  localStorage.setItem(BEST_SCORE_KEY, String(game.best));
  syncBestReadouts();

  finalScoreValue.textContent = String(game.score);
  finalCoinValue.textContent = String(game.coins);
  finalTextValue.textContent = String(game.texts);
  finalBestValue.textContent = String(game.best);
  const avgWpm = game.totalTypingMs > 0 ? Math.round((game.totalCharsTyped / 5) / (game.totalTypingMs / 60000)) : 0;
  const accuracy = game.totalExpectedChars > 0 ? Math.round((game.totalCorrectChars / game.totalExpectedChars) * 100) : 0;
  finalWpmValue.textContent = avgWpm > 0 ? String(avgWpm) : "—";
  finalAccuracyValue.textContent = game.totalExpectedChars > 0 ? `${accuracy}%` : "—";
  gameOverSummary.textContent = `You made it ${Math.round(game.distance)} meters, sent ${game.texts} texts, and still folded the front bumper like a cheap lawn chair.`;

  scheduleTask(() => {
    gameOverScreen.classList.add("visible");
  }, 720);
}

function startGame() {
  clearScheduledTasks();
  game.state = "playing";
  game.time = 0;
  game.visualScroll = 0;
  game.speed = 30;
  game.score = 0;
  game.distance = 0;
  game.coins = 0;
  game.texts = 0;
  game.totalCharsTyped = 0;
  game.totalTypingMs = 0;
  game.totalCorrectChars = 0;
  game.totalExpectedChars = 0;
  game.currentLane = 2;
  game.targetLane = 2;
  game.safeLane = 2;
  game.traffic = [];
  game.coinsOnRoad = [];
  game.particles = [];
  game.spawnTimer = 0.95;
  game.awaitingReply = false;
  game.expectedReply = "";
  game.shake = 0;
  game.threadOrder = shuffle(conversations.map((_, index) => index));
  game.threadIndex = 0;
  startScreen.classList.remove("visible");
  gameOverScreen.classList.remove("visible");
  setTypingState("");
  updateHud();
  beginThread(0);
}

function moveLane(direction) {
  if (game.state !== "playing") {
    return;
  }

  const nextLane = clamp(game.targetLane + direction, 0, LANE_COUNT - 1);
  if (nextLane === game.targetLane) {
    return;
  }

  game.targetLane = nextLane;
  audio.laneShift();
  updateHud();
}

function updateParticles(dt) {
  for (const particle of game.particles) {
    particle.life -= dt;
    particle.x += particle.vx * 120 * dt;
    particle.y += particle.vy * 120 * dt;
    particle.vy += 4.8 * dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);
}

function updatePlaying(dt) {
  game.time += dt;
  game.visualScroll += game.speed * dt;
  game.distance += game.speed * dt * 1.3;
  game.speed += dt * 0.28;
  game.score += Math.floor(game.speed * dt * 4.5);
  game.currentLane = lerp(game.currentLane, game.targetLane, 1 - Math.exp(-12 * dt));
  game.spawnTimer -= dt;

  if (game.spawnTimer <= 0) {
    spawnTrafficWave();
    const interval = Math.max(0.62, 1.02 - (game.speed - 30) * 0.008);
    game.spawnTimer += interval * rand(0.88, 1.12);
  }

  for (const obstacle of game.traffic) {
    const depthBoost = 0.58 + (1 - clamp(obstacle.z / VIEW_DISTANCE, 0, 1)) * 1.75;
    obstacle.z -= game.speed * dt * 1.12 * depthBoost;
  }

  for (const coin of game.coinsOnRoad) {
    const depthBoost = 0.68 + (1 - clamp(coin.z / VIEW_DISTANCE, 0, 1)) * 1.55;
    coin.z -= game.speed * dt * 1.02 * depthBoost;
  }

  for (const obstacle of game.traffic) {
    const laneGap = Math.abs(game.currentLane - obstacle.lane);
    if (obstacle.z <= PLAYER_COLLISION_Z && obstacle.z >= -1 && laneGap < 0.34) {
      triggerCrash(obstacle);
      return;
    }
  }

  for (const coin of game.coinsOnRoad) {
    if (!coin.collected && coin.z <= PLAYER_COLLISION_Z + 2 && Math.abs(game.currentLane - coin.lane) < 0.4) {
      collectCoin(coin);
    }
  }

  game.traffic = game.traffic.filter((obstacle) => obstacle.z > -14);
  game.coinsOnRoad = game.coinsOnRoad.filter((coin) => coin.z > -12 && !coin.collected);
  game.shake = Math.max(0, game.shake - dt * 22);
  updateParticles(dt);
  audio.updateEngine(game.speed, true);
  updateHud();
}

function updateIdle(dt) {
  game.time += dt;
  game.visualScroll += 14 * dt;
  game.currentLane = lerp(game.currentLane, 2, 1 - Math.exp(-6 * dt));
  game.targetLane = 2;
  game.shake = Math.max(0, game.shake - dt * 20);
  updateParticles(dt);
  audio.updateEngine(12, false);
}

function drawBackground() {
  const w = game.width;
  const h = game.height;
  const horizonY = h * HORIZON_RATIO;
  const parallax = (game.currentLane - PLAYER_LANE_CENTER) * 18;
  const skylineBaseY = horizonY + 10;

  const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
  skyGradient.addColorStop(0, "#87d7ff");
  skyGradient.addColorStop(0.28, "#ffc08f");
  skyGradient.addColorStop(0.62, "#1f3b54");
  skyGradient.addColorStop(1, "#09111d");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, w, h);

  const sunGradient = ctx.createRadialGradient(w * 0.54, horizonY * 0.74, 12, w * 0.54, horizonY * 0.74, h * 0.18);
  sunGradient.addColorStop(0, "rgba(255, 244, 208, 0.88)");
  sunGradient.addColorStop(0.35, "rgba(255, 193, 112, 0.55)");
  sunGradient.addColorStop(1, "rgba(255, 193, 112, 0)");
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(w * 0.54, horizonY * 0.74, h * 0.18, 0, Math.PI * 2);
  ctx.fill();

  const haze = ctx.createLinearGradient(0, horizonY - 12, 0, skylineBaseY + 24);
  haze.addColorStop(0, "rgba(255, 206, 168, 0.18)");
  haze.addColorStop(1, "rgba(17, 31, 46, 0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizonY - 12, w, 60);

  ctx.fillStyle = "rgba(19, 30, 45, 0.78)";
  for (const block of SKYLINE_BLOCKS) {
    const x = block.offset * w - parallax * 0.16 + block.xOffset;
    const baseY = skylineBaseY + block.yOffset * 0.22;
    ctx.fillRect(x, baseY - block.height, block.width, block.height);
  }

  ctx.fillStyle = "#2f455a";
  ctx.fillRect(0, skylineBaseY, w, 16);

  ctx.fillStyle = "#26475e";
  ctx.beginPath();
  ctx.moveTo(0, skylineBaseY + 18);
  for (let x = 0; x <= w + 40; x += 40) {
    const ridge =
      Math.sin((x + game.visualScroll * 10) * 0.013) * 16 +
      Math.sin((x + 120) * 0.031) * 7 +
      Math.sin((x + 40) * 0.061) * 4;
    ctx.lineTo(x, skylineBaseY + 24 + ridge);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  const roadsideGradient = ctx.createLinearGradient(0, skylineBaseY + 18, 0, h);
  roadsideGradient.addColorStop(0, "#2b6145");
  roadsideGradient.addColorStop(1, "#0d2418");
  ctx.fillStyle = roadsideGradient;
  ctx.fillRect(0, skylineBaseY + 18, w, h - skylineBaseY - 18);
}

function drawRoad() {
  const w = game.width;
  const h = game.height;
  const top = projectPoint(VIEW_DISTANCE, PLAYER_LANE_CENTER);
  const bottom = projectPoint(0, PLAYER_LANE_CENTER);

  ctx.beginPath();
  ctx.moveTo(top.roadCenterX - top.roadWidth / 2, top.y);
  ctx.lineTo(top.roadCenterX + top.roadWidth / 2, top.y);
  ctx.lineTo(bottom.roadCenterX + bottom.roadWidth / 2, h);
  ctx.lineTo(bottom.roadCenterX - bottom.roadWidth / 2, h);
  ctx.closePath();

  const asphalt = ctx.createLinearGradient(0, top.y, 0, h);
  asphalt.addColorStop(0, "#465567");
  asphalt.addColorStop(0.3, "#2f3946");
  asphalt.addColorStop(1, "#151a24");
  ctx.fillStyle = asphalt;
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 230, 148, 0.72)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(top.roadCenterX - top.roadWidth / 2, top.y);
  ctx.lineTo(bottom.roadCenterX - bottom.roadWidth / 2, h);
  ctx.moveTo(top.roadCenterX + top.roadWidth / 2, top.y);
  ctx.lineTo(bottom.roadCenterX + bottom.roadWidth / 2, h);
  ctx.stroke();

  const markerCount = 18;
  const markerLength = 0.08;
  const dividerOffset = (game.visualScroll * 0.022) % 1;

  for (let divider = 0.5; divider < LANE_COUNT - 0.01; divider += 1) {
    for (let index = 0; index < markerCount; index += 1) {
      const nearDepth = ((index / markerCount) + dividerOffset) % 1;
      const farDepth = Math.max(0, nearDepth - markerLength);
      const far = projectDepth(farDepth, divider);
      const near = projectDepth(nearDepth, divider);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
      ctx.lineWidth = Math.max(1, near.scale * 4.1);
      ctx.beginPath();
      ctx.moveTo(far.x, far.y);
      ctx.lineTo(near.x, near.y);
      ctx.stroke();
    }
  }

  const shoulderCount = 16;
  const shoulderLength = 0.065;
  const shoulderOffset = (game.visualScroll * 0.026) % 1;
  for (let side = -1; side <= 1; side += 2) {
    for (let index = 0; index < shoulderCount; index += 1) {
      const nearDepth = ((index / shoulderCount) + shoulderOffset) % 1;
      const farDepth = Math.max(0, nearDepth - shoulderLength);
      const segmentStart = projectDepth(nearDepth, PLAYER_LANE_CENTER);
      const segmentEnd = projectDepth(farDepth, PLAYER_LANE_CENTER);
      const widthStart = segmentStart.roadWidth / 2;
      const widthEnd = segmentEnd.roadWidth / 2;
      const x1 = segmentStart.roadCenterX + widthStart * side;
      const x2 = segmentEnd.roadCenterX + widthEnd * side;
      ctx.strokeStyle = index % 2 === 0 ? "rgba(255, 255, 255, 0.78)" : "rgba(255, 78, 64, 0.82)";
      ctx.lineWidth = Math.max(2, segmentStart.scale * 7);
      ctx.beginPath();
      ctx.moveTo(x1, segmentStart.y);
      ctx.lineTo(x2, segmentEnd.y);
      ctx.stroke();
    }
  }
}

function drawCoin(screenX, screenY, scale, spin) {
  ctx.save();
  ctx.translate(screenX, screenY);
  const squash = Math.abs(Math.sin(game.time * 7 + spin)) * 0.8 + 0.18;
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 24, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const coinGradient = ctx.createLinearGradient(-22, -20, 22, 20);
  coinGradient.addColorStop(0, "#fff4ba");
  coinGradient.addColorStop(0.42, "#ffd34d");
  coinGradient.addColorStop(1, "#d58a00");
  ctx.fillStyle = coinGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20 * squash, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(136, 78, 0, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14 * squash, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (squash > 0.32) {
    ctx.fillStyle = "rgba(123, 79, 3, 0.9)";
    ctx.font = "bold 18px 'Arial Rounded MT Bold', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("T", 0, 1);
  }

  ctx.restore();
}

function drawVehicle(screenX, screenY, scale, colors, facing, options = {}) {
  const { rotation = 0 } = options;
  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);
  ctx.scale(1, 0.65);

  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, 50, 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const outerGradient = ctx.createLinearGradient(0, -44, 0, 54);
  outerGradient.addColorStop(0, "#121621");
  outerGradient.addColorStop(1, "#05070b");
  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.moveTo(-20, -42);
  ctx.quadraticCurveTo(0, -52, 20, -42);
  ctx.lineTo(28, -10);
  ctx.quadraticCurveTo(31, 8, 28, 30);
  ctx.quadraticCurveTo(24, 48, 12, 56);
  ctx.lineTo(-12, 56);
  ctx.quadraticCurveTo(-24, 48, -28, 30);
  ctx.quadraticCurveTo(-31, 8, -28, -10);
  ctx.closePath();
  ctx.fill();

  const bodyGradient = ctx.createLinearGradient(0, -40, 0, 48);
  bodyGradient.addColorStop(0, colors[0]);
  bodyGradient.addColorStop(0.4, colors[0]);
  bodyGradient.addColorStop(1, colors[1]);
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(-16, -40);
  ctx.quadraticCurveTo(0, -48, 16, -40);
  ctx.lineTo(22, -12);
  ctx.quadraticCurveTo(25, 8, 22, 28);
  ctx.quadraticCurveTo(20, 42, 10, 48);
  ctx.lineTo(-10, 48);
  ctx.quadraticCurveTo(-20, 42, -22, 28);
  ctx.quadraticCurveTo(-25, 8, -22, -12);
  ctx.closePath();
  ctx.fill();

  const bodyGloss = ctx.createLinearGradient(-10, -40, 12, 30);
  bodyGloss.addColorStop(0, "rgba(255, 255, 255, 0.24)");
  bodyGloss.addColorStop(0.32, "rgba(255, 255, 255, 0.05)");
  bodyGloss.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bodyGloss;
  ctx.beginPath();
  ctx.moveTo(-10, -36);
  ctx.quadraticCurveTo(0, -42, 10, -34);
  ctx.lineTo(10, 20);
  ctx.quadraticCurveTo(2, 14, -6, 2);
  ctx.closePath();
  ctx.fill();

  if (facing === "front") {
    ctx.fillStyle = "#112138";
    ctx.beginPath();
    ctx.moveTo(-11, -18);
    ctx.lineTo(11, -18);
    ctx.lineTo(15, 16);
    ctx.lineTo(-15, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(185, 227, 255, 0.36)";
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(8, -14);
    ctx.lineTo(11, 12);
    ctx.lineTo(-11, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(185, 227, 255, 0.24)";
    ctx.beginPath();
    ctx.moveTo(-7, 12);
    ctx.lineTo(7, 12);
    ctx.lineTo(10, 28);
    ctx.lineTo(-10, 28);
    ctx.closePath();
    ctx.fill();
  } else {
    // Rear windshield — wider at top (roof side), narrower at bottom (trunk side)
    ctx.fillStyle = "#112138";
    ctx.beginPath();
    ctx.moveTo(-14, -12);
    ctx.lineTo(14, -12);
    ctx.lineTo(9, 12);
    ctx.lineTo(-9, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(185, 227, 255, 0.30)";
    ctx.beginPath();
    ctx.moveTo(-11, -9);
    ctx.lineTo(11, -9);
    ctx.lineTo(7, 10);
    ctx.lineTo(-7, 10);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#1d1d23";
  drawRoundedRect(ctx, -27, -22, 7, 20, 4, "#101116");
  drawRoundedRect(ctx, 20, -22, 7, 20, 4, "#101116");
  drawRoundedRect(ctx, -27, 14, 7, 20, 4, "#101116");
  drawRoundedRect(ctx, 20, 14, 7, 20, 4, "#101116");

  if (facing === "front") {
    drawRoundedRect(ctx, -14, -36, 9, 7, 4, "#fff1af");
    drawRoundedRect(ctx, 5, -36, 9, 7, 4, "#fff1af");
    drawRoundedRect(ctx, -9, -28, 18, 6, 3, "#1e2731");
    drawRoundedRect(ctx, -12, 38, 8, 6, 3, "#ffe39b");
    drawRoundedRect(ctx, 4, 38, 8, 6, 3, "#ffe39b");
  } else {
    drawRoundedRect(ctx, -13, 40, 9, 7, 4, "#ff697f");
    drawRoundedRect(ctx, 4, 40, 9, 7, 4, "#ff697f");
    drawRoundedRect(ctx, -12, -36, 24, 6, 3, "#0f1420");
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.lineTo(0, 46);
  ctx.stroke();

  ctx.restore();
}

function drawPlayerCar() {
  const projection = projectPoint(PLAYER_CAR_Z, game.currentLane);
  const x = projection.x;
  const y = projection.y + 4;
  const wobble = Math.sin(game.time * 12) * 0.8 + (game.currentLane - game.targetLane) * 2.4;
  const rotation = (game.currentLane - game.targetLane) * 0.02;
  const flamePower = clamp((game.speed - 42) / 18, 0, 1);

  if (game.state === "playing" && flamePower > 0.12) {
    ctx.save();
    ctx.translate(x + wobble, y);
    ctx.scale(1.16, 1.16);
    ctx.rotate(rotation);
    ctx.scale(1, 0.65);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255, ${180 + flamePower * 60}, 90, 0.6)`;
    ctx.beginPath();
    ctx.moveTo(-8, 48);
    ctx.quadraticCurveTo(-2, 66 + flamePower * 15, 0, 48);
    ctx.moveTo(8, 48);
    ctx.quadraticCurveTo(2, 66 + flamePower * 15, 0, 48);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  const redColors = ["#ff4848", "#9f0d13"];
  drawVehicle(x + wobble, y, 1.16, redColors, "rear", { rotation });
}

function drawRoadObjects() {
  const objects = [];

  for (const obstacle of game.traffic) {
    if (obstacle.z > VIEW_DISTANCE || obstacle.z < -4) {
      continue;
    }
    const projection = projectPoint(obstacle.z, obstacle.lane + obstacle.wobble);
    objects.push({
      type: "traffic",
      z: obstacle.z,
      projection,
      obstacle,
    });
  }

  for (const coin of game.coinsOnRoad) {
    if (coin.collected || coin.z > VIEW_DISTANCE || coin.z < -4) {
      continue;
    }
    const projection = projectPoint(coin.z, coin.lane);
    objects.push({
      type: "coin",
      z: coin.z,
      projection,
      coin,
    });
  }

  objects.sort((left, right) => right.z - left.z);

  for (const item of objects) {
    if (item.type === "traffic") {
      drawVehicle(item.projection.x, item.projection.y, item.projection.scale, item.obstacle.colors, "front");
    } else {
      drawCoin(item.projection.x, item.projection.y - item.projection.scale * 20, item.projection.scale, item.coin.spin);
    }
  }
}

function drawParticles() {
  ctx.save();
  for (const particle of game.particles) {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSpeedLines() {
  if (game.state !== "playing") {
    return;
  }

  const intensity = clamp((game.speed - 34) / 26, 0, 1);
  if (intensity <= 0) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + intensity * 0.12})`;
  ctx.lineWidth = 2;
  for (let index = 0; index < 18; index += 1) {
    const x = rand(0, game.width);
    const y = rand(game.height * 0.25, game.height);
    const length = rand(10, 24) * intensity;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + rand(-4, 4), y + length);
    ctx.stroke();
  }
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, game.width, game.height);

  const shakeX = game.shake > 0 ? rand(-game.shake, game.shake) : 0;
  const shakeY = game.shake > 0 ? rand(-game.shake * 0.4, game.shake * 0.4) : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground();
  drawRoad();
  drawRoadObjects();
  drawSpeedLines();
  drawPlayerCar();
  drawParticles();
  ctx.restore();
}

function frame(timestamp) {
  if (!game.lastFrame) {
    game.lastFrame = timestamp;
  }

  const dt = Math.min((timestamp - game.lastFrame) / 1000, 0.033);
  game.lastFrame = timestamp;

  if (game.state === "playing") {
    updatePlaying(dt);
  } else {
    updateIdle(dt);
  }

  render();
  window.requestAnimationFrame(frame);
}

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  submitReply();
});

replyInput.addEventListener("input", handleTypingProgress);
replyInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitReply();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveLane(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveLane(1);
  }

  if (event.key === "Enter" && game.awaitingReply) {
    event.preventDefault();
    submitReply();
  }

  if ((event.key === "r" || event.key === "R") && game.state === "gameover") {
    event.preventDefault();
    startGame();
  }
});

leftButton.addEventListener("click", () => moveLane(-1));
rightButton.addEventListener("click", () => moveLane(1));

startButton.addEventListener("click", async () => {
  await audio.arm();
  startGame();
});

restartButton.addEventListener("click", async () => {
  await audio.arm();
  startGame();
});

window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("click", () => {
  if (game.awaitingReply) {
    replyInput.focus();
  }
});

syncBestReadouts();
updateHud();
resizeCanvas();
resetTypingUi("Left and right arrow keys still steer while the message field is focused.");
window.requestAnimationFrame(frame);
