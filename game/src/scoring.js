// scoring.js — end-of-run scoring, ranks and the score breakdown.
// Kept separate from game.js so the numbers are easy to audit and tune.
import { LOOT_QUOTA } from './config.js';

export const RANKS = [
  { min: 9000, title: 'LEGEND OF THE NIGHT', blurb: 'The museum will tell stories about this one.' },
  { min: 7500, title: 'MASTER THIEF', blurb: 'In and out like a rumour.' },
  { min: 6200, title: 'CAT BURGLAR', blurb: 'Quiet paws, heavy bag.' },
  { min: 5200, title: 'PROFESSIONAL', blurb: 'Quota met. Rent paid. Just barely.' },
  { min: 3000, title: 'OPPORTUNIST', blurb: 'Grabbed what was loose and ran.' },
  { min: 1, title: 'WINDOW SHOPPER', blurb: 'Came, saw, mostly browsed.' },
  { min: 0, title: 'CAUGHT IN THE ACT', blurb: 'The night did not go to plan.' },
];

export function rankFor(total, won) {
  if (!won) return RANKS[RANKS.length - 1];
  for (const rank of RANKS) {
    if (total >= rank.min) return rank;
  }
  return RANKS[RANKS.length - 1];
}

export function timeBonusFor(elapsedSeconds) {
  // Two dollars per second under ten minutes, floored at zero.
  return Math.max(0, 600 - Math.floor(elapsedSeconds) * 2);
}

export function ghostBonusFor(alarm) {
  // Never letting the meter reach ALARM is the ghost play.
  return alarm && alarm.everAlarmed ? 0 : 1000;
}

export function computeScore(game) {
  const won = game.state === 'won';
  const value = game.carriedValue;
  const timeBonus = won ? timeBonusFor(game.elapsed) : 0;
  const ghostBonus = won ? ghostBonusFor(game.alarm) : 0;
  const quotaMet = value >= LOOT_QUOTA;
  const total = won ? value + timeBonus + ghostBonus : value;
  const rank = rankFor(total, won);
  return {
    won,
    value,
    quotaMet,
    quota: LOOT_QUOTA,
    time: game.elapsed,
    timeBonus,
    ghostBonus,
    ghost: ghostBonus > 0,
    detections: game.alarm ? game.alarm.detections : 0,
    total,
    rank: rank.title,
    rankBlurb: rank.blurb,
    lootCount: game.loot ? game.loot.filter((l) => l.taken).length : 0,
    lootTotal: game.loot ? game.loot.length : 0,
  };
}

export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function scoreLines(score) {
  const lines = [
    `Loot value: $${score.value} (${score.lootCount}/${score.lootTotal} exhibits)`,
    `Time: ${formatTime(score.time)}`,
    `Times detected: ${score.detections}`,
  ];
  if (score.won) {
    lines.push(`Time bonus: +$${score.timeBonus}`);
    lines.push(
      score.ghost
        ? 'Ghost bonus: +$1,000 (alarm never reached ALARM)'
        : 'Ghost bonus: — (the alarm went off)',
    );
  }
  return lines;
}
