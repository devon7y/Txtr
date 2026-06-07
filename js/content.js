/* ==========================================================================
   Txtr — content & data layer
   Conversations, unlockable cars, achievements, difficulty modes.
   Loaded before audio.js and game.js (classic scripts, shared global scope).
   ========================================================================== */

/* --- Conversations -------------------------------------------------------- */
/* Each thread is a back-and-forth. "other" lines are incoming; "player" lines
   are the scripted replies the user must type. Keep replies punchy — long
   replies hurt pacing. */
const CONVERSATIONS = [
  {
    avatar: "PP",
    contact: "Dr. Penelope Park",
    role: "Therapist",
    lines: [
      { from: "other", text: "How did the honesty exercise with Casey go?" },
      { from: "player", text: "I asked for space and she labeled my closet a museum." },
      { from: "other", text: "That is passive aggressive, but well organized." },
      { from: "player", text: "There is a gift shop. It sells tiny apology candles." },
      { from: "other", text: "Did you use an I feel statement?" },
      { from: "player", text: "Yes. I feel attacked by artisanal lavender." },
      { from: "other", text: "Progress. You are both naming feelings now." },
      { from: "player", text: "We have evolved into scented debate club." },
    ],
  },
  {
    avatar: "CY",
    contact: "Casey",
    role: "Wife",
    lines: [
      { from: "other", text: "Can you grab pasta on the way home?" },
      { from: "player", text: "Only if we agree spaghetti is not a personality." },
      { from: "other", text: "You lost pantry rights after the noodle horoscope." },
      { from: "player", text: "The rigatoni had real leadership energy." },
      { from: "other", text: "The sink is making your couples therapy noise again." },
      { from: "player", text: "A soft groan followed by dramatic silence?" },
      { from: "other", text: "Call the plumber before it asks for boundaries." },
      { from: "player", text: "Fine. Bringing peace and garlic bread." },
    ],
  },
  {
    avatar: "OL",
    contact: "Olive",
    role: "Daughter",
    lines: [
      { from: "other", text: "Dad, Mr Biscuits is missing again." },
      { from: "player", text: "Check the laundry basket, his cave of reflection." },
      { from: "other", text: "He left a sock and a note that just said meow." },
      { from: "player", text: "Classic Biscuits. How was school today?" },
      { from: "other", text: "My volcano erupted onto Trevor's diorama farm." },
      { from: "player", text: "That is science. Trevor owns fertile land now." },
      { from: "other", text: "Found him. He was judging us from the closet." },
      { from: "player", text: "Tell him dinner is in ten and parole is at six." },
    ],
  },
  {
    avatar: "MR",
    contact: "Marco",
    role: "Best Friend",
    lines: [
      { from: "other", text: "You still doing date night tonight?" },
      { from: "player", text: "Yes. I accidentally booked competitive mini golf." },
      { from: "other", text: "Isn't all mini golf competitive?" },
      { from: "player", text: "Not until your wife reviews your putting posture." },
      { from: "other", text: "Fair. Did therapy actually help?" },
      { from: "player", text: "I learned marriage is saying that is not what I meant." },
      { from: "other", text: "Deep. Bowling team needs you Thursday." },
      { from: "player", text: "Tell them I am emotionally available but bad at bowling." },
    ],
  },
  {
    avatar: "MM",
    contact: "Mom",
    role: "Professional Worrier",
    lines: [
      { from: "other", text: "Sweetie, are you and Casey doing okay?" },
      { from: "player", text: "We are, although the dishwasher has taken sides." },
      { from: "other", text: "Appliances should never be allowed opinions." },
      { from: "player", text: "Too late. It only runs when Casey says please." },
      { from: "other", text: "I warned you a smart kitchen was arrogant." },
      { from: "player", text: "The toaster called me buddy in a pitying tone." },
      { from: "other", text: "I am dropping off casserole right now." },
      { from: "player", text: "Apology casserole or surveillance casserole?" },
    ],
  },
  {
    avatar: "HOA",
    contact: "Pineview HOA",
    role: "Group Chat",
    lines: [
      { from: "other", text: "Decorative geese may not wear seasonal wigs." },
      { from: "player", text: "Counterpoint, my goose was expressing autumn." },
      { from: "other", text: "Autumn does not require a magenta bob." },
      { from: "player", text: "Tell that to fashion week." },
      { from: "other", text: "Your car alarm played saxophone at 2 am." },
      { from: "player", text: "That was me practicing conflict resolution." },
      { from: "other", text: "Please resolve it indoors." },
      { from: "player", text: "My goose accepts one tasteful beret under protest." },
    ],
  },
  {
    avatar: "GY",
    contact: "Gary",
    role: "Mechanic",
    lines: [
      { from: "other", text: "Your car is ready for pickup." },
      { from: "player", text: "Did you fix the squeak or give it a speech again?" },
      { from: "other", text: "Both. The squeak responded to firm leadership." },
      { from: "player", text: "Respect. Any bad news for me?" },
      { from: "other", text: "You wore the left tires out way faster than the right." },
      { from: "player", text: "I have been making emotionally complex turns." },
      { from: "other", text: "Found two arcade tokens and a gummy bear inside." },
      { from: "player", text: "Those are factory installed morale boosters." },
    ],
  },
  {
    avatar: "NN",
    contact: "Nina",
    role: "Sister",
    lines: [
      { from: "other", text: "Mom says you are having marriage weather." },
      { from: "player", text: "We are having a drizzle with decorative thunder." },
      { from: "other", text: "So, medium bad." },
      { from: "player", text: "No, medium theatrical." },
      { from: "other", text: "Want me to watch Olive on Saturday?" },
      { from: "player", text: "Yes, but no card tricks this time please." },
      { from: "other", text: "She asked. The child craves mystery." },
      { from: "player", text: "Last time she vanished the principal from a list." },
    ],
  },
  {
    avatar: "BZ",
    contact: "Boss",
    role: "Sends Memes At Midnight",
    lines: [
      { from: "other", text: "Quick question before the Monday sync." },
      { from: "player", text: "It is Saturday and I am physically in a car." },
      { from: "other", text: "Perfect, so you have time to circle back." },
      { from: "player", text: "I cannot circle back, I can barely circle forward." },
      { from: "other", text: "Can you just align on the deck real quick?" },
      { from: "player", text: "The only deck I see right now is the dashboard." },
      { from: "other", text: "Love the energy. Let us take this offline." },
      { from: "player", text: "We are offline. We have always been offline." },
    ],
  },
  {
    avatar: "DV",
    contact: "Dave",
    role: "Fantasy League Commissioner",
    lines: [
      { from: "other", text: "You forgot to set your lineup again." },
      { from: "player", text: "My kicker is on a bye and so is my will to live." },
      { from: "other", text: "Bench your injured guy, he is questionable." },
      { from: "player", text: "Aren't we all questionable, Dave." },
      { from: "other", text: "League dues are due. Venmo me by tonight." },
      { from: "player", text: "I will pay in exposure and emotional damage." },
      { from: "other", text: "That is not a real currency." },
      { from: "player", text: "Neither is your trophy, yet here we are." },
    ],
  },
];

