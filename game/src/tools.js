// tools.js — coin decoy, smoke bomb, lockpick, glass cutter, EMP.
import { TOOLS } from './config.js';

export class ToolBelt {
  constructor(audio) {
    this.audio = audio;
    this.counts = {};
    for (const t of TOOLS) this.counts[t.id] = t.count;
    this.selected = 'coin';
    this.pickTarget = null; // {kind:'door'|'loot', ref, progress, needed}
  }
  select(id) { if (this.counts[id] !== undefined) this.selected = id; }
  has(id) { return (this.counts[id] ?? 0) > 0; }
  use(id) { if (this.has(id)) { this.counts[id] -= 1; return true; } return false; }

  selectByKey(key) {
    const def = TOOLS.find((t) => t.key === key);
    if (def) { this.selected = def.id; return def; }
    return null;
  }

  // Coin: tossed to a world point; guards in radius investigate the clink.
  tossCoin(game, wx, wy) {
    if (this.selected !== 'coin') return false;
    if (!this.use('coin')) { game.flashMessage('No coins left!', '#ffc53d'); return false; }
    game.coinRipples.push({ x: wx, y: wy, r: 8, t: 1.6 });
    this.audio.coin();
    let heard = false;
    for (const g of game.guards) if (g.hearNoise(wx, wy, 230)) heard = true;
    game.flashMessage(heard ? 'Coin clink — a guard is investigating…' : 'Coin tossed.', '#eef1ff');
    return true;
  }

  dropSmoke(game) {
    if (!this.use('smoke')) { game.flashMessage('No smoke bombs left!', '#ffc53d'); return false; }
    game.smokeClouds.push({ x: game.player.x, y: game.player.y, r: 120, t: 7 });
    this.audio.smoke();
    game.flashMessage('Smoke bomb! Sight blocked.', '#eef1ff');
    return true;
  }

  fireEMP(game) {
    if (!this.use('emp')) { game.flashMessage('No EMP charges left!', '#ffc53d'); return false; }
    for (const c of game.cameras) c.disable(10);
    game.lasers.disabledTimer = Math.max(game.lasers.disabledTimer, 4);
    this.audio.emp();
    game.flashMessage('EMP pulse — cameras dark for 10s!', '#7fb0ff');
    return true;
  }

  // Generic hold-to-pick flow used for locked doors, safes and cased loot
  // when the glass cutter is not selected.
  updatePick(dt, game, target) {
    if (!target) { this.pickTarget = null; return false; }
    if (!this.pickTarget || this.pickTarget.ref !== target.ref) {
      this.pickTarget = { ...target, progress: 0 };
    }
    const pt = this.pickTarget;
    pt.progress += dt;
    if (Math.floor(pt.progress * 8) !== Math.floor((pt.progress - dt) * 8)) this.audio.lockpickTick();
    if (pt.progress >= pt.needed) {
      this.pickTarget = null;
      this.audio.lockOpen();
      return true; // completed this frame
    }
    return false;
  }
  pickFraction() {
    if (!this.pickTarget) return 0;
    return Math.min(1, this.pickTarget.progress / this.pickTarget.needed);
  }
  cancelPick() { this.pickTarget = null; }
}
