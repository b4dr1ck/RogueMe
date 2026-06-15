
import { GameContext } from "@/services/GameContext.js";
import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";
import { playTeleportAnimation } from "@/animation/tweens.js";

export class Teleporter {
  constructor(scene, name, sprite, x, y, targetX, targetY, active = true) {
    this.scene = scene;
    this.name = name;
    this._x = x;
    this._y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.sprite = sprite;
    this.active = active;

    this.gameObject = null;
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

  toggleActive() {
    this.active = !this.active;
    if (this.gameObject) {
      this.gameObject.setAlpha(this.active ? 1 : 0.5);
    }
  }

  onStep(player) {
    if (!this.active) return;

    const type = player.constructor.name;
    const pronoun = type === "Player" ? "You" : `${player.name}`;
    GameContext.log?.addEntry(
      `${pronoun} step on the ${this.name} and teleport to (${this.targetX}, ${this.targetY})!`,
      "cyan",
    );
    playTeleportAnimation(this.scene, player);
    player.moveTo(this.targetX, this.targetY);
  }

  render() {
    this.gameObject = this.scene.add.image(this._x * TILE_SIZE, this._y * TILE_SIZE, this.sprite).setOrigin(0);
    this.gameObject.setDepth(RENDER_DEPTH.teleporter);
    this.gameObject.setAlpha(this.active ? 1 : 0.5);
  }
}
