// shots.js — deterministic screenshot staging via ?scene=cover|action|vault|getaway
// Positions the thief, guards, cameras and alarm into readable tableaux.
// The normal game never uses this unless a scene param is present.
export function sceneFromUrl() {
  try {
    const s = new URLSearchParams(window.location.search).get('scene');
    return ['cover', 'action', 'vault', 'getaway'].includes(s) ? s : null;
  } catch { return null; }
}

export function applyScene(game, scene) {
  game.freeze = true;
  game.state = 'playing';
  const p = game.player;
  if (scene === 'cover') {
    p.x = 1280; p.y = 1180; p.angle = -Math.PI / 2;
    // Framing tuned after reviewing the first render: y=700 keeps both
    // the thief and the EXIT sign fully clear of the bottom tool bar.
    game.camera.x = 640; game.camera.y = 700;
    game.alarm.meter = 12; game.alarm.levelIndex = 0;
    // A guard patrols the hall behind the thief, cone visible.
    const g = game.guards[0];
    g.x = 1080; g.y = 1010; g.angle = 0.5; g.state = 'patrol';
    game.time = 2;
  } else if (scene === 'action') {
    // Paintings Wing edge / Entrance Hall: thief mid-room, guard cone,
    // camera cone, loot target and alarm meter all in one frame.
    p.x = 1120; p.y = 1010; p.angle = -0.6; p.sneak = false;
    game.camera.x = 520; game.camera.y = 640;
    const g = game.guards[0];
    g.x = 1330; g.y = 930; g.angle = Math.PI * 0.82; g.state = 'curious'; g.suspicion = 58;
    const g2 = game.guards[1];
    g2.x = 620; g2.y = 1180; g2.angle = -0.4;
    game.cameras[0].angle = 0.9;
    game.cameras[0].seesPlayer = true;
    game.alarm.meter = 47; game.alarm.levelIndex = 1;
    game.carriedValue = 2100;
    const clock = game.loot.find((l) => l.id === 'hall-clock');
    if (clock) { /* clock stays as the visible loot target near the thief */ }
    game.flashText = 'Guard suspicious — stay out of the light!';
    game.flashTimer = 99;
    game.time = 3;
  } else if (scene === 'vault') {
    p.x = 2050; p.y = 430; p.angle = 0.4;
    game.camera.x = 1280; game.camera.y = 40;
    const g = game.guards[5];
    g.x = 2320; g.y = 500; g.angle = Math.PI; g.state = 'patrol';
    game.cameras[3].angle = Math.PI / 2;
    game.alarm.meter = 24; game.alarm.levelIndex = 0;
    game.carriedValue = 3600;
    game.time = 1.2; // lasers on
  } else if (scene === 'getaway') {
    p.x = 1280; p.y = 1335; p.angle = Math.PI / 2;
    game.camera.x = 640; game.camera.y = 720;
    const g = game.guards[0];
    g.x = 1420; g.y = 1120; g.angle = Math.PI / 2; g.state = 'chase'; g.suspicion = 100;
    game.guards[6].active = true;
    game.guards[6].x = 1080; game.guards[6].y = 1120; game.guards[6].angle = Math.PI / 2;
    game.alarm.meter = 78; game.alarm.levelIndex = 2;
    game.carriedValue = 6400;
    game.flashText = 'Quota reached — GET TO THE EXIT!';
    game.flashTimer = 99;
    game.time = 4;
  }
  // Keep cones computed for the staged frame.
  for (const g of game.guards) if (g.active) g.seesPlayer = (scene === 'action' && g === game.guards[0]);
}
