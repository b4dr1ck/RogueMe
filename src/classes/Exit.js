
import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";

export class Exit {
  constructor(scene, x, y, symbol, color, targetLevelIndex, targetX, targetY) {
    this.scene = scene;
    this._x = x;
    this._y = y;
    this.symbol = symbol;
    this.color = color;
    this.targetLevelIndex = targetLevelIndex;
    this.targetX = targetX;
    this.targetY = targetY;
    this.name ="Exit";

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

  render() {
    if (this.symbol === " ") {
      return;
    }
    if (!this.gameObject) {
      this.gameObject = this.scene.add.image(this._x * TILE_SIZE, this._y * TILE_SIZE, this.color).setOrigin(0);
      this.gameObject.setDepth(RENDER_DEPTH.exit ?? RENDER_DEPTH.deco + 1);
    }
  }
}
