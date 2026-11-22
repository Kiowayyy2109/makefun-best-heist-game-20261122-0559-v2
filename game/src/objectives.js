// objectives.js — the heist plan as a checklist of objectives.
// The HUD shows the current objective; completing steps ticks them off
// and the final step (escape) is what actually wins the run.
import { LOOT_QUOTA } from './config.js';

export const OBJECTIVE_DEFS = [
  {
    id: 'case-the-joint',
    title: 'Case the museum',
    hint: 'Visit 3 different areas',
    test: (game, tracker) => tracker.roomsVisited.size >= 3,
  },
  {
    id: 'first-score',
    title: 'First score',
    hint: 'Steal your first exhibit',
    test: (game) => game.carriedValue > 0,
  },
  {
    id: 'crack-a-case',
    title: 'Crack a case',
    hint: 'Open a glass display case (cutter is silent)',
    test: (game) => game.loot.some((l) => l.caseOpen || (l.cased && l.taken)),
  },
  {
    id: 'halfway',
    title: 'Halfway to quota',
    hint: `Reach $${Math.floor(LOOT_QUOTA / 2)} of loot`,
    test: (game) => game.carriedValue >= LOOT_QUOTA / 2,
  },
  {
    id: 'crown',
    title: 'The Crown Jewel',
    hint: 'Lift the Crown Jewel from the vault, past the lasers (optional, +$3,000)',
    optional: true,
    test: (game) => game.loot.some((l) => l.id === 'crown' && l.taken),
  },
  {
    id: 'quota',
    title: 'Fill the quota',
    hint: `Carry $${LOOT_QUOTA} of loot`,
    test: (game) => game.carriedValue >= LOOT_QUOTA,
  },
  {
    id: 'escape',
    title: 'Vanish into the night',
    hint: 'Reach the EXIT at the Entrance Hall doors',
    test: (game) => game.state === 'won',
  },
];

export class ObjectiveTracker {
  constructor() {
    this.done = new Set();
    this.roomsVisited = new Set();
    this.currentIndex = 0;
    this.justCompleted = null;
    this.justCompletedTimer = 0;
  }

  current() {
    // First not-done, non-optional objective; optional ones never block.
    for (const def of OBJECTIVE_DEFS) {
      if (def.optional) continue;
      if (!this.done.has(def.id)) return def;
    }
    return OBJECTIVE_DEFS[OBJECTIVE_DEFS.length - 1];
  }

  completedCount() {
    return OBJECTIVE_DEFS.filter((d) => this.done.has(d.id)).length;
  }

  update(dt, game) {
    if (this.justCompletedTimer > 0) this.justCompletedTimer -= dt;
    const room = game.roomName;
    if (room) this.roomsVisited.add(room);
    for (const def of OBJECTIVE_DEFS) {
      if (this.done.has(def.id)) continue;
      let ok = false;
      try { ok = def.test(game, this); } catch { ok = false; }
      if (ok) {
        this.done.add(def.id);
        this.justCompleted = def;
        this.justCompletedTimer = 3;
        if (!def.optional) {
          game.flashMessage(`Objective complete: ${def.title}`, '#8be28b');
        } else {
          game.flashMessage(`Bonus objective: ${def.title}!`, '#ffd700');
        }
      }
    }
  }

  draw(ctx, game) {
    const def = this.current();
    const x = 14;
    const y = 100;
    ctx.save();
    ctx.fillStyle = 'rgba(6,9,22,0.72)';
    ctx.beginPath();
    ctx.roundRect(x, y, 330, 52, 8);
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`OBJECTIVE ${this.completedCount()}/${OBJECTIVE_DEFS.length}`, x + 12, y + 18);
    ctx.fillStyle = '#eef1ff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(def.title, x + 12, y + 36);
    ctx.fillStyle = '#9aa6cc';
    ctx.font = '11px system-ui, sans-serif';
    const hint = def.hint.length > 52 ? def.hint.slice(0, 52) + '…' : def.hint;
    ctx.fillText(hint, x + 12, y + 49);
    ctx.restore();
    void game;
  }
}
