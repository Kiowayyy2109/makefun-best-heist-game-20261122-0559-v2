// director.js — the night director: timed museum events that keep a run
// tense after the first minutes. A rotating spotlight sweeps the
// Sculpture Court, cameras periodically reboot (a short safe window),
// and guards radio short chatter lines that telegraph their state.
import { PALETTE } from './config.js';
import { lineOfSight } from './museum.js';

export const SPOTLIGHT = {
  x: 1280,
  y: 60,
  range: 430,
  halfAngle: 0.34,
  sweepSpeed: 0.42,
  baseAngle: Math.PI / 2,
  sweepAmount: 1.05,
};

const CHATTER = {
  patrol: [
    'All quiet on my floor.',
    'Another hour, another lap.',
    'These statues give me the creeps.',
    'Coffee break after this round.',
  ],
  curious: [
    'Huh? Thought I saw something…',
    'Who is there?',
    'Probably just the old pipes.',
  ],
  investigate: [
    'Checking that noise out.',
    'Moving to take a look.',
    'Control, I have a possible contact.',
  ],
  chase: [
    'STOP! THIEF!',
    'Control, I am in pursuit!',
    'Do not let him reach the doors!',
  ],
  cameraSeen: [
    'Camera room: movement on a feed!',
    'Eyes on a camera feed — check it out.',
  ],
};

function pickLine(list, seed) {
  return list[Math.abs(Math.floor(seed)) % list.length];
}

export class NightDirector {
  constructor() {
    this.spotlightAngle = SPOTLIGHT.baseAngle;
    this.spotlightSees = false;
    this.rebootTimer = 75; // first camera reboot ~75s into a run
    this.rebootWindow = 0;
    this.chatterTimer = 6;
    this.chatterText = '';
    this.chatterSpeaker = '';
    this.chatterLife = 0;
    this.eventsFired = 0;
  }

  update(dt, game) {
    this.updateSpotlight(dt, game);
    this.updateReboot(dt, game);
    this.updateChatter(dt, game);
  }

  updateSpotlight(dt, game) {
    void dt;
    this.spotlightAngle =
      SPOTLIGHT.baseAngle + Math.sin(game.time * SPOTLIGHT.sweepSpeed) * SPOTLIGHT.sweepAmount;
    const p = game.player;
    const dx = p.x - SPOTLIGHT.x;
    const dy = p.y - SPOTLIGHT.y;
    const dist = Math.hypot(dx, dy);
    this.spotlightSees = false;
    if (dist > SPOTLIGHT.range || dist < 30) return;
    let diff = Math.atan2(dy, dx) - this.spotlightAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > SPOTLIGHT.halfAngle) return;
    if (!lineOfSight(SPOTLIGHT.x, SPOTLIGHT.y, p.x, p.y, game.walls)) return;
    this.spotlightSees = true;
    // Standing in the beam is not instant doom: it feeds the alarm and
    // pulls the nearest guard to investigate, unless the thief sneaks.
    game.alarm.add((p.sneak ? 5 : 11) * dt, game);
    if (Math.random() < dt * 0.7) {
      let nearest = null;
      let best = Infinity;
      for (const g of game.guards) {
        if (!g.active) continue;
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        if (d < best) { best = d; nearest = g; }
      }
      if (nearest) nearest.hearNoise(p.x, p.y, 9999);
    }
  }

  updateReboot(dt, game) {
    if (this.rebootWindow > 0) {
      this.rebootWindow -= dt;
      if (this.rebootWindow <= 0) {
        game.flashMessage('Cameras are back online.', '#ffc53d');
      }
      return;
    }
    this.rebootTimer -= dt;
    if (this.rebootTimer <= 0) {
      this.rebootTimer = 80 + Math.random() * 40;
      this.rebootWindow = 6;
      this.eventsFired += 1;
      for (const c of game.cameras) c.disable(6);
      game.flashMessage('Camera system rebooting — feeds dark for 6s!', '#7fb0ff');
    }
  }

  updateChatter(dt, game) {
    if (this.chatterLife > 0) this.chatterLife -= dt;
    this.chatterTimer -= dt;
    if (this.chatterTimer > 0) return;
    this.chatterTimer = 9 + Math.random() * 8;
    const active = game.guards.filter((g) => g.active);
    if (!active.length) return;
    const g = active[Math.floor(Math.random() * active.length)];
    let pool = CHATTER.patrol;
    if (g.state === 'chase') pool = CHATTER.chase;
    else if (g.state === 'investigate') pool = CHATTER.investigate;
    else if (g.state === 'curious') pool = CHATTER.curious;
    if (game.cameras.some((c) => c.seesPlayer) && Math.random() < 0.4) pool = CHATTER.cameraSeen;
    this.chatterText = pickLine(pool, game.time * 7 + g.x);
    this.chatterSpeaker = g.name;
    this.chatterLife = 3.6;
  }

  drawSpotlight(ctx, cam) {
    const x = SPOTLIGHT.x - cam.x;
    const y = SPOTLIGHT.y - cam.y;
    if (x < -500 || y < -500 || x > 1780 || y > 1220) return;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, 20, x, y, SPOTLIGHT.range);
    grad.addColorStop(0, 'rgba(255,240,190,0.30)');
    grad.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, SPOTLIGHT.range, this.spotlightAngle - SPOTLIGHT.halfAngle, this.spotlightAngle + SPOTLIGHT.halfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Fixture
    ctx.fillStyle = '#39406b';
    ctx.fillRect(x - 14, y - 8, 28, 14);
    ctx.fillStyle = this.spotlightSees ? PALETTE.danger : '#ffe9a8';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 7);
    ctx.fill();
  }

  drawChatter(ctx) {
    if (this.chatterLife <= 0 || !this.chatterText) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.chatterLife);
    ctx.fillStyle = 'rgba(6,9,22,0.75)';
    const label = `📻 ${this.chatterSpeaker}: “${this.chatterText}”`;
    ctx.font = '13px system-ui, sans-serif';
    const w = ctx.measureText(label).width + 24;
    ctx.beginPath();
    ctx.roundRect(14, 66, w, 26, 7);
    ctx.fill();
    ctx.fillStyle = '#cfd8ff';
    ctx.fillText(label, 26, 83);
    ctx.restore();
  }
}
