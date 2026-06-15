import { GameContext } from "@/services/GameContext.js";
import { RENDER_DEPTH, TILE_SIZE } from "@/config/game.js";

export class Switch {
  constructor(scene, name, sprite, x, y, active, linked, onlyOnStep = false, visible = true) {
    this.scene = scene;
    this.name = name;
    this.sprite = sprite;
    this._x = x;
    this._y = y;
    this.active = active;
    this.linked = linked;
    this.activated = false;
    this._onlyOnStep = onlyOnStep;
    this._visible = visible;
    this._levelVisible = true;

    this.gameObject = null;
  }

  get position() {
    return { x: this._x, y: this._y };
  }

  isActive() {
    return this.active;
  }

  get visible() {
    return this._visible;
  }

  set visible(value) {
    this._visible = value;
    if (this.gameObject) {
      this.gameObject.setVisible(this._visible && this._levelVisible);
    }
  }

  setVisible(value) {
    this._levelVisible = value;
    if (this.gameObject) {
      this.gameObject.setVisible(this._visible && this._levelVisible);
    }
  }

  set position({ x, y }) {
    this._x = x;
    this._y = y;
    if (this.gameObject) {
      this.gameObject.setPosition(this._x * 32 + 16, this._y * 32 + 16);
    }
  }

  set onlyOnStep(value) {
    this._onlyOnStep = value;
  }

  get onlyOnStep() {
    return this._onlyOnStep;
  }

  toggle(player) {
    this.active = !this.active;

    this.gameObject.setTexture(this.sprite[this.active ? 0 : 1]);

    const type = player.constructor.name;
    const name = type === "Player" ? "You" : `${player.name}`;
    const verb = type === "Player" ? "toggle" : "toggles";

    GameContext.log?.addEntry(`${name} ${verb} the ${this.name}!`, "yellow");
  }

  render() {
    this.gameObject = this.scene.add
      .image(this._x * TILE_SIZE, this._y * TILE_SIZE, this.sprite[this.active ? 0 : 1])
      .setOrigin(0);
    this.gameObject.setDepth(RENDER_DEPTH.switch);
    this.gameObject.setVisible(this._visible && this._levelVisible);
  }
}
