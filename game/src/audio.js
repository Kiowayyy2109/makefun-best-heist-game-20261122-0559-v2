// audio.js — procedural WebAudio: steps, coin, glass, alarm, ambience.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this.alarmOsc = null;
    this.stepTimer = 0;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    this.startAmbience();
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }
  tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  noise(dur, vol = 0.15, freq = 1200, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  }
  step(sneak) { this.noise(0.05, sneak ? 0.03 : 0.07, sneak ? 500 : 700); }
  coin() { this.tone(1560, 0.09, 'sine', 0.22); this.tone(2090, 0.14, 'sine', 0.18, null, 0.07); }
  pickup() { this.tone(880, 0.08, 'triangle', 0.2); this.tone(1320, 0.12, 'triangle', 0.18, null, 0.06); }
  glassBreak() { this.noise(0.35, 0.3, 2600); this.tone(2400, 0.2, 'square', 0.06, 900); }
  cutter() { this.noise(0.4, 0.08, 3400); }
  lockpickTick() { this.tone(1900, 0.03, 'square', 0.06); }
  lockOpen() { this.tone(660, 0.08, 'triangle', 0.2); this.tone(990, 0.14, 'triangle', 0.2, null, 0.07); }
  smoke() { this.noise(0.5, 0.16, 900); }
  emp() { this.tone(180, 0.5, 'sawtooth', 0.2, 40); this.noise(0.3, 0.12, 300); }
  spotted() { this.tone(1180, 0.12, 'square', 0.16); this.tone(1180, 0.12, 'square', 0.16, null, 0.16); }
  win() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.2, null, i * 0.12)); }
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.26, 'sawtooth', 0.12, null, i * 0.14)); }
  startAmbience() {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = 55;
    g.gain.value = 0.035;
    o.connect(g); g.connect(this.master); o.start();
    const o2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    o2.type = 'sine'; o2.frequency.value = 110.5;
    g2.gain.value = 0.015;
    o2.connect(g2); g2.connect(this.master); o2.start();
  }
  setAlarm(on) {
    if (!this.ctx) return;
    if (on && !this.alarmOsc) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 720;
      lfo.frequency.value = 1.6; lfoG.gain.value = 180;
      lfo.connect(lfoG); lfoG.connect(o.frequency);
      g.gain.value = 0.045;
      o.connect(g); g.connect(this.master);
      o.start(); lfo.start();
      this.alarmOsc = { o, lfo, g };
    } else if (!on && this.alarmOsc) {
      try { this.alarmOsc.o.stop(); this.alarmOsc.lfo.stop(); } catch { /* already stopped */ }
      this.alarmOsc = null;
    }
  }
  updateSteps(dt, moving, sneak) {
    if (!moving) { this.stepTimer = 0; return; }
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) { this.step(sneak); this.stepTimer = sneak ? 0.42 : 0.3; }
  }
}
