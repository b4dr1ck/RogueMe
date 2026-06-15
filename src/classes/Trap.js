import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";
import { GameContext } from "@/services/GameContext.js";
import { shootArrow } from "@/animation/tweens.js";
import { playFireBurst, playPoisonCloud } from "@/animation/particles.js";

export class Trap {
  constructor(scene, name, sprite, dmg, condition = null, x, y, active, range = 0, skill, visible = true) {
    this.scene = scene;
    this.name = name;
    this._x = x;
    this._y = y;
    this.sprite = sprite;
    this._skill = skill;
    this.condition = condition;
    this.active = active;
    this.visible = visible;
    this._levelVisible = true;
    this.dmg = dmg;
    this.gameObject = null;
    this.range = range;
  }

  get position() {
    return { x: this._x, y: this._y };
  }

  set position({ x, y }) {
    this._x = x;
    this._y = y;
    if (this.gameObject) {
      this.gameObject.setPosition(x * TILE_SIZE, y * TILE_SIZE);
    }
  }

  set skill(value) {
    this._skill = value;
  }

  get skill() {
    return this._skill;
  }

  setVisible(value) {
    this._levelVisible = value;
    if (this.gameObject) {
      this.gameObject.setVisible(this.visible && this._levelVisible);
    }
  }

  inRangeOf(player) {
    if (!this.active || this.range <= 0 || player.hasCondition("Invisibility")) return false;

    const playerDistance = Math.max(
      Math.abs(player.position.x - this.position.x),
      Math.abs(player.position.y - this.position.y),
    );
    if (playerDistance > this.range) {
      return false;
    }

    if (player.hasLineOfSight(this.position.x, this.position.y)) {
      GameContext.log?.addEntry(`You hear a 'click' sound nearby!`, "orange", true);
      shootArrow(this.scene, this, player.position.x * TILE_SIZE, player.position.y * TILE_SIZE, this.sprite);
      this.onStep(player);
      return true;
    }
    return false;
  }

  disarm(player, item) {
    if (!player.hasSkill("Disarming", this.skill)) {
      GameContext.log?.addEntry(`You need a higher skill level in Disarming to disarm the ${this.name}.`, "orange");
      return false;
    }
    this.setActive(false);

    GameContext.log?.addEntry(`You use the ${item.name} to disarm the ${this.name}.`, "green");
    return true;
  }

  setActive(state) {
    this.active = state;
    if (this.gameObject) {
      this.gameObject.setAlpha(this.active ? 1 : 0.5);
    }
  }

  render() {
    this.gameObject = this.scene.add.image(this._x * TILE_SIZE, this._y * TILE_SIZE, this.sprite).setOrigin(0);
    this.gameObject.setDepth(RENDER_DEPTH.trap);
    this.gameObject.setAlpha(this.active ? 1 : 0.5);
    this.gameObject.setVisible(this.visible && this._levelVisible);
  }

  onStep(player) {
    if (!this.active) return;

    // Particle effects based on trap type
    switch (this.name) {
      case "Poison Trap":
        playPoisonCloud(this.scene, this.position.x * TILE_SIZE, this.position.y * TILE_SIZE);
        break;
      case "Confusion Trap":
        playPoisonCloud(this.scene, this.position.x * TILE_SIZE, this.position.y * TILE_SIZE, 0x83449e);
        break;
      case "Fire Trap":
        playFireBurst(this.scene, this.position.x * TILE_SIZE, this.position.y * TILE_SIZE);
        break;
    }

    const type = player.constructor.name;
    const pronoun = type === "Player" ? "You" : `${player.name}`;
    GameContext.log?.addEntry(`${this.name} triggers!`, "orange");

    if (this.condition) {
      player.addCondition(this.condition.clone());
    }
    if (this.dmg > 0) {
      player.takeDamage(this.dmg);
    }
  }
}
