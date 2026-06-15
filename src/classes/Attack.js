import { shakeCamera } from "@/animation/tweens.js";

export class Attack {
  constructor(scene, name, dmg, condition = null, cooldownTurns = 1, extra = null, range = 1, aoe = 0, hits = 1) {
    this.scene = scene;
    this.name = name;
    const [from, to, bonus] = Array.isArray(dmg)
      ? [dmg[0] ?? 0, dmg[1] ?? dmg[0] ?? 0, dmg[2] ?? 0]
      : [dmg ?? 0, dmg ?? 0, 0];
    this.dmg = [Math.min(from, to), Math.max(from, to), bonus];
    this.condition = condition;
    this.cooldownTurns = Math.max(1, cooldownTurns);
    this.turnsUntilReady = 0;
    this.range = range;
    this.extra = extra;
    this.aoe = aoe;
    this.hits = hits;
  }

  getHits() {
    return this.hits;
  }

  getAoe() {
    return this.aoe;
  }

  getRange() {
    return this.range;
  }

  getName() {
    return this.name;
  }

  getDmg() {
    return this.dmg;
  }

  rollDamage() {
    return Phaser.Math.Between(this.dmg[0], this.dmg[1]) + this.dmg[2];
  }

  getCondition() {
    return this.condition;
  }

  getExtra() {
    return this.extra;
  }

  getCooldownTurns() {
    return this.cooldownTurns;
  }

  getTurnsUntilReady() {
    return this.turnsUntilReady;
  }

  isReady() {
    return this.turnsUntilReady === 0;
  }

  advanceCooldown() {
    if (this.turnsUntilReady > 0) {
      this.turnsUntilReady--;
    }
  }

  consume(player) {
    this.turnsUntilReady = this.cooldownTurns;

    // play animation for the attack
    if (this.name === "Stomp") {
      shakeCamera(this.scene, player);
    }
  }

  getTick() {
    return this.getTurnsUntilReady();
  }
}
