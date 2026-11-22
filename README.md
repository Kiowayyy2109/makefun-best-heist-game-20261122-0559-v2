# makefun-best-heist-game-20261122-0559-v2

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Kiowayyy2109/makefun-best-heist-game-20261122-0559-v2/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Kiowayyy2109/makefun-best-heist-game-20261122-0559-v2/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Midnight Gallery** — a top-down stealth heist game set in a museum at night, built for the [make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559).

Slip through six areas — the Entrance Hall, Sculpture Court, Paintings Wing, Jewels Vault, Restoration Lab and Gift Shop — each with more than one way in. Read the guards' patrols and raycast vision cones, dodge sweeping cameras and a pulsing laser grid, and lift enough loot to meet the quota before the alarm meter tips the museum into lockdown.

## Play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and visit http://localhost:8080). No build step, no network: everything runs from the files in `game/`.

- **Move:** WASD / arrow keys · **Sneak:** Shift · **Interact:** E
- **Tools:** 1 Coin Decoy (click a spot to throw) · 2 Smoke Bomb · 3 Lockpick · 4 Glass Cutter · 5 EMP Pulse
- **Help:** H · **Mute:** M · **Restart:** R

## Highlights

- Guard AI with per-guard suspicion: calm, curious, investigating, chasing — with flashlight cones occluded by walls
- A global alarm meter with escalating levels: Noticed, Alarm (reinforcements), Lockdown countdown
- Five tools with limited uses and real trade-offs: noise, time, or a charge
- 18 tiered exhibits, heavy statues that slow you down, and the Crown Jewel behind the vault's laser grid
- Procedural WebAudio sound, a live museum-plan minimap, and a score screen with a ghost bonus for staying unseen

## Layout

- `main.ts` — the hand-in program: validates the entry, stages `game/` and `screenshots/` deterministically, and writes the dossier
- `game/` — the game itself (plain files, ES modules under `game/src/`, one job per file)
- `screenshots/` — real renders of the game, taken in a headless browser
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
