// cameras.js — fixed and sweeping security cameras + EMP / panel control.
import { CAMERA } from './config.js';
import { lineOfSight } from './museum.js';

export const CAMERA_DEFS = [
  { id: 'cam-entrance', x: 1280, y: 730, baseAngle: Math.PI / 2, sweep: 0.7, name: 'Entrance Cam' },
  { id: 'cam-paintings', x: 420, y: 730, baseAngle: Math.PI / 2, sweep: 0.9, name: 'Paintings Cam' },
  { id: 'cam-court', x: 1280, y: 70, baseAngle: Math.PI / 2, sweep: 0.8, name: 'Court Cam' },
  { id: 'cam-vault', x: 2140, y: 70, baseAngle: Math.PI / 2, sweep: 0.55, name: 'Vault Cam' },
  { id: 'cam-gift', x: 2140, y: 730, baseAngle: Math.PI / 2, sweep: 0.85, name: 'Gift Cam' },
  { id: 'cam-lab', x: 420, y: 70, baseAngle: Math.PI / 2, sweep: 0.75, name: 'Lab Cam' },
];

export class SecurityCamera {
  constructor(def) {
    Object.assign(this, def);
    this.angle = def.baseAngle;
    this.disabledTimer = 0;
    this.seesPlayer = false;
    this.phase = def.x * 0.01 + def.y * 0.013;
  }
  get disabled() { return this.disabledTimer > 0; }
  update(dt, game) {
    if (this.disabledTimer > 0) { this.disabledTimer -= dt; this.seesPlayer = false; return; }
    this.angle = this.baseAngle + Math.sin(game.time * CAMERA.sweepSpeed + this.phase) * this.sweep;
    const p = game.player;
    const dx = p.x - this.x; const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.seesPlayer = false;
    if (dist > CAMERA.visionRange) return;
    let diff = Math.atan2(dy, dx) - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > CAMERA.visionHalfAngle) return;
    if (!lineOfSight(this.x, this.y, p.x, p.y, game.walls)) return;
    for (const s of game.smokeClouds) if (s.t > 0 && Math.hypot(p.x - s.x, p.y - s.y) < s.r) return;
    this.seesPlayer = true;
    game.alarm.add(13 * dt * (p.sneak ? 0.6 : 1), game);
  }
  disable(seconds) { this.disabledTimer = Math.max(this.disabledTimer, seconds); }
}

export function createCameras() { return CAMERA_DEFS.map((d) => new SecurityCamera(d)); }
export function anyCameraSees(cameras) { return cameras.some((c) => c.seesPlayer); }

// Control panels: standing at a panel and pressing E disables nearby cameras.
export const PANELS = [
  { id: 'panel-entrance', x: 900, y: 760, range: 700, name: 'Security Panel (Entrance)' },
  { id: 'panel-lab', x: 120, y: 120, range: 1500, name: 'Security Panel (Lab)' },
];
