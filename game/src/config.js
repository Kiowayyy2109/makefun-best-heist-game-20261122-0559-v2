// config.js — constants, palette and tuning for The Midnight Gallery.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WORLD_W = 2560;
export const WORLD_H = 1440;
export const TILE = 40;

export const PALETTE = {
  night: '#0b1026',
  floor: '#1a2340',
  floorAlt: '#202a4d',
  marbleLine: 'rgba(180,200,255,0.07)',
  wall: '#2e3a63',
  wallTop: '#46548a',
  wallShadow: 'rgba(0,0,0,0.45)',
  gold: '#f2c14e',
  goldBright: '#ffe08a',
  ruby: '#e5484d',
  emerald: '#46a758',
  sapphire: '#4f7cff',
  warmLight: 'rgba(255,196,96,0.16)',
  warmCore: 'rgba(255,214,130,0.28)',
  laser: '#ff2d3f',
  laserGlow: 'rgba(255,45,63,0.35)',
  coneGuard: 'rgba(255,220,120,0.20)',
  coneGuardAlert: 'rgba(255,90,80,0.28)',
  coneCamera: 'rgba(120,180,255,0.16)',
  smoke: 'rgba(200,205,220,0.55)',
  text: '#eef1ff',
  muted: '#9aa6cc',
  danger: '#ff5a4e',
  caution: '#ffc53d',
  calm: '#57c785',
};

export const PLAYER = {
  radius: 13,
  walkSpeed: 168,
  sneakSpeed: 92,
  carrySlowPerKg: 7,
  noiseWalk: 46,
  noiseSneak: 10,
  noiseRun: 46,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 72,
  investigateSpeed: 108,
  chaseSpeed: 178,
  visionRange: 235,
  visionHalfAngle: 0.62,
  catchDistance: 26,
  suspicionSee: 62,
  suspicionNear: 110,
  suspicionDecay: 16,
};

export const CAMERA = {
  visionRange: 215,
  visionHalfAngle: 0.46,
  sweepSpeed: 0.55,
};

export const ALARM = {
  max: 100,
  risePerSecondSeen: 21,
  riseCamera: 13,
  decayPerSecond: 3.2,
  glassBreak: 26,
  laserTrip: 34,
  noiseLoud: 9,
};

export const ALARM_LEVELS = [
  { name: 'CALM', min: 0, color: PALETTE.calm, guardSpeedMul: 1, extraGuards: 0 },
  { name: 'NOTICED', min: 30, color: PALETTE.caution, guardSpeedMul: 1.12, extraGuards: 0 },
  { name: 'ALARM', min: 62, color: '#ff8a3d', guardSpeedMul: 1.3, extraGuards: 1 },
  { name: 'LOCKDOWN', min: 92, color: PALETTE.danger, guardSpeedMul: 1.42, extraGuards: 1 },
];

export const LOOT_QUOTA = 5200;
export const LOCKDOWN_SECONDS = 45;

export const TOOLS = [
  { id: 'coin', name: 'Coin Decoy', key: '1', count: 4, hint: 'click a floor point to toss' },
  { id: 'smoke', name: 'Smoke Bomb', key: '2', count: 2, hint: 'blocks sight for 7s' },
  { id: 'lockpick', name: 'Lockpick', key: '3', count: 99, hint: 'hold E at locked door / case' },
  { id: 'cutter', name: 'Glass Cutter', key: '4', count: 3, hint: 'silent case opening' },
  { id: 'emp', name: 'EMP Pulse', key: '5', count: 2, hint: 'cameras off for 10s' },
];

export const CONTROLS_TEXT = [
  'WASD / Arrows — move',
  'Shift — sneak (quiet, slower)',
  'E — interact / steal / pick (hold)',
  '1 Coin · 2 Smoke · 3 Lockpick · 4 Cutter · 5 EMP',
  'Mouse click — toss coin at point (tool 1 selected)',
  'M — mute · R — restart',
];
