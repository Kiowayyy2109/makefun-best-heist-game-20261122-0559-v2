// museum.js — layout: 6 areas, walls, doors, vents, props, lights.
// World is 2560x1440. Each area has at least two routes in/out:
// a normal door plus a vent or a service-corridor gap.
import { WORLD_W, WORLD_H } from './config.js';

export const ROOMS = [
  { id: 'lab', name: 'RESTORATION LAB', x: 40, y: 40, w: 760, h: 620, tint: '#1d2a4a' },
  { id: 'court', name: 'SCULPTURE COURT', x: 840, y: 40, w: 880, h: 620, tint: '#1a2340' },
  { id: 'vault', name: 'JEWELS VAULT', x: 1760, y: 40, w: 760, h: 620, tint: '#241f3d' },
  { id: 'paintings', name: 'PAINTINGS WING', x: 40, y: 700, w: 760, h: 700, tint: '#1c2547' },
  { id: 'entrance', name: 'ENTRANCE HALL', x: 840, y: 700, w: 880, h: 700, tint: '#1a2340' },
  { id: 'gift', name: 'GIFT SHOP', x: 1760, y: 700, w: 760, h: 700, tint: '#1e2a44' },
];

function seg(list, x, y, w, h) { if (w > 0 && h > 0) list.push({ x, y, w, h }); }

// Build a wall line with gaps. axis 'v': wall at x, spanning y0..y1, gaps [{from,to}]
function vWall(list, x, y0, y1, gaps, t = 24) {
  let cur = y0;
  const sorted = [...gaps].sort((a, b) => a.from - b.from);
  for (const g of sorted) { seg(list, x, cur, t, g.from - cur); cur = g.to; }
  seg(list, x, cur, t, y1 - cur);
}
function hWall(list, y, x0, x1, gaps, t = 24) {
  let cur = x0;
  const sorted = [...gaps].sort((a, b) => a.from - b.from);
  for (const g of sorted) { seg(list, cur, y, g.from - cur, t); cur = g.to; }
  seg(list, cur, y, x1 - cur, t);
}

export function buildWalls() {
  const w = [];
  // Outer border (exit gap at bottom centre of Entrance Hall)
  hWall(w, 0, 0, WORLD_W, []);
  hWall(w, WORLD_H - 24, 0, WORLD_W, [{ from: 1220, to: 1340 }]);
  vWall(w, 0, 0, WORLD_H, []);
  vWall(w, WORLD_W - 24, 0, WORLD_H, []);
  // Vertical dividers top row: x=800 (lab|court), x=1720 (court|vault)
  vWall(w, 800, 0, 660, [{ from: 300, to: 380 }, { from: 540, to: 600 }]); // door + vent
  vWall(w, 1720, 0, 660, [{ from: 260, to: 340 }, { from: 520, to: 580 }]);
  // Vertical dividers bottom row
  vWall(w, 800, 700, WORLD_H, [{ from: 980, to: 1060 }, { from: 1240, to: 1300 }]);
  vWall(w, 1720, 700, WORLD_H, [{ from: 940, to: 1020 }, { from: 1220, to: 1280 }]);
  // Horizontal divider y=660..700 (two rows)
  hWall(w, 660, 0, 840, [{ from: 360, to: 440 }, { from: 640, to: 700 }], 40);
  hWall(w, 660, 840, 1760, [{ from: 1180, to: 1260 }, { from: 1520, to: 1580 }], 40);
  hWall(w, 660, 1760, WORLD_W, [{ from: 2040, to: 2120 }, { from: 2320, to: 2380 }], 40);
  // Vault inner cage around Crown Jewel (laser field inside, gaps at south)
  hWall(w, 180, 1900, 2380, [{ from: 2110, to: 2170 }], 16);
  vWall(w, 1900, 180, 520, [{ from: 330, to: 390 }], 16);
  vWall(w, 2380, 180, 520, [{ from: 330, to: 390 }], 16);
  hWall(w, 520, 1900, 2380, [{ from: 2110, to: 2170 }], 16);
  // Interior props that block movement / sight (plinths, counters, shelves)
  const props = [
    // Sculpture Court plinths
    { x: 1020, y: 220, w: 90, h: 90 }, { x: 1240, y: 180, w: 90, h: 90 },
    { x: 1460, y: 220, w: 90, h: 90 }, { x: 1130, y: 430, w: 90, h: 90 },
    { x: 1360, y: 430, w: 90, h: 90 },
    // Paintings Wing benches
    { x: 300, y: 1020, w: 180, h: 44 }, { x: 300, y: 1220, w: 180, h: 44 },
    // Restoration Lab benches
    { x: 180, y: 260, w: 220, h: 48 }, { x: 460, y: 260, w: 220, h: 48 },
    { x: 320, y: 470, w: 220, h: 48 },
    // Gift Shop counters / shelves
    { x: 1900, y: 900, w: 220, h: 48 }, { x: 2240, y: 900, w: 220, h: 48 },
    { x: 1900, y: 1180, w: 220, h: 48 }, { x: 2240, y: 1180, w: 220, h: 48 },
    // Entrance Hall pillars
    { x: 1020, y: 900, w: 56, h: 56 }, { x: 1480, y: 900, w: 56, h: 56 },
    { x: 1020, y: 1200, w: 56, h: 56 }, { x: 1480, y: 1200, w: 56, h: 56 },
    // Vault side cases blockers
    { x: 1830, y: 560, w: 120, h: 40 }, { x: 2330, y: 560, w: 120, h: 40 },
  ];
  for (const p of props) w.push({ ...p, prop: true });
  return w;
}