/* Nobody ends a text with a period. Strip trailing periods from every line
   (keeps ? and ! and mid-message punctuation intact). */
for (const thread of CONVERSATIONS) {
  for (const line of thread.lines) line.text = line.text.replace(/\.+$/, "");
}

/* --- Unlockable cars (cosmetic) ------------------------------------------- */
/* body = main flat color, shade = darker cel-shade tone, roof = cabin color.
   price in coins; the default car is free. Purely cosmetic — no balance edge. */
const CARS = [
  { id: "cherry",   name: "Cherry Bomb",     price: 0,    body: "#ff4d5e", shade: "#c81e3a", roof: "#ffd0d6" },
  { id: "lemon",    name: "Lemon Drop",      price: 150,  body: "#ffd23f", shade: "#e0a400", roof: "#fff3c4" },
  { id: "mint",     name: "Mint Condition",  price: 150,  body: "#2ec4b6", shade: "#1a8f86", roof: "#c9fff8" },
  { id: "bubble",   name: "Bubblegum",       price: 250,  body: "#ff79c6", shade: "#d63c97", roof: "#ffd6ef" },
  { id: "grape",    name: "Grape Ape",       price: 250,  body: "#9b5de5", shade: "#6c33b5", roof: "#e4ccff" },
  { id: "tang",     name: "Tangerine Rush",  price: 400,  body: "#ff8c32", shade: "#d4600c", roof: "#ffe0c2" },
  { id: "toxic",    name: "Toxic Avenger",   price: 600,  body: "#7cff5e", shade: "#3ba81f", roof: "#dcffd0" },
  { id: "ocean",    name: "Deep Ocean",      price: 600,  body: "#3a86ff", shade: "#1b53c0", roof: "#cfe0ff" },
  { id: "mono",     name: "Midnight",        price: 900,  body: "#3a3a48", shade: "#16161f", roof: "#7a7a8c" },
  { id: "cloud",    name: "Cloud Nine",      price: 900,  body: "#f4f4f8", shade: "#c4c4d0", roof: "#ffffff" },
  { id: "gold",     name: "Gold Standard",   price: 2000, body: "#ffd23f", shade: "#b8860b", roof: "#fff6c8", sparkle: true },
  { id: "rainbow",  name: "Hot Streak",      price: 3500, body: "#ff4d5e", shade: "#c81e3a", roof: "#fff3c4", rainbow: true },
];

