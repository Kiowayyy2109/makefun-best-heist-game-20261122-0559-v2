// loot.js — tiered loot, cases, weight and quota.
export const LOOT_DEFS = [
  // Paintings Wing
  { id: 'paint-blue', name: 'Blue Nocturne', kind: 'painting', x: 140, y: 820, value: 900, kg: 2, room: 'paintings' },
  { id: 'paint-gold', name: 'Gilded Coast', kind: 'painting', x: 420, y: 790, value: 1200, kg: 2, room: 'paintings' },
  { id: 'paint-red', name: 'Crimson Study', kind: 'painting', x: 680, y: 840, value: 1050, kg: 2, room: 'paintings' },
  { id: 'paint-small', name: 'Miniature Moon', kind: 'painting', x: 180, y: 1330, value: 650, kg: 1, room: 'paintings' },
  // Sculpture Court (heavy statues slow the thief)
  { id: 'statue-bronze', name: 'Bronze Herald', kind: 'statue', x: 1065, y: 265, value: 1500, kg: 9, room: 'court' },
  { id: 'statue-marble', name: 'Marble Muse', kind: 'statue', x: 1285, y: 225, value: 1700, kg: 11, room: 'court' },
  { id: 'statue-onyx', name: 'Onyx Dancer', kind: 'statue', x: 1505, y: 265, value: 1400, kg: 8, room: 'court' },
  // Jewels Vault — cased jewellery + the Crown Jewel behind lasers
  { id: 'gem-ruby', name: 'Ruby Tiara', kind: 'jewel', cased: true, x: 1890, y: 580, value: 1600, kg: 1, room: 'vault' },
  { id: 'gem-sapphire', name: 'Sapphire Brooch', kind: 'jewel', cased: true, x: 2390, y: 580, value: 1500, kg: 1, room: 'vault' },
  { id: 'gem-emerald', name: 'Emerald Chain', kind: 'jewel', cased: true, x: 2140, y: 120, value: 1450, kg: 1, room: 'vault' },
  { id: 'crown', name: 'CROWN JEWEL', kind: 'crown', cased: false, x: 2140, y: 350, value: 3000, kg: 3, room: 'vault' },
  // Restoration Lab
  { id: 'lab-vase', name: 'Restored Vase', kind: 'vase', x: 290, y: 284, value: 800, kg: 3, room: 'lab' },
  { id: 'lab-mask', name: 'Golden Mask', kind: 'jewel', cased: true, x: 570, y: 284, value: 1350, kg: 1, room: 'lab' },
  { id: 'lab-coins', name: 'Ancient Coin Hoard', kind: 'coins', x: 430, y: 494, value: 700, kg: 2, room: 'lab' },
  // Gift Shop safe + stock
  { id: 'gift-safe', name: 'Gift Shop Takings', kind: 'cash', locked: true, pickSeconds: 2.6, x: 2140, y: 790, value: 1100, kg: 2, room: 'gift' },
  { id: 'gift-replica', name: 'Replica Crown', kind: 'jewel', x: 2010, y: 924, value: 450, kg: 1, room: 'gift' },
  { id: 'gift-gems', name: 'Souvenir Gems', kind: 'coins', x: 2350, y: 1204, value: 400, kg: 1, room: 'gift' },
  // Entrance Hall
  { id: 'hall-clock', name: 'Astral Clock', kind: 'vase', x: 1280, y: 790, value: 950, kg: 4, room: 'entrance' },
];

export function createLoot() {
  return LOOT_DEFS.map((d) => ({ ...d, taken: false, caseOpen: false, pickProgress: 0 }));
}
export function lootValueTaken(loot) { return loot.filter((l) => l.taken).reduce((s, l) => s + l.value, 0); }
export function lootWeightTaken(loot) { return loot.filter((l) => l.taken).reduce((s, l) => s + l.kg, 0); }
export function nearestLoot(loot, x, y, maxDist = 52) {
  let best = null; let bestD = maxDist;
  for (const l of loot) {
    if (l.taken) continue;
    const d = Math.hypot(l.x - x, l.y - y);
    if (d < bestD) { bestD = d; best = l; }
  }
  return best;
}
export const LOOT_COLORS = {
  painting: '#7fb0ff', statue: '#d8c9a3', jewel: '#ffe08a', crown: '#ffd700',
  vase: '#7fe0c3', coins: '#f2c14e', cash: '#8be28b',
};

// Value tiers drive the label colour and the sparkle intensity, so a
// player can tell at a glance what is worth the risk of a detour.
export const LOOT_TIERS = [
  { id: 'legendary', min: 2500, label: 'LEGENDARY', color: '#ffd700' },
  { id: 'major', min: 1300, label: 'MAJOR', color: '#ffe08a' },
  { id: 'standard', min: 700, label: 'STANDARD', color: '#cfd8ff' },
  { id: 'minor', min: 0, label: 'MINOR', color: '#9aa6cc' },
];

export function lootTier(item) {
  for (const tier of LOOT_TIERS) {
    if (item.value >= tier.min) return tier;
  }
  return LOOT_TIERS[LOOT_TIERS.length - 1];
}

export function totalLootValue() {
  return LOOT_DEFS.reduce((sum, d) => sum + d.value, 0);
}

export function lootByRoom(roomId) {
  return LOOT_DEFS.filter((d) => d.room === roomId);
}
