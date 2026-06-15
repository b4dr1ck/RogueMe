import { TILE_SIZE } from "@/config/game.js";
import { GameContext } from "@/services/GameContext.js";
import {
  playFireBurst,
  playFrostbite,
  playPoisonCloud,
  playHealEffect,
  playNecromancyEffect,
} from "@/animation/particles.js";
import { playDashAnimation,shootArrow } from "@/animation/tweens.js";

export class Spell {
  constructor(scene, name, sprite, color, type, cost, aoe = false, singleTarget = true, effects = {}) {
    this.scene = scene;
    this.name = name;
    this.sprite = sprite;
    this.color = color;
    this.type = type;
    this.cost = cost;
    this.aoe = aoe;
    this.singleTarget = singleTarget;
    this.effects = effects;
  }

  getName() {
    return this.name;
  }

  getSingleTarget() {
    return this.singleTarget;
  }

  getType() {
    return this.type;
  }

  getCost() {
    return this.cost;
  }

  getAOE() {
    return this.aoe;
  }

  getColor() {
    return this.color;
  }

  getEffects() {
    return this.effects;
  }

  canCast(caster) {
    if (this.getType() === "spell" && caster.stats.mp[0] < this.getCost()) {
      GameContext.log?.addEntry(`Not enough MP to cast "${this.getName()}"!`, "yellow");
      return false;
    }

    if (this.getType() === "special" && caster.stats.stm[0] < this.getCost()) {
      GameContext.log?.addEntry(`Not enough Stamina to use "${this.getName()}"!`, "yellow");
      return false;
    }

    return true;
  }

  payCost(caster) {
    if (this.getType() === "spell") {
      caster.stats.mp[0] -= this.getCost();
    }

    if (this.getType() === "special") {
      caster.stats.stm[0] -= this.getCost();
    }
  }

  logCastStart() {
    if (this.getType() === "spell") {
      GameContext.log?.addEntry(`You cast the "${this.getName()}" spell!`, "lightblue");
      return;
    }
    GameContext.log?.addEntry(`You use the "${this.getName()}" special ability!`, "lightblue");
  }

  createAOEIndictator(caster) {
    const boxGroup = this.scene.add.group();
    const startX = caster.position.x - this.aoe;
    const startY = caster.position.y - this.aoe;
    const endX = caster.position.x + this.aoe;
    const endY = caster.position.y + this.aoe;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        boxGroup.add(
          this.scene.add
            .rectangle(
              x * TILE_SIZE + TILE_SIZE / 2,
              y * TILE_SIZE + TILE_SIZE / 2,
              TILE_SIZE,
              TILE_SIZE,
              0xff0000,
              0.1,
            )
            .setOrigin(0.5, 0.5),
        );
      }
    }

    setTimeout(() => {
      boxGroup.clear(true, true);
    }, 500);
  }

  applyToTarget(caster, target) {
    if (this.getEffects().conditions) {
      for (const condition of this.getEffects().conditions) {
        if (condition.getChance() < Math.random()) {
          continue;
        }
        target.addCondition(condition.clone());
      }
    }

    // normal physical damage
    if (this.getEffects().stats?.dmg) {
      const spellDmg =
        Phaser.Math.Between(this.getEffects().stats.dmg[0], this.getEffects().stats.dmg[1]) +
        this.getEffects().stats.dmg[2];
      // type-based damage bonus (e.g. Turn Undead)
      if (this.getEffects().typeBasedDamage && target.type && this.getEffects().typeBasedDamage[target.type]) {
        const multiplier = this.getEffects().typeBasedDamage[target.type];
        target.takeDamage(spellDmg * multiplier);
      } else if (target.type && !(target.type in this.getEffects().typeBasedDamage)) {
        GameContext.log?.addEntry(`The ${this.getName()} has no effect on the ${target.name}!`, "yellow");
      } else {
        target.takeDamage(spellDmg);
      }
    }

    // non-damage effects
    for (const [stat, value] of Object.entries(this.getEffects().stats ?? {})) {
      if (stat === "dmg") {
        continue;
      }
      target.setStats(stat, value, 0);
    }

    // elemental damage
    if (this.getEffects().extra) {
      for (const [element, value] of Object.entries(this.getEffects().extra)) {
        target.takeDamage(value, element);
      }
    }

    // AOE Indicator
    this.createAOEIndictator(caster);

    // animation
    if (this.name === "Fire Touch") {
      playFireBurst(this.scene, target.position.x * TILE_SIZE, target.position.y * TILE_SIZE);
    }
    if (this.name === "Fire Arrow") {
      shootArrow(this.scene, caster, target.position.x * TILE_SIZE, target.position.y * TILE_SIZE, Phaser.Display.Color.GetColor(255, 100, 0));
      playFireBurst(this.scene, target.position.x * TILE_SIZE, target.position.y * TILE_SIZE);
    }
    if (this.name === "Poison Cloud") {
      playPoisonCloud(this.scene, target.position.x * TILE_SIZE, target.position.y * TILE_SIZE);
    }
    if (this.name === "Frostbite") {
      playFrostbite(this.scene, target.position.x * TILE_SIZE, target.position.y * TILE_SIZE);
    }
    if (this.name === "Elemental Shield") {
      playPotionEffect(this.scene, caster.position.x * TILE_SIZE, caster.position.y * TILE_SIZE, this.color);
    }
    if (this.name === "Turn Undead") {
      playNecromancyEffect(this.scene, target.position.x * TILE_SIZE, target.position.y * TILE_SIZE);
    }
    if (this.name === "Heal Wounds") {
      playHealEffect(this.scene, target.position.x * TILE_SIZE, target.position.y * TILE_SIZE);
    }

    if (this.name === "Double Strike") {
      playDashAnimation(
        this.scene,
        caster,
        target.position.x - caster.position.x,
        target.position.y - caster.position.y,
        1,
      );
    }
  }

  cast(caster) {
    if (!this.canCast(caster)) {
      return false;
    }

    this.payCost(caster);
    caster.normalizeValues();

    if (this.getAOE() === 0) {
      this.logCastStart();
      this.applyToTarget(caster, caster);
      return true;
    }

    for (let i = 0; i < this.getEffects().hits; i++) {
      const targets = caster.getEnemiesInAOE(
        caster.position.x,
        caster.position.y,
        this.getAOE(),
        this.getSingleTarget(),
      );
      if (targets.length === 0) {
        GameContext.log?.addEntry(`There are no targets in range for ${this.getName()}!`, "yellow");
        GameContext.log?.addEntry(`Your spell fizzles!`, "yellow");
        return false;
      }

      if (i > 0) {
        GameContext.log?.addEntry(`The "${this.getName()}" hits again!`, "lightblue");
      } else {
        this.logCastStart();
      }

      for (const target of targets) {
        this.applyToTarget(caster, target);
      }
    }

    return true;
  }
}
