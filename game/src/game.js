// game.js — state machine, main loop, interactions. Entry module.
import { VIEW_W, VIEW_H, WORLD_W, WORLD_H, PLAYER, LOOT_QUOTA, ALARM } from './config.js';
import { buildWalls, DOORS, EXIT_ZONE, PLAYER_START, roomAt, moveCircle, lineOfSight } from './museum.js';
import { createLoot, lootValueTaken, lootWeightTaken, nearestLoot } from './loot.js';
import { createGuards, anyGuardSees } from './guards.js';
import { createCameras, anyCameraSees, PANELS } from './cameras.js';
import { LaserGrid } from './lasers.js';
import { AlarmSystem } from './alarm.js';
import { ToolBelt } from './tools.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { drawWorld, drawHUD, drawStartScreen, drawEndScreen } from './render.js';
import { sceneFromUrl, applyScene } from './shots.js';
import { drawHelpOverlay } from './help.js';
import { computeScore } from './scoring.js';
import { ParticleSystem } from './effects.js';
import { NightDirector } from './director.js';
import { ObjectiveTracker } from './objectives.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.audio = new AudioEngine();
    this.reset();
    this.state = 'title';
    this.lastTs = 0;
    this.scene = sceneFromUrl();
    if (this.scene) { this.state = 'playing'; applyScene(this, this.scene); }
    requestAnimationFrame((t) => this.frame(t));
  }

  reset() {
    this.walls = buildWalls();
    this.doors = DOORS.map((d) => ({ ...d, open: !d.locked, progress: 0 }));
    this.loot = createLoot();
    this.guards = createGuards();
    this.cameras = createCameras();
    this.lasers = new LaserGrid();
    this.alarm = new AlarmSystem(this.audio);
    this.tools = new ToolBelt(this.audio);
    this.player = {
      x: PLAYER_START.x, y: PLAYER_START.y, radius: PLAYER.radius,
      angle: -Math.PI / 2, sneak: false, carriedWeight: 0, moving: false,
    };
    this.carriedValue = 0;
    this.camera = { x: 0, y: 0 };
    this.smokeClouds = [];
    this.coinRipples = [];
    this.effects = new ParticleSystem();
    this.director = new NightDirector();
    this.objectives = new ObjectiveTracker();
    this.time = 0;
    this.elapsed = 0;
    this.flashText = ''; this.flashColor = '#fff'; this.flashTimer = 0;
    this.prompt = '';
    this.loseReason = '';
    this.helpOpen = false;
    this.freeze = false;
    this.updateCamera(1);
  }

  flashMessage(text, color = '#fff') { this.flashText = text; this.flashColor = color; this.flashTimer = 2.6; }
  onAlarmLevel(level, rising) {
    if (level.name === 'ALARM') {
      this.flashMessage('ALARM! Guards are faster — a reinforcement arrived!', '#ff8a3d');
      const g = this.guards.find((x) => x.reinforcement);
      if (g) g.active = true;
    } else if (level.name === 'LOCKDOWN') {
      this.flashMessage('LOCKDOWN! Get out before the shutters seal!', '#ff5a4e');
    } else if (level.name === 'NOTICED' && rising) {
      this.flashMessage('Something was noticed…', '#ffc53d');
    }
  }
  lose(reason) {
    if (this.state !== 'playing') return;
    this.state = 'lost'; this.loseReason = reason;
    this.audio.lose(); this.audio.setAlarm(false);
  }
  win() {
    if (this.state !== 'playing') return;
    this.state = 'won'; this.audio.win(); this.audio.setAlarm(false);
  }
  score() {
    return computeScore(this);
  }

  updateCamera(dt) {
    const tx = Math.max(0, Math.min(WORLD_W - VIEW_W, this.player.x - VIEW_W / 2));
    const ty = Math.max(0, Math.min(WORLD_H - VIEW_H, this.player.y - VIEW_H / 2));
    const k = dt >= 1 ? 1 : Math.min(1, dt * 8);
    this.camera.x += (tx - this.camera.x) * k;
    this.camera.y += (ty - this.camera.y) * k;
    if (this.freeze) { this.camera.x = tx; this.camera.y = ty; }
  }

  emitNoise(x, y, radius, alarmAmount) {
    let heard = false;
    for (const g of this.guards) if (g.hearNoise(x, y, radius)) heard = true;
    if (heard && alarmAmount) this.alarm.noiseHeard(alarmAmount, this);
    return heard;
  }

  frame(ts) {
    const dt = Math.min(0.05, this.lastTs ? (ts - this.lastTs) / 1000 : 0.016);
    this.lastTs = ts;
    if (!this.freeze) this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt) {
    const input = this.input;
    if (input.wasPressed('m')) { this.audio.ensure(); const m = this.audio.toggleMute(); this.flashMessage(m ? 'Muted' : 'Sound on'); }
    if (input.wasPressed('h') || (this.helpOpen && input.wasPressed('escape'))) {
      this.helpOpen = !this.helpOpen;
    }
    if (input.wasPressed('r')) { const wasScene = this.scene; this.reset(); this.state = 'playing'; if (wasScene) applyScene(this, wasScene); return; }
    if (this.state === 'title') {
      if (input.wasPressed('enter') || input.mouse.clicked) { this.audio.ensure(); this.state = 'playing'; }
      return;
    }
    if (this.state !== 'playing') return;
    if (this.helpOpen) return; // paused while the help overlay is up
    this.audio.ensure();
    this.time += dt; this.elapsed += dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Tool selection 1-5
    for (const key of ['1', '2', '3', '4', '5']) {
      if (input.wasPressed(key)) { const d = this.tools.selectByKey(key); if (d) this.flashMessage(`${d.name} selected — ${d.hint}`, '#eef1ff'); }
    }
    // Instant tools
    if (this.tools.selected === 'smoke' && input.wasPressed('e')) { /* handled below as use */ }
    if (input.wasPressed('q')) { /* reserved */ }

    // Player movement
    const p = this.player;
    const axis = input.axis();
    p.sneak = input.sneak();
    p.moving = axis.moving;
    this.carriedValue = lootValueTaken(this.loot);
    p.carriedWeight = lootWeightTaken(this.loot);
    const carrySlow = Math.min(60, p.carriedWeight * PLAYER.carrySlowPerKg);
    const speed = Math.max(55, (p.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed) - carrySlow);
    if (axis.moving) {
      p.angle = Math.atan2(axis.y, axis.x);
      moveCircle(p, axis.x * speed * dt, axis.y * speed * dt, p.radius, this.walls);
      // Walking (not sneaking) makes a little noise.
      if (!p.sneak && Math.random() < dt * 2) this.emitNoise(p.x, p.y, PLAYER.noiseWalk, 0);
    }
    this.audio.updateSteps(dt, axis.moving, p.sneak);

    // Mouse: coin toss when coin tool selected
    if (input.mouse.clicked) {
      const wx = input.mouse.x + this.camera.x;
      const wy = input.mouse.y + this.camera.y;
      if (this.tools.selected === 'coin') this.tools.tossCoin(this, wx, wy);
      else if (this.tools.selected === 'smoke') this.tools.dropSmoke(this);
      else if (this.tools.selected === 'emp') this.tools.fireEMP(this);
    }
    if (input.wasPressed('x')) {
      if (this.tools.selected === 'smoke') this.tools.dropSmoke(this);
      if (this.tools.selected === 'emp') this.tools.fireEMP(this);
    }
    // Smoke / EMP also fire on their number-key double-tap alternative: keys f/g
    if (input.wasPressed('f')) this.tools.dropSmoke(this);
    if (input.wasPressed('g')) this.tools.fireEMP(this);

    this.handleInteract(dt);
    for (const g of this.guards) g.update(dt, this);
    for (const c of this.cameras) c.update(dt, this);
    this.lasers.update(dt, this);
    const seen = anyGuardSees(this.guards) || anyCameraSees(this.cameras);
    // Guard vision drives the meter via suspicion; camera adds its own in its update.
    const anyChase = this.guards.some((g) => g.active && g.state === 'chase');
    this.alarm.update(dt, anyChase, this);
    void seen;
    for (const s of this.smokeClouds) s.t -= dt;
    this.smokeClouds = this.smokeClouds.filter((s) => s.t > 0);
    for (const r of this.coinRipples) { r.r += dt * 90; r.t -= dt; }
    this.coinRipples = this.coinRipples.filter((r) => r.t > 0);
    this.effects.update(dt);
    const room = roomAt(p.x, p.y);
    this.roomName = room ? room.name : '';
    this.director.update(dt, this);
    this.objectives.update(dt, this);
    // Exit check
    if (p.x >= EXIT_ZONE.x && p.x <= EXIT_ZONE.x + EXIT_ZONE.w && p.y >= EXIT_ZONE.y && p.y <= EXIT_ZONE.y + EXIT_ZONE.h) {
      if (this.carriedValue >= LOOT_QUOTA) this.win();
      else if (this.flashTimer <= 0) this.flashMessage(`Exit locked — need $${LOOT_QUOTA - this.carriedValue} more loot!`, '#ffc53d');
    }
    this.updateCamera(dt);
  }

  handleInteract(dt) {
    const p = this.player;
    const input = this.input;
    this.prompt = '';
    let pickCompleted = false;
    let activeTarget = null;

    // Nearest locked door (its rect expanded)
    for (const d of this.doors) {
      if (d.open) continue;
      const cx = d.x + d.w / 2; const cy = d.y + d.h / 2;
      if (Math.hypot(p.x - cx, p.y - cy) < 70) {
        if (d.locked) {
          this.prompt = `Hold E — lockpick ${d.name} (${d.pickSeconds}s)`;
          if (input.interact()) {
            activeTarget = { kind: 'door', ref: d, needed: d.pickSeconds };
            if (this.tools.updatePick(dt, this, activeTarget)) {
              d.open = true; d.locked = false;
              // Remove nothing from walls: cage doors were visual gates;
              // opening also disables the laser grid briefly as a reward.
              this.flashMessage(`${d.name} opened!`, '#8be28b');
              pickCompleted = true;
            }
          }
        }
      }
    }
    // Security panels
    for (const panel of PANELS) {
      if (Math.hypot(p.x - panel.x, p.y - panel.y) < 56) {
        this.prompt = 'Press E — hack panel: cameras off 8s';
        if (input.wasPressed('e')) {
          for (const c of this.cameras) if (Math.hypot(c.x - panel.x, c.y - panel.y) < panel.range) c.disable(8);
          this.audio.emp(); this.flashMessage('Panel hacked — nearby cameras off!', '#7fb0ff');
        }
      }
    }
    // Loot
    const item = nearestLoot(this.loot, p.x, p.y);
    if (item && !pickCompleted) {
      if (item.locked) {
        this.prompt = `Hold E — lockpick ${item.name} ($${item.value})`;
        if (input.interact()) {
          activeTarget = { kind: 'loot', ref: item, needed: item.pickSeconds || 2.5 };
          if (this.tools.updatePick(dt, this, activeTarget)) { this.takeLoot(item); pickCompleted = true; }
        }
      } else if (item.cased && !item.caseOpen) {
        if (this.tools.selected === 'cutter') {
          this.prompt = `Press E — glass cutter (silent) on ${item.name} ($${item.value})`;
          if (input.wasPressed('e')) {
            if (this.tools.use('cutter')) { item.caseOpen = true; this.audio.cutter(); this.flashMessage('Case cut open — silently.', '#8be28b'); }
            else this.flashMessage('No cutter charges left — E will smash (loud!)', '#ffc53d');
          }
        } else {
          this.prompt = `Press E — SMASH case for ${item.name} (loud!) · select 4 for cutter`;
          if (input.wasPressed('e')) {
            item.caseOpen = true; this.audio.glassBreak();
            this.effects.glassShards(item.x, item.y);
            this.effects.addShake(5);
            this.alarm.add(ALARM.glassBreak, this);
            this.emitNoise(p.x, p.y, 260, ALARM.noiseLoud);
            this.flashMessage('Glass smashed! Noise + alarm!', '#ff5a4e');
          }
        }
      } else {
        this.prompt = `Press E — steal ${item.name} ($${item.value}${item.kg >= 8 ? ', HEAVY' : ''})`;
        if (input.wasPressed('e')) this.takeLoot(item);
      }
    }
    if (!input.interact()) this.tools.cancelPick();
    else if (!activeTarget && !pickCompleted) this.tools.cancelPick();
  }

  takeLoot(item) {
    item.taken = true;
    this.audio.pickup();
    this.effects.sparkleLoot(item.x, item.y, '#ffe08a');
    this.effects.addText(item.x, item.y - 26, `+$${item.value} ${item.name}`);
    this.carriedValue = lootValueTaken(this.loot);
    this.flashMessage(`Stole ${item.name} — $${this.carriedValue} total${this.carriedValue >= LOOT_QUOTA ? ' · QUOTA MET, GET TO EXIT!' : ''}`,
      this.carriedValue >= LOOT_QUOTA ? '#8be28b' : '#ffe08a');
    if (item.kind === 'crown') this.flashMessage('THE CROWN JEWEL IS YOURS! Get to the exit!', '#ffd700');
  }

  draw() {
    const ctx = this.ctx;
    if (this.state === 'title') { drawStartScreen(ctx, this); return; }
    if (this.state === 'won') { drawEndScreen(ctx, this, true); return; }
    if (this.state === 'lost') { drawEndScreen(ctx, this, false); return; }
    drawWorld(ctx, this);
    drawHUD(ctx, this);
    if (this.helpOpen) drawHelpOverlay(ctx, this);
  }
}

const canvas = document.getElementById('game');
if (canvas) new Game(canvas);
export { Game, lineOfSight };
