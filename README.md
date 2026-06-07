# Txtr

**Texting &amp; driving. What could possibly go wrong?**

A Temple Run-inspired endless runner fused with a typing test — a *texting and driving* arcade game. You're flooring it down a five-lane highway, dodging traffic with one hand while frantically typing replies to a stream of absurd text conversations with the other. Chain coins, perfect texts, and near-misses into a score multiplier, then watch it all end in a fender-folding wreck.

## ▶️ Play it live: [devon7y.github.io/Txtr](https://devon7y.github.io/Txtr/)

## How to play

- **Steer** — `←` `→` or `A` `/` `D` (or tap the left/right of the screen on mobile).
- **Type** — when a reply appears, type it out. `Enter` sends. Letters are scored as you go; only **perfect** texts keep your combo alive.
- **Survive** — collect coins, grab power-ups, and don't crash. The road only gets faster.

## What makes it tick

- **Combo multiplier** — coins, near-misses, and perfect texts build a multiplier (up to ×12). One sloppy text and it's gone. Risk vs. reward on every send.
- **Near-miss system** — shave past a car and bank bonus points + a slow-mo beat. Living dangerously pays.
- **Power-ups** — 🛡 Shield (survive one hit), 🧲 Magnet (vacuum coins), ✦ x2 Score.
- **Garage** — spend coins to unlock 12 cars, from Cherry Bomb to the rainbow Hot Streak.
- **Progression** — local leaderboard, a dozen achievements, lifetime stats, and a deterministic **Daily Challenge** (same run for everyone, every day).
- **Three difficulties** — Chill, Normal, Mayhem.
- **Juice** — screen shake, particle bursts, score popups, banners, and a fully procedural engine + SFX soundtrack (no audio files).

## Tech

Plain **HTML / CSS / JavaScript** with a `<canvas>` pseudo-3D renderer — no build step, no frameworks, no dependencies, and **all original art** (procedurally drawn — clean for commercial use). The only external resource is the Fredoka font via Google Fonts (open-licensed).

```text
index.html        # markup + layers
styles.css        # Bold Cartoon Arcade theme
js/content.js     # conversations, cars, achievements, difficulties
js/audio.js       # procedural WebAudio engine + SFX
js/game.js        # engine: perspective renderer, game loop, systems, UI
```

Run locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Hosting

Deployed via **GitHub Pages** from the `main` branch (root). Any push to `main` redeploys the live site.

---

*Originally a native iOS / SpriteKit prototype (see the `master` branch); rebuilt for the web.*
