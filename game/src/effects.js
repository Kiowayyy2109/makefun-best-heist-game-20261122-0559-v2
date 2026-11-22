// effects.js — particle bursts, floating score text and screen shake.
// Purely cosmetic: every effect is spawned by gameplay events in game.js
// (loot taken, glass smashed, coin tossed, EMP fired, laser tripped).
import { PALETTE } from './config.js';

const MAX_PARTICLES = 420;

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  spawn(x, y, opts = {}) {
    const count = opts.count ?? 10;
    const color = opts.color ?? PALETTE.gold;
    const speed = opts.speed ?? 120;
    const life = opts.life ?? 0.7;
    const size = opts.size ?? 3;
    const gravity = opts.gravity ?? 0;
    const spread = opts.spread ?? Math.PI * 2;
    const baseAngle = opts.angle ?? 0;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const a = baseAngle + (Math.random() - 0.5) * spread;
      const v = speed * (0.35 + Math.random() * 0.85);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life * (0.6 + Math.random() * 0.7),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
        gravity,
      });
    }
  }

  sparkleLoot(x, y, color) {
    this.spawn(x, y, { count: 16, color, speed: 90, life: 0.8, size: 3 });
    this.spawn(x, y, { count: 6, color: '#ffffff', speed: 50, life: 0.5, size: 2 });
  }

  glassShards(x, y) {
    this.spawn(x, y, {
      count: 22,
      color: '#bfe0ff',
      speed: 190,
      life: 0.65,
      size: 2.5,
      gravity: 260,
    });
  }

  smokePuff(x, y) {
    this.spawn(x, y, { count: 14, color: 'rgba(200,205,220,0.7)', speed: 40, life: 1.1, size: 7 });
  }

  coinGlint(x, y) {
    this.spawn(x, y, { count: 8, color: PALETTE.goldBright, speed: 60, life: 0.45, size: 2 });
  }

  empWave(x, y) {
    this.spawn(x, y, { count: 26, color: '#7fb0ff', speed: 260, life: 0.5, size: 2.5 });
  }

  alarmPulse(x, y) {
    this.spawn(x, y, { count: 12, color: PALETTE.danger, speed: 130, life: 0.55, size: 3 });
  }

  addText(x, y, text, color = PALETTE.goldBright) {
    this.texts.push({ x, y, text, color, t: 1.6 });
    if (this.texts.length > 12) this.texts.shift();
  }

  addShake(amount) {
    this.shake = Math.min(14, this.shake + amount);
  }

  update(dt) {
    for (const pt of this.particles) {
      pt.life -= dt;
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= (1 - dt * 1.6);
      pt.vy *= (1 - dt * 0.4);
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const t of this.texts) {
      t.t -= dt;
      t.y -= dt * 34;
    }
    this.texts = this.texts.filter((t) => t.t > 0);
    if (this.shake > 0.2) {
      this.shakeX = (Math.random() - 0.5) * this.shake;
      this.shakeY = (Math.random() - 0.5) * this.shake;
      this.shake *= Math.pow(0.001, dt); // fast decay
      if (this.shake <= 0.2) {
        this.shake = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  draw(ctx, cam) {
    for (const pt of this.particles) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x - cam.x, pt.y - cam.y, pt.size, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.t);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x - cam.x, t.y - cam.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  clear() {
    this.particles = [];
    this.texts = [];
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }
}
