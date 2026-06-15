import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";
import { GameContext } from "@/services/GameContext.js";


export class Door {
  constructor(scene, name, sprite, x, y, open, key, locks = 0, skill = 0, visible = true) {
    this.scene = scene;
    this.name = name;
    this._x = x;
    this._y = y;
    this._open = open;
    this._visible = visible;
    this._levelVisible = true;
    this._locks = locks;
    this._skill = skill;
    this.key = key;
    this.sprite = sprite;

    this.gameObject = null;
  }

  get position() {
    return { x: this._x, y: this._y };
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
      this.gameObject.setPosition(x * TILE_SIZE, y * TILE_SIZE);
    }
  }

  set skill(value) {
    this._skill = value;
  }

  get skill() {
    return this._skill;
  }

  get locks() {
    return this._locks;
  }

  set locks(value) {
    this._locks = value;
  }

  isOpen() {
    return this._open;
  }

  getKey() {
    return this.key;
  }

  setKey(keyName) {
    this.key = keyName;
  }

  close() {
    if (this.isOpen()) {
      this._open = false;
      GameContext.log?.addEntry(`You close the ${this.name}.`, "lightgreen");
      if (this.gameObject) {
        this.gameObject.setAlpha(1);
      }
    }
  }

  lockpick(player, item) {
    if (!player.hasSkill("Lockpicking", this.skill)) {
      GameContext.log?.addEntry(`You need a higher skill level in Lockpicking to unlock the ${this.name}.`, "orange");
      return false;
    }
    this.setKey(null);
    this.open();

    GameContext.log?.addEntry(`You use the ${item.name} to unlock the ${this.name}.`, "green");
    return true;
  }

  open() {
    if (this.key) {
      GameContext.log?.addEntry(`The ${this.name} is locked. You need the '${this.key.name}' to open it.`, "orange");
      return;
    }

    if (this.locks > 0) {
      GameContext.log?.addEntry(`The ${this.name} is locked but has no keyholes.`, "orange");
      return;
    }

    if (!this.isOpen()) {
      this._open = true;
      GameContext.log?.addEntry(`You open the ${this.name}.`, "lightgreen");
      if (this.gameObject) {
        this.gameObject.setAlpha(0.5);
      }
    }
  }

  render() {
    this.gameObject = this.scene.add.image(this._x * TILE_SIZE, this._y * TILE_SIZE, this.sprite).setOrigin(0);

    this.gameObject.setDepth(RENDER_DEPTH.door);
    if (!this.isOpen()) {
      this.gameObject.setAlpha(1);
    } else {
      this.gameObject.setAlpha(0.5);
    }

    this.gameObject.setVisible(this._visible && this._levelVisible);
  }
}
