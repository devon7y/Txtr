# Txtr

**Texting. Driving. Regrettable multitasking.**

A Temple Run-inspired endless runner crossed with a typing test — a *texting and driving* game. You're in a red supercar on the wrong side of a five-lane highway. Dodge oncoming traffic with the arrow keys while typing out scripted replies to a stream of absurd text conversations. The road only gets faster, and one crash ends the run.

### ▶️ Play it live: **https://devon7y.github.io/Txtr/**

## How to play

- **Steer** — left / right arrow keys (or the on-screen buttons) to change lanes.
- **Type** — a scripted reply waits in the message field. Type it to send. Wrong or missing characters cost 10 points each.
- **Survive** — collect coins, keep the conversation going, and don't crash. The speed climbs forever.

At the end of a run you get your score, coins collected, texts completed, best score, average WPM, and typing accuracy.

## Tech

Plain vanilla **HTML / CSS / JavaScript** with a `<canvas>` for the road — no build step, no dependencies. Just open `index.html`.

```bash
# run locally
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Hosting

Deployed via **GitHub Pages** from the `main` branch (root). Any push to `main` redeploys the live site.

---

*Originally a native iOS/SpriteKit prototype (see the `master` branch); rewritten for the web.*
