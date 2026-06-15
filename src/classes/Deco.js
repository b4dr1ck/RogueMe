
import { RENDER_DEPTH, TILE_SIZE } from "@/config/game.js";

export class Deco {
  constructor(scene, x, y, symbol, color, solid = false) {
    this.scene = scene;
    this._x = x;
    this._y = y;
    this.symbol = symbol;
    this.color = color;
    this.solid = solid;
    this.gameObject = null;
  }

  getSolid() {
    return this.solid;
  }

  set position({ x, y }) {
    this._x = x;
    this._y = y;
    if (this.gameObject) {
      this.gameObject.setPosition(x * TILE_SIZE, y * TILE_SIZE);
    }
  }

  get position() {
    return { x: this._x, y: this._y };
  }

  render() {
    if (!this.gameObject) {
      this.gameObject = this.scene.add.image(this._x * TILE_SIZE, this._y * TILE_SIZE, this.color).setOrigin(0);
      this.gameObject.setDepth(RENDER_DEPTH.deco);
    }
  }
}
