// minimap.js — a small museum plan in the corner of the HUD.
// Shows rooms, un-looted exhibits, guards, cameras and the thief so a
// player can plan a route across all six areas at a glance.
import { WORLD_W, WORLD_H, VIEW_W, PALETTE, LOOT_QUOTA } from './config.js';
import { ROOMS, EXIT_ZONE } from './museum.js';

export const MINIMAP = {
  w: 196,
  h: 116,
  margin: 12,
};

function mapRect(game) {
  return {
    x: VIEW_W - MINIMAP.w - MINIMAP.margin,
    y: 68,
    w: MINIMAP.w,
    h: MINIMAP.h,
  };
}

function toMap(rect, wx, wy) {
  return {
    x: rect.x + (wx / WORLD_W) * rect.w,
    y: rect.y + (wy / WORLD_H) * rect.h,
  };
}

export function drawMinimap(ctx, game) {
  const rect = mapRect(game);
  ctx.save();
  ctx.fillStyle = 'rgba(5,8,20,0.78)';
  ctx.beginPath();
  ctx.roundRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 22, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,175,220,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rooms
  for (const room of ROOMS) {
    const a = toMap(rect, room.x, room.y);
    const b = toMap(rect, room.x + room.w, room.y + room.h);
    ctx.fillStyle = room.tint;
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.strokeStyle = 'rgba(140,160,220,0.4)';
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  }

  // Exit
  const ex = toMap(rect, EXIT_ZONE.x, EXIT_ZONE.y);
  const ex2 = toMap(rect, EXIT_ZONE.x + EXIT_ZONE.w, EXIT_ZONE.y + EXIT_ZONE.h);
  ctx.fillStyle = game.carriedValue >= LOOT_QUOTA ? '#57c785' : '#6b7699';
  ctx.fillRect(ex.x, ex.y, Math.max(3, ex2.x - ex.x), Math.max(3, ex2.y - ex.y));

  // Remaining loot as gold dots
  ctx.fillStyle = PALETTE.gold;
  for (const item of game.loot) {
    if (item.taken) continue;
    const p = toMap(rect, item.x, item.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, item.kind === 'crown' ? 3.2 : 2, 0, 7);
    ctx.fill();
  }

  // Cameras as blue dots
  ctx.fillStyle = '#7fb0ff';
  for (const c of game.cameras) {
    if (c.disabled) continue;
    const p = toMap(rect, c.x, c.y);
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }

  // Guards as red dots (alert guards pulse)
  for (const g of game.guards) {
    if (!g.active) continue;
    const p = toMap(rect, g.x, g.y);
    const alert = g.state === 'chase' || g.state === 'investigate';
    ctx.fillStyle = alert ? '#ff5a4e' : '#e08a7a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, alert ? 3 : 2.4, 0, 7);
    ctx.fill();
  }

  // The thief: a bright white-gold dot with a soft halo
  const tp = toMap(rect, game.player.x, game.player.y);
  const halo = ctx.createRadialGradient(tp.x, tp.y, 1, tp.x, tp.y, 9);
  halo.addColorStop(0, 'rgba(255,224,138,0.85)');
  halo.addColorStop(1, 'rgba(255,224,138,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(tp.x, tp.y, 9, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(tp.x, tp.y, 2.6, 0, 7);
  ctx.fill();

  ctx.fillStyle = PALETTE.muted;
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('MUSEUM PLAN', rect.x, rect.y + rect.h + 14);
  ctx.restore();
}
