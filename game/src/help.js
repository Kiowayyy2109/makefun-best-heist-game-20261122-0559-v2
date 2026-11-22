// help.js — the in-game help overlay (toggle with H).
// Explains the plan, the tools, the alarm ladder and scoring in one
// screen, drawn over a dimmed museum so the player never has to leave.
import { VIEW_W, VIEW_H, PALETTE, LOOT_QUOTA, ALARM_LEVELS } from './config.js';

const SECTIONS = [
  {
    title: 'THE PLAN',
    lines: [
      `Steal at least $${LOOT_QUOTA} of exhibits, then reach the EXIT`,
      'at the Entrance Hall doors (south wall, centre).',
      'Heavy statues slow you down — plan the route back.',
      'The Crown Jewel ($3,000) sits in the vault, behind lasers.',
    ],
  },
  {
    title: 'STEALTH',
    lines: [
      'Guard cones are flashlights: stay out, or break line of sight.',
      'Suspicion fills as ?, then the guard investigates, then chases.',
      'Cameras sweep blue cones — being filmed raises the alarm.',
      'Shift = sneak: slower, quieter, and harder to spot.',
      'Walking makes noise; a coin clink pulls guards away.',
      'Smoke blocks sight. Vents are the narrow grilles in walls.',
    ],
  },
  {
    title: 'TOOLS (keys 1–5)',
    lines: [
      '1 Coin Decoy — click a floor point; guards investigate it.',
      '2 Smoke Bomb — click / F: a cloud that blocks all sight, 7s.',
      '3 Lockpick — hold E at locked doors and the gift-shop safe.',
      '4 Glass Cutter — select it, then E on a case: silent opening.',
      '   Without it, E smashes the case: noise + a big alarm jump.',
      '5 EMP Pulse — click / G: every camera dark for 10 seconds.',
      'Security panels (E) also kill nearby cameras for 8 seconds.',
    ],
  },
  {
    title: 'LASERS',
    lines: [
      'Vault lasers pulse on and off — cross in the dark window.',
      'Tripping one is loud: +alarm and every guard comes running.',
      'An EMP also drops the laser grid for a few seconds.',
    ],
  },
];

export function drawHelpOverlay(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,5,16,0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText('HOW TO PULL THE HEIST', VIEW_W / 2, 64);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Press H or Esc to return to the museum', VIEW_W / 2, 90);
  ctx.textAlign = 'left';

  let y = 128;
  const colX = [70, 670];
  let col = 0;
  for (const section of SECTIONS) {
    const x = colX[col];
    let sy = col === 0 ? y : y;
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(section.title, x, sy);
    sy += 24;
    ctx.fillStyle = PALETTE.text;
    ctx.font = '13.5px system-ui, sans-serif';
    for (const line of section.lines) {
      ctx.fillText(line, x, sy);
      sy += 19;
    }
    if (col === 0) {
      col = 1;
    } else {
      col = 0;
      y = Math.max(y + 190, sy + 26);
    }
    if (section.title === 'STEALTH') y = sy + 30;
  }

  // Alarm ladder, drawn as four chips with the live level highlighted.
  const ladderY = VIEW_H - 120;
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('THE ALARM LADDER', 70, ladderY);
  ALARM_LEVELS.forEach((level, i) => {
    const x = 70 + i * 290;
    const active = game.alarm && game.alarm.levelIndex === i;
    ctx.fillStyle = active ? level.color : 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(x, ladderY + 14, 270, 44, 8);
    ctx.fill();
    ctx.fillStyle = active ? '#0b1026' : PALETTE.text;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`${level.name}  (${level.min}%)`, x + 12, ladderY + 34);
    ctx.font = '11.5px system-ui, sans-serif';
    const notes = [
      'Guards patrol normally.',
      'Guards get curious, move faster.',
      'Faster guards + a reinforcement.',
      '45 seconds to escape, or busted.',
    ];
    ctx.fillText(notes[i], x + 12, ladderY + 51);
  });

  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(
    'Scoring: loot value + time bonus + $1,000 ghost bonus if the alarm never reaches ALARM.',
    70, VIEW_H - 26,
  );
  ctx.restore();
}
