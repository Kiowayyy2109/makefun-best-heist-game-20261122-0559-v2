// lasers.js — pulsing laser grid guarding the Crown Jewel.
export class LaserGrid {
  constructor() {
    // Vertical beams inside the vault cage, x positions, plus one horizontal.
    this.beams = [];
    for (let i = 0; i < 4; i++) {
      this.beams.push({ vertical: true, at: 1985 + i * 105, from: 196, to: 504, phase: i * 0.9 });
    }
    this.beams.push({ vertical: false, at: 350, from: 1916, to: 2364, phase: 0.4 });
    this.cycle = 3.6; // seconds per pulse cycle
    this.disabledTimer = 0;
    this.tripCooldown = 0;
  }
  beamOn(beam, time) {
    if (this.disabledTimer > 0) return false;
    const ph = ((time + beam.phase) % this.cycle) / this.cycle;
    return ph < 0.62; // on 62% of the cycle, off in a readable window
  }
  update(dt, game) {
    if (this.disabledTimer > 0) this.disabledTimer -= dt;
    if (this.tripCooldown > 0) this.tripCooldown -= dt;
    if (this.tripCooldown > 0 || game.state !== 'playing') return;
    const p = game.player;
    for (const b of this.beams) {
      if (!this.beamOn(b, game.time)) continue;
      const crossed = b.vertical
        ? Math.abs(p.x - b.at) < 13 && p.y > b.from && p.y < b.to
        : Math.abs(p.y - b.at) < 13 && p.x > b.from && p.x < b.to;
      if (crossed) {
        this.tripCooldown = 2.5;
        game.alarm.add(34, game);
        game.audio.glassBreak();
        game.flashMessage('LASER TRIPPED! Alarm rising!', '#ff5a4e');
        for (const g of game.guards) g.hearNoise(p.x, p.y, 500);
        break;
      }
    }
  }
}
