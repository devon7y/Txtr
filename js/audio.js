/* ==========================================================================
   Txtr — audio
   Procedural WebAudio: a living engine drone plus punchy arcade SFX.
   No external files, so nothing to license.
   ========================================================================== */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.engineBus = null;
    this.noiseBuffer = null;
    this.engine = null;
    this.lastTypeTime = 0;
    this.muted = false;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 1;
        this.sfxBus.connect(this.master);

        this.engineBus = this.ctx.createGain();
        this.engineBus.gain.value = 1;
        this.engineBus.connect(this.master);

        this.noiseBuffer = this.createNoiseBuffer();
      }
    } catch (error) {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  async arm() {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      try { await this.ctx.resume(); } catch (e) { /* ignore */ }
    }
    this.ensureEngine();
  }

  ensureEngine() {
    if (!this.ctx || this.engine) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 480;

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
    lfo.frequency.value = 5.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 9;

    bodyOsc.connect(filter);
    filter.connect(bodyGain);
    bodyGain.connect(this.engineBus);
    whineOsc.connect(whineGain);
    whineGain.connect(this.engineBus);
    lfo.connect(lfoGain);
    lfoGain.connect(bodyOsc.frequency);

    bodyOsc.start();
    whineOsc.start();
    lfo.start();

    this.engine = { filter, bodyOsc, whineOsc, bodyGain, whineGain, lfo, lfoGain };
  }

  createNoiseBuffer() {
    if (!this.ctx) return null;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) channel[i] = Math.random() * 2 - 1;
    return buffer;
  }

  updateEngine(speed, active = true) {
    if (!this.ctx || !this.engine) return;
    const now = this.ctx.currentTime;
    const volume = active ? 0.024 : 0.008;
    this.engine.bodyOsc.frequency.setTargetAtTime(60 + speed * 2.7, now, 0.08);
    this.engine.whineOsc.frequency.setTargetAtTime(118 + speed * 5.6, now, 0.08);
    this.engine.bodyGain.gain.setTargetAtTime(volume, now, 0.09);
    this.engine.whineGain.gain.setTargetAtTime(volume * 0.66, now, 0.09);
    this.engine.filter.frequency.setTargetAtTime(360 + speed * 18, now, 0.12);
  }

  tone(type, startFreq, endFreq, duration, gainAmount, options = {}) {
    if (!this.ctx) return;
    const { delay = 0, attack = 0.003, release = 0.04, bus = this.sfxBus } = options;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(0.001, endFreq), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(gainAmount, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration + release);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(t0);
    osc.stop(t0 + duration + release + 0.02);
  }

  noise(duration, gainAmount, filterType, filterFreq, sweepTo = null) {
    if (!this.ctx || !this.noiseBuffer) return;
    const t0 = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, t0);
    if (sweepTo !== null) filter.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainAmount, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    source.start();
    source.stop(t0 + duration + 0.03);
  }

  /* --- SFX ----------------------------------------------------------------- */
  laneShift() { this.tone("triangle", 360, 700, 0.1, 0.05); }

  type() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastTypeTime < 0.028) return;
    this.lastTypeTime = now;
    this.tone("square", 560 + Math.random() * 220, 440 + Math.random() * 160, 0.022, 0.018);
  }

  typo() { this.tone("square", 240, 150, 0.06, 0.05); }

  send() {
    this.tone("sine", 700, 920, 0.08, 0.05);
    this.tone("sine", 980, 1280, 0.1, 0.04, { delay: 0.06 });
  }

  perfect() {
    this.tone("triangle", 660, 990, 0.09, 0.05);
    this.tone("triangle", 990, 1320, 0.1, 0.045, { delay: 0.07 });
    this.tone("sine", 1320, 1760, 0.12, 0.035, { delay: 0.14 });
  }

  receive() {
    this.tone("sine", 900, 700, 0.07, 0.04);
    this.tone("triangle", 640, 580, 0.09, 0.03, { delay: 0.05 });
  }

  coin() {
    this.tone("square", 880, 1320, 0.06, 0.035);
    this.tone("square", 1320, 1760, 0.09, 0.03, { delay: 0.05 });
  }

  combo(level) {
    const base = 520 + Math.min(level, 24) * 34;
    this.tone("triangle", base, base * 1.5, 0.08, 0.045);
    this.tone("sine", base * 1.5, base * 2, 0.1, 0.03, { delay: 0.05 });
  }

  nearMiss() {
    this.noise(0.28, 0.09, "bandpass", 1400, 320);
    this.tone("sine", 520, 220, 0.22, 0.03);
  }

  powerup() {
    this.tone("triangle", 600, 900, 0.07, 0.045);
    this.tone("triangle", 900, 1200, 0.08, 0.04, { delay: 0.06 });
    this.tone("triangle", 1200, 1600, 0.1, 0.035, { delay: 0.12 });
  }

  shieldBreak() {
    this.noise(0.2, 0.12, "highpass", 900);
    this.tone("triangle", 900, 300, 0.18, 0.05);
  }

  achievement() {
    this.tone("triangle", 700, 700, 0.12, 0.045);
    this.tone("triangle", 880, 880, 0.12, 0.045, { delay: 0.1 });
    this.tone("triangle", 1175, 1175, 0.22, 0.05, { delay: 0.2 });
  }

  uiClick() { this.tone("square", 420, 560, 0.04, 0.03); }
  uiBack() { this.tone("square", 480, 360, 0.05, 0.03); }
  purchase() {
    this.tone("triangle", 520, 780, 0.08, 0.045);
    this.tone("triangle", 780, 1040, 0.12, 0.04, { delay: 0.07 });
  }
  denied() { this.tone("square", 300, 220, 0.12, 0.05); }

  crash() {
    this.noise(0.5, 0.2, "bandpass", 700, 180);
    this.tone("sawtooth", 180, 40, 0.5, 0.13, { release: 0.06 });
    this.tone("square", 120, 50, 0.4, 0.06, { delay: 0.02 });
  }
}