export const VENTS = [
  { x: 800, y: 540, w: 24, h: 60, label: 'vent' },
  { x: 1720, y: 520, w: 24, h: 60, label: 'vent' },
  { x: 800, y: 1240, w: 24, h: 60, label: 'vent' },
  { x: 1720, y: 1220, w: 24, h: 60, label: 'vent' },
  { x: 640, y: 660, w: 60, h: 40, label: 'vent' },
  { x: 1520, y: 660, w: 60, h: 40, label: 'vent' },
  { x: 2320, y: 660, w: 60, h: 40, label: 'vent' },
];

export const DOORS = [
  // Locked doors need lockpick (hold E). Unlocked doors are plain gaps.
  { id: 'vault-door', x: 2110, y: 520, w: 60, h: 16, locked: true, pickSeconds: 3.2, name: 'Vault Cage Door' },
  { id: 'lab-safe-door', x: 360, y: 660, w: 80, h: 40, locked: true, pickSeconds: 2.4, name: 'Lab Service Door' },
  { id: 'gift-safe-door', x: 2040, y: 660, w: 80, h: 40, locked: false, pickSeconds: 0, name: 'Gift Shop Door' },
];

export const LIGHTS = [];
for (const r of ROOMS) {
  LIGHTS.push({ x: r.x + r.w * 0.3, y: r.y + r.h * 0.35, r: 260 });
  LIGHTS.push({ x: r.x + r.w * 0.7, y: r.y + r.h * 0.65, r: 260 });
}
LIGHTS.push({ x: 2140, y: 350, r: 300 }); // vault glow

export const EXIT_ZONE = { x: 1220, y: 1360, w: 120, h: 80, name: 'EXIT' };

