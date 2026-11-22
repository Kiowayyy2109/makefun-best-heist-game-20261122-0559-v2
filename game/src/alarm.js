// alarm.js — global alarm meter and escalation levels.
import { ALARM, ALARM_LEVELS, LOCKDOWN_SECONDS } from './config.js';

export class AlarmSystem {
  constructor(audio) {
    this.audio = audio;
    this.meter = 0;
    this.levelIndex = 0;
    this.lockdownTimer = 0;
    this.detections = 0;
    this.everAlarmed = false;
    this.wasSeen = false;
  }
  level() { return ALARM_LEVELS[this.levelIndex]; }
  add(amount, game) {
    const before = this.meter;
    this.meter = Math.max(0, Math.min(ALARM.max, this.meter + amount));
    this.syncLevel(game, before);
  }
  syncLevel(game, before = this.meter) {
    let idx = 0;
    for (let i = 0; i < ALARM_LEVELS.length; i++) if (this.meter >= ALARM_LEVELS[i].min) idx = i;
    if (idx !== this.levelIndex) {
      this.levelIndex = idx;
      if (game) game.onAlarmLevel(ALARM_LEVELS[idx], idx > 0 && this.meter > before);
      if (idx >= 2) this.everAlarmed = true;
      if (idx === 3 && this.lockdownTimer <= 0) this.lockdownTimer = LOCKDOWN_SECONDS;
      if (idx < 3) this.lockdownTimer = 0;
    }
    if (this.audio) this.audio.setAlarm(this.levelIndex >= 2 && game && game.state === 'playing');
  }
  update(dt, seenNow, game) {
    if (seenNow) {
      if (!this.wasSeen) this.detections += 1;
      this.add(ALARM.risePerSecondSeen * dt, game);
    } else {
      this.add(-ALARM.decayPerSecond * dt, game);
    }
    this.wasSeen = seenNow;
    if (this.levelIndex === 3) {
      this.lockdownTimer -= dt;
      if (this.lockdownTimer <= 0 && game) game.lose('Lockdown sealed the museum. Caught inside.');
    }
  }
  noiseHeard(amount, game) { this.add(amount, game); }
  reset() {
    this.meter = 0; this.levelIndex = 0; this.lockdownTimer = 0;
    this.detections = 0; this.everAlarmed = false; this.wasSeen = false;
    if (this.audio) this.audio.setAlarm(false);
  }
}
