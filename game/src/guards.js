// guards.js — waypoint patrols, raycast vision cones, suspicion states.
import { GUARD } from './config.js';
import { lineOfSight, moveCircle } from './museum.js';

export const GUARD_PATROLS = [
  { name: 'Guard A', waypoints: [[1100, 1050], [1560, 1050], [1560, 820], [1100, 820]] },
  { name: 'Guard B', waypoints: [[220, 900], [620, 900], [620, 1280], [220, 1280]] },
  { name: 'Guard C', waypoints: [[1000, 340], [1580, 340], [1580, 560], [1000, 560]] },
  { name: 'Guard D', waypoints: [[1980, 1080], [2360, 1080], [2360, 820], [1980, 820]] },
  { name: 'Guard E', waypoints: [[220, 380], [620, 380], [620, 140], [220, 140]] },
  { name: 'Guard F', waypoints: [[1880, 480], [2400, 480], [2400, 140], [2140, 140]] },
  // Reinforcement that only activates at ALARM level.
  { name: 'Guard G', waypoints: [[1280, 760], [900, 760], [900, 1320], [1660, 1320], [1660, 760]], reinforcement: true },
];

export class Guard {
  constructor(def, index) {
    this.name = def.name;
    this.waypoints = def.waypoints;
    this.reinforcement = !!def.reinforcement;
    this.active = !this.reinforcement;
    this.x = def.waypoints[0][0]; this.y = def.waypoints[0][1];
    this.wpIndex = index % def.waypoints.length;
    this.angle = 0;
    this.state = 'patrol'; // patrol | curious | investigate | chase | return
    this.suspicion = 0;
    this.lastSeen = null;
    this.investigateTimer = 0;
    this.waitTimer = 0;
    this.seesPlayer = false;
    this.radius = GUARD.radius;
    this.stunTimer = 0;
  }
  targetWaypoint() { return this.waypoints[this.wpIndex]; }
  advanceWaypoint() { this.wpIndex = (this.wpIndex + 1) % this.waypoints.length; }

  canSee(px, py, walls, smokeClouds, darkFactor = 1) {
    const dx = px - this.x; const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    const range = GUARD.visionRange * darkFactor;
    if (dist > range) { this.seesPlayer = false; return 0; }
    let diff = Math.atan2(dy, dx) - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > GUARD.visionHalfAngle && dist > 42) { this.seesPlayer = false; return 0; }
    if (!lineOfSight(this.x, this.y, px, py, walls)) { this.seesPlayer = false; return 0; }
    for (const s of smokeClouds) {
      if (s.t > 0 && Math.hypot(px - s.x, py - s.y) < s.r) { this.seesPlayer = false; return 0; }
      if (s.t > 0 && Math.hypot(this.x - s.x, this.y - s.y) < s.r) { this.seesPlayer = false; return 0; }
    }
    this.seesPlayer = true;
    // Strength: closer + more central = faster suspicion.
    const closeness = 1 - dist / range;
    const centred = 1 - Math.abs(diff) / GUARD.visionHalfAngle;
    return 0.35 + closeness * 0.45 + centred * 0.35;
  }

  hearNoise(x, y, radius) {
    if (!this.active || this.state === 'chase') return false;
    if (Math.hypot(x - this.x, y - this.y) <= radius + 60) {
      this.lastSeen = { x, y };
      this.state = 'investigate';
      this.suspicion = Math.max(this.suspicion, 55);
      this.investigateTimer = 0;
      return true;
    }
    return false;
  }

  update(dt, game) {
    if (!this.active) { this.seesPlayer = false; return; }
    const player = game.player;
    const speedMul = game.alarm.level().guardSpeedMul;
    const sight = this.canSee(player.x, player.y, game.walls, game.smokeClouds, player.sneak ? 0.72 : 1);
    if (sight > 0) {
      const rate = (player.sneak ? GUARD.suspicionSee * 0.55 : GUARD.suspicionSee) * sight;
      this.suspicion += rate * dt * (Math.hypot(player.x - this.x, player.y - this.y) < 90 ? 1.7 : 1);
      this.lastSeen = { x: player.x, y: player.y };
      if (this.suspicion >= 100) {
        if (this.state !== 'chase') game.audio.spotted();
        this.state = 'chase';
      } else if (this.suspicion > 35) {
        this.state = 'curious';
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD.suspicionDecay * dt);
      if (this.state === 'curious' && this.suspicion <= 30 && this.lastSeen) this.state = 'investigate';
    }

    let speed = 0; let tx = null; let ty = null;
    if (this.state === 'chase') {
      speed = GUARD.chaseSpeed * speedMul;
      tx = player.x; ty = player.y;
      if (sight === 0 && this.suspicion < 55) { this.state = 'investigate'; this.investigateTimer = 0; }
      if (Math.hypot(player.x - this.x, player.y - this.y) < GUARD.catchDistance) {
        game.lose(`${this.name} caught you in the act.`);
      }
    } else if (this.state === 'investigate' || this.state === 'curious') {
      speed = (this.state === 'curious' ? GUARD.patrolSpeed : GUARD.investigateSpeed) * speedMul;
      if (this.lastSeen) { tx = this.lastSeen.x; ty = this.lastSeen.y; }
      this.investigateTimer += dt;
      if (tx !== null && Math.hypot(tx - this.x, ty - this.y) < 18) {
        this.waitTimer += dt;
        speed = 0;
        // Look around while investigating.
        this.angle += Math.sin(game.time * 1.7 + this.x) * dt * 1.4;
        if (this.waitTimer > 2.2 || this.investigateTimer > 7) {
          this.state = 'return'; this.waitTimer = 0; this.lastSeen = null;
          this.suspicion = Math.min(this.suspicion, 25);
        }
      }
    } else {
      // patrol or return: head to nearest waypoint, then follow the loop.
      speed = GUARD.patrolSpeed * speedMul;
      const wp = this.targetWaypoint();
      tx = wp[0]; ty = wp[1];
      if (Math.hypot(tx - this.x, ty - this.y) < 16) {
        if (this.state === 'return') this.state = 'patrol';
        this.advanceWaypoint();
      }
    }
    if (tx !== null && speed > 0) {
      const dx = tx - this.x; const dy = ty - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = Math.min(dist, speed * dt);
      const wantAngle = Math.atan2(dy, dx);
      let diff = wantAngle - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * Math.min(1, dt * 7);
      const pos = { x: this.x, y: this.y };
      moveCircle(pos, (dx / dist) * step, (dy / dist) * step, this.radius, game.walls);
      // If blocked by a wall, try sliding the other axis by nudging waypoint.
      if (Math.hypot(pos.x - this.x, pos.y - this.y) < step * 0.25 && dist > 30) this.advanceWaypoint();
      this.x = pos.x; this.y = pos.y;
    }
  }
}

export function createGuards() { return GUARD_PATROLS.map((d, i) => new Guard(d, i)); }
export function anyGuardSees(guards) { return guards.some((g) => g.active && g.seesPlayer); }