// Decorative, non-blocking set dressing: rugs, rope barriers, plaques,
// benches and potted palms. Drawn under the actors, over the floor.
export const DECOR = [
  // Entrance Hall — a long red runner from the door to the hall centre.
  { kind: 'rug', x: 1180, y: 760, w: 200, h: 560, color: '#4a1f2b' },
  { kind: 'rope', x: 1000, y: 820, w: 560, h: 10 },
  { kind: 'palm', x: 920, y: 780 }, { kind: 'palm', x: 1620, y: 780 },
  { kind: 'palm', x: 920, y: 1330 }, { kind: 'palm', x: 1620, y: 1330 },
  { kind: 'plaque', x: 1280, y: 745, text: 'NIGHT AT THE MUSEUM' },
  // Sculpture Court — circular rug under the statues.
  { kind: 'rugRound', x: 1280, y: 350, r: 210, color: '#24365e' },
  { kind: 'rope', x: 980, y: 600, w: 600, h: 10 },
  // Paintings Wing — viewing benches are props; add rug + plaques.
  { kind: 'rug', x: 240, y: 900, w: 320, h: 480, color: '#2b2340' },
  { kind: 'plaque', x: 140, y: 760, text: 'NOCTURNES' },
  { kind: 'plaque', x: 660, y: 760, text: 'GILDED AGE' },
  // Jewels Vault — dark rug so the laser grid reads against it.
  { kind: 'rug', x: 1860, y: 120, w: 560, h: 480, color: '#171233' },
  { kind: 'plaque', x: 2140, y: 90, text: 'THE CROWN COLLECTION' },
  // Restoration Lab — work rug and warning stripe.
  { kind: 'rug', x: 160, y: 160, w: 480, h: 420, color: '#22331f' },
  { kind: 'plaque', x: 420, y: 90, text: 'STAFF ONLY' },
  // Gift Shop — cheerful rug by the tills.
  { kind: 'rug', x: 1980, y: 1000, w: 360, h: 300, color: '#3d2b18' },
  { kind: 'plaque', x: 2140, y: 745, text: 'GIFTS' },
];

export function decorInRoom(roomId) {
  // Helper kept for future per-room decor queries from the renderer.
  void roomId;
  return DECOR;
}
export const PLAYER_START = { x: 1280, y: 1310 };

export function roomAt(x, y) {
  return ROOMS.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) || null;
}

export function circleHitsWalls(x, y, radius, walls) {
  for (const s of walls) {
    const nx = Math.max(s.x, Math.min(x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - nx; const dy = y - ny;
    if (dx * dx + dy * dy < radius * radius) return s;
  }
  return null;
}

export function moveCircle(pos, dx, dy, radius, walls) {
  // Axis-separated movement so the thief slides along walls.
  let nx = pos.x + dx;
  if (!circleHitsWalls(nx, pos.y, radius, walls)) pos.x = nx;
  let ny = pos.y + dy;
  if (!circleHitsWalls(pos.x, ny, radius, walls)) pos.y = ny;
  pos.x = Math.max(radius, Math.min(WORLD_W - radius, pos.x));
  pos.y = Math.max(radius, Math.min(WORLD_H - radius, pos.y));
  return pos;
}

// Segment vs rect intersection, used for vision occlusion.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  // If either endpoint is inside, it hits.
  const inside = (x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  if (inside(x1, y1) || inside(x2, y2)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y],
  ];
  return edges.some(([ax, ay, bx, by]) => segmentsCross(x1, y1, x2, y2, ax, ay, bx, by));
}
export function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = dir(cx, cy, dx, dy, ax, ay);
  const d2 = dir(cx, cy, dx, dy, bx, by);
  const d3 = dir(ax, ay, bx, by, cx, cy);
  const d4 = dir(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
function dir(ax, ay, bx, by, px, py) { return (px - ax) * (by - ay) - (bx - ax) * (py - ay); }

export function lineOfSight(x1, y1, x2, y2, walls, ignoreProps = false) {
  for (const s of walls) {
    if (ignoreProps && s.prop) continue;
    // Shrink walls slightly so grazing a corner does not block unfairly.
    const r = { x: s.x + 2, y: s.y + 2, w: s.w - 4, h: s.h - 4 };
    if (r.w > 0 && r.h > 0 && segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}