/* --- Traffic colors (oncoming cars) --------------------------------------- */
const TRAFFIC_PALETTE = [
  { body: "#ffd23f", shade: "#d4a017", roof: "#fff3c4" },
  { body: "#3a86ff", shade: "#1b53c0", roof: "#cfe0ff" },
  { body: "#2ec4b6", shade: "#1a8f86", roof: "#c9fff8" },
  { body: "#ff8c32", shade: "#d4600c", roof: "#ffe0c2" },
  { body: "#9b5de5", shade: "#6c33b5", roof: "#e4ccff" },
  { body: "#ff79c6", shade: "#d63c97", roof: "#ffd6ef" },
  { body: "#f4f4f8", shade: "#b8b8c6", roof: "#ffffff" },
  { body: "#52b788", shade: "#2d6a4f", roof: "#d8f3dc" },
];

/* --- Difficulty modes ----------------------------------------------------- */
/* spawnBase: seconds between traffic waves at base speed (higher = easier).
   ramp: speed gain per second. doubleChance: chance of 2-wide blocks. */
// send: per-reply time limit = base + per*chars (seconds). null = no timer.
const DIFFICULTIES = {
  chill:  { id: "chill",  name: "Chill",   spawnBase: 1.35, ramp: 0.16, doubleChance: 0.18, startSpeed: 26, send: null,                  label: "Relaxed traffic, no send timer" },
  normal: { id: "normal", name: "Normal",  spawnBase: 1.10, ramp: 0.26, doubleChance: 0.40, startSpeed: 30, send: { base: 4.0, per: 0.22 }, label: "Rush hour, type before time runs out" },
  mayhem: { id: "mayhem", name: "Mayhem",  spawnBase: 0.92, ramp: 0.38, doubleChance: 0.62, startSpeed: 36, send: { base: 3.0, per: 0.16 }, label: "Dense traffic, tight send timer" },
};

/* --- Achievements --------------------------------------------------------- */
/* check(ctx) receives { stats, run } and returns true when earned.
   stats = lifetime totals; run = the just-finished run summary. */
const ACHIEVEMENTS = [
  { id: "firstrun",   name: "Learner's Permit", desc: "Finish your first run.",
    check: (c) => c.stats.runs >= 1 },
  { id: "wordsmith",  name: "Wordsmith",        desc: "Land 50 perfect texts total.",
    check: (c) => c.stats.perfectTexts >= 50 },
  { id: "novelist",   name: "Novelist",         desc: "Land 300 perfect texts total.",
    check: (c) => c.stats.perfectTexts >= 300 },
  { id: "closecall",  name: "Close Call",       desc: "Pull off 8 near misses in one run.",
    check: (c) => c.run.nearMisses >= 8 },
  { id: "daredevil",  name: "Daredevil",        desc: "Pull off 25 near misses in one run.",
    check: (c) => c.run.nearMisses >= 25 },
  { id: "comboking",  name: "Combo Royalty",    desc: "Reach a x15 multiplier.",
    check: (c) => c.run.bestMult >= 15 },
  { id: "speed",      name: "Speed Demon",      desc: "Break 140 mph.",
    check: (c) => c.run.topMph >= 140 },
  { id: "marathon",   name: "Long Haul",        desc: "Drive 4000 m in one run.",
    check: (c) => c.run.distance >= 4000 },
  { id: "rich",       name: "Coin Hoarder",     desc: "Collect 1000 coins total.",
    check: (c) => c.stats.totalCoins >= 1000 },
  { id: "collector",  name: "Full Garage",      desc: "Own every car.",
    check: (c) => c.stats.carsOwned >= CARS.length },
  { id: "highroller",  name: "High Roller",     desc: "Score 25,000 in one run.",
    check: (c) => c.run.score >= 25000 },
  { id: "regular",    name: "Daily Driver",     desc: "Play on 3 different days.",
    check: (c) => c.stats.daysPlayed >= 3 },
];
