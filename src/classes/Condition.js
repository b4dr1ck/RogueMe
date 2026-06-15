import { GameContext } from "@/services/GameContext.js";
import { TILE_SIZE } from "@/config/game.js";

export class Condition {
  constructor(scene, name, duration, color = "white", chance = 1) {
    this.scene = scene;
    this.name = name;
    this.duration = duration;
    this.color = color;
    this.chance = chance; // Chance for the condition to be applied (0-1)
    this.blackScreen = null;
  }

  clone() {
    return new Condition(this.scene, this.name, this.duration, this.color, this.chance);
  }

  getChance() {
    return this.chance;
  }

  getScene(actor) {
    return this.scene ?? actor?.scene ?? null;
  }

  ensureBlackScreen(actor, color = 0x000000, alpha = 0.9) {
    if (this.blackScreen) {
      this.blackScreen.setVisible(true);
      return;
    }

    const scene = this.getScene(actor);
    if (!scene) {
      return;
    }

    const width = scene.currentLevel.getMap().getDefinition()[0].length * TILE_SIZE + 5;
    const height = scene.currentLevel.getMap().getDefinition().length * TILE_SIZE + 5;
    this.blackScreen = scene.add.rectangle(0, 0, width, height, color, alpha);
    this.blackScreen.setOrigin(0, 0);
    this.blackScreen.setScrollFactor(0);
    this.blackScreen.setDepth(5000);
  }

  onApply(actor) {
    if (this.name === "Blindness") {
      this.ensureBlackScreen(actor);
    }
    if (this.name === "Poison" || this.name === "Slimey" || this.name === "Disease") {
      this.ensureBlackScreen(actor, 0x00ff00, 0.075);
    }
    if (this.name === "Petrification") {
      actor.setResistance("physical", 100);
    }
    if (this.name === "Fire Shield") {
      actor.setResistance("fire", 25);
    }
    if (this.name === "Water Shield") {
      actor.setResistance("water", 25);
    }
    if (this.name === "Earth Shield") {
      actor.setResistance("earth", 25);
    }
    if (this.name === "Air Shield") {
      actor.setResistance("air", 25);
    }
    if (this.name === "Stone Skin") {
      actor.setResistance("physical", 50);
    }
    if (this.name === "Invisibility") {
      actor.getGameObject().setTint(0x666666);
    }
    if (this.name === "Magic Eye") {
      this.scene.fogOfWar?.setVisible(false);
    }
  }

  onRemove(actor) {
    if (this.name === "Blindness" || this.name === "Poison" || this.name === "Slimey" || this.name === "Disease") {
      this.removeBlackScreen();
    }
    if (this.name === "Petrification") {
      actor.setResistance("physical", -100);
    }
    if (this.name === "Fire Shield") {
      actor.setResistance("fire", -25);
    }
    if (this.name === "Water Shield") {
      actor.setResistance("water", -25);
    }
    if (this.name === "Earth Shield") {
      actor.setResistance("earth", -25);
    }
    if (this.name === "Air Shield") {
      actor.setResistance("air", -25);
    }
    if (this.name === "Stone Skin") {
      actor.setResistance("physical", -50);
    }
    if (this.name === "Invisibility") {
      actor.getGameObject().setTint(0xffffff);
    }
    if (this.name === "Magic Eye") {
      this.scene.fogOfWar?.setVisible(true);
    }
  }

  // Modify movement based on condition effects
  modifyMovement(actor, movement, rng = Math.random) {
    switch (this.name) {
      case "Confusion":
        return { dx: movement.dx * -1, dy: movement.dy * -1 };
      case "Drunkenness":
        return {
          dx: Math.floor(rng() * 3) - 1,
          dy: Math.floor(rng() * 3) - 1,
        };
      case "Paralysis":
      case "Slimey":
      case "Petrification":
        return { dx: 0, dy: 0 };
      default:
        return movement;
    }
  }

  tick() {
    this.duration--;
    return this.duration <= 0; // returns true if the condition has expired
  }

  removeBlackScreen() {
    if (this.blackScreen) {
      this.blackScreen.destroy();
      this.blackScreen = null;
    }
  }

  impact(player) {
    const type = player.constructor.name;
    const pronoun = type === "Player" ? "You" : `${player.name}`;
    const verb = type === "Player" ? "are" : "is";

    const resistanceChhance = player.getResistances(this.name.toLowerCase()) ?? 0;
    const randomChance = Phaser.Math.Between(1, 100);
    if (resistanceChhance > 0 && resistanceChhance >= randomChance) {
      GameContext.log?.addEntry(`${pronoun} resist the ${this.name.toLowerCase()}!`, "green");
      return;
    }

    switch (this.name) {
      case "Poison":
        const poisonDmg = 1;
        GameContext.log?.addEntry(`${pronoun} ${verb} poisoned`, this.color, true);
        player.takeDamage(poisonDmg, "poison");
        break;
      case "Disease":
        GameContext.log?.addEntry(`${pronoun} ${verb} diseased!`, this.color, true);
        break;
      case "Bleeding":
        const bleedingDmg = 2;
        GameContext.log?.addEntry(`${pronoun} ${verb} bleeding!`, this.color, true);
        player.takeDamage(bleedingDmg, "bleeding");
        break;
      case "Confusion":
        GameContext.log?.addEntry(`${pronoun} ${verb} confused and move wildly!`, this.color, true);
        break;
      case "Drunkenness":
        GameContext.log?.addEntry(`${pronoun} ${verb} drunk and move unpredictably!`, this.color, true);
        break;
      case "Paralysis":
        GameContext.log?.addEntry(`${pronoun} ${verb} paralyzed and cannot move!`, this.color, true);
        break;
      case "Petrification":
        GameContext.log?.addEntry(`${pronoun} ${verb} petrified!`, this.color, true);
        break;
      case "Regeneration":
        const regenHp = 1;
        GameContext.log?.addEntry(`${pronoun} ${verb} regenerating! (${regenHp} hp)`, this.color, true);
        player.heal(regenHp);
        break;
      case "Blindness":
        GameContext.log?.addEntry(`${pronoun} ${verb} blinded!`, this.color, true);
        this.ensureBlackScreen(player);
        break;
      case "Burning":
        const burnDmg = 2;
        GameContext.log?.addEntry(`${pronoun} ${verb} burning!`, this.color, true);
        player.takeDamage(burnDmg, "fire");
        break;
      case "Fire Shield":
        GameContext.log?.addEntry(`${pronoun} ${verb} protected by a fiery shield!`, this.color, true);
        break;
      case "Water Shield":
        GameContext.log?.addEntry(`${pronoun} ${verb} protected by a watery shield!`, this.color, true);
        break;
      case "Earth Shield":
        GameContext.log?.addEntry(`${pronoun} ${verb} protected by an earthen shield!`, this.color, true);
        break;
      case "Air Shield":
        GameContext.log?.addEntry(`${pronoun} ${verb} protected by an airy shield!`, this.color, true);
        break;
      case "Stone Skin":
        GameContext.log?.addEntry(`${pronoun} ${verb} protected by a stone skin!`, this.color, true);
        break;
      case "Slimey":
        GameContext.log?.addEntry(`${pronoun} ${verb} slimed!`, this.color, true);
        break;
      case "Invisibility":
        GameContext.log?.addEntry(`${pronoun} ${verb} invisible!`, this.color, true);
        break;
      case "Magic Eye":
        GameContext.log?.addEntry(`${pronoun} ${verb} affected by magic eye!`, this.color, true);
        break;
      default:
        break;
    }
  }
}
