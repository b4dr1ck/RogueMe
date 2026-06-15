import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";

export class Note {
  constructor(scene, name, text, x, y, sprite, deleteOnRead = true) {
    this.scene = scene;
    this.name = name;
    this.text = text;
    this._x = x;
    this._y = y;
    this.sprite = sprite;
    this.deleteOnRead = deleteOnRead;

    this.gameObject = null;
  }

  get position() {
    return { x: this._x, y: this._y };
  }

  set position({ x, y }) {
    this._x = x;
    this._y = y;
    if (this.gameObject) {
      this.gameObject.setPosition(x, y);
    }
  }

  getDeleteOnRead() {
    return this.deleteOnRead;
  }

  getText() {
    return this.text;
  }

  getName() {
    return this.name;
  }

  destroy() {
    if (this.gameObject) {
      this.gameObject.destroy();
      this.gameObject = null;
    }
  }

  render() {
    this.gameObject = this.scene.add.image(this._x * TILE_SIZE, this._y * TILE_SIZE, this.sprite).setOrigin(0);
    this.gameObject.setDepth(RENDER_DEPTH.item);
  }
}
