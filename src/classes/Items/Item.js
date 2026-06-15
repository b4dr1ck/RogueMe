import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";

export class Item {
  constructor(scene, name, sprite, type, x, y, visible = true, effects = {}) {
    this.scene = scene;
    this.name = name;
    this.sprite = sprite;
    this._x = x;
    this._y = y;
    this.type = type;
    this.visible = visible;
    this.effects = effects;

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

  // Overridden by subclasses
  use(_target = this.scene.player) {
    return false;
  }

  applyCureEffects(target, cureValues) {
    if (!Array.isArray(cureValues) || cureValues.length === 0) {
      return false;
    }
    cureValues.forEach((cureValue) => {
      target.removeCondition(cureValue);
    });
    return true;
  }

  applyFoodEffects(target, foodValue) {
    if (typeof foodValue !== "number" || Number.isNaN(foodValue) || foodValue === 0) {
      return false;
    }
    target.setFood(foodValue);
    return true;
  }

  applyStatEffects(target, stats = {}) {
    for (const [stat, value] of Object.entries(stats ?? {})) {
      if (!target.stats?.[stat] || typeof value !== "number" || Number.isNaN(value) || value === 0) {
        return false;
      }
      target.setStats(stat, value);
    }
    return true;
  }

  applyMaxStatEffects(target, maxStats = {}) {
    for (const [stat, value] of Object.entries(maxStats ?? {})) {
      if (!target.stats?.[stat] || typeof value !== "number" || Number.isNaN(value)) {
        return false;
      }
      target.setMaxStats(stat, value);
    }
    return true;
  }

  applyConditionEffects(target, conditions = []) {
    conditions?.forEach((condition) => {
      target.addCondition?.(condition.clone());
    });
    return true;
  }

  applyResistanceEffects(target, resistances = {}) {
    for (const [element, value] of Object.entries(resistances ?? {})) {
      if (!target.resistances || typeof value !== "number" || Number.isNaN(value)) {
        return false;
      }
      target.setResistance(element, value);
    }
    return true;
  }

  getVisible() {
    return this.visible;
  }

  toggleVisibility() {
    this.visible = !this.visible;
    if (this.gameObject) {
      this.gameObject.setVisible(this.visible);
    }
  }

  destroy() {
    if (this.gameObject) {
      this.gameObject.destroy();
      this.gameObject = null;
    }
  }

  render(offset = 0) {
    if (this.gameObject) {
      this.gameObject.destroy();
      this.gameObject = null;
    }

    this.gameObject = this.scene.add.image((this._x + offset / TILE_SIZE) * TILE_SIZE, (this._y - offset / TILE_SIZE) * TILE_SIZE, this.sprite).setOrigin(0);
    this.gameObject.setDepth(RENDER_DEPTH.item);
    this.gameObject.setVisible(this.visible);
  }
}
