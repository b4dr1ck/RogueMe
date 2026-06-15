import { TILE_SIZE } from "@/config/game.js";
import { GameContext } from "@/services/GameContext.js";
import { normalizeColor } from "@/utils/color.js";

export class Actor {
  constructor(scene, name, sprite, x, y, resistances = null) {
    this.scene = scene;
    this.name = name;
    this.sprite = sprite;
    this._x = x;
    this._y = y;
    this.gameObject = null;
    this.alive = true;
    this.conditions = [];
    this.conditionIndicators = [];
    this.resistances = {
      fire: 0,
      water: 0,
      earth: 0,
      air: 0,
      physical: 0,
      poison: 0,
      bleeding: 0,
      confusion: 0,
      paralysis: 0,
      petrified: 0,
      blindness: 0,
    };

    if (resistances) {
      this.setResistances(resistances);
    }
  }

  get position() {
    return { x: this._x, y: this._y };
  }

  set position({ x, y }) {
    this._x = x;
    this._y = y;
    if (this.gameObject) {
      this.gameObject.setPosition(this._x * TILE_SIZE, this._y * TILE_SIZE);
    }
    this.updateConditionIndicatorPositions();
  }

  getName() {
    return this.name;
  }

  getGameObject() {
    return this.gameObject;  
  }

  hasLineOfSight(targetX, targetY) {
    const map = this.scene.currentLevel.getMap();
    const level = this.scene.currentLevel;
    const lineTiles = this.#getLine(this._x, this._y, targetX, targetY);

    // Skip source and target tile; only blockers in-between matter.
    for (let i = 1; i < lineTiles.length - 1; i += 1) {
      const { x, y } = lineTiles[i];
      const tile = map.getTile(x, y);
      const hasClosedDoor = level.getEntitiesAt(x, y)?.some((e) => e.constructor.name === "Door" && !e.isOpen());
      if (!this.scene.movementController.isWalkable(tile) || hasClosedDoor) {
        return false;
      }
    }

    return true;
  }

  #getLine(x0, y0, x1, y1) {
    const points = [];
    let x = x0;
    let y = y0;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      points.push({ x, y });
      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return points;
  }

  getConditions() {
    return this.conditions;
  }

  hasCondition(conditionName) {
    return this.conditions.some((cond) => cond.name === conditionName);
  }

  addCondition(condition) {
    if (!condition?.name) {
      return;
    }
    const existing = this.conditions.find((cond) => cond?.name === condition.name);
    if (existing) {
      existing.duration = Math.max(existing.duration, condition.duration);
      GameContext.log?.addEntry(this._conditionRefreshedMsg(condition.name, existing.duration), "orange");
      return;
    }
    this.conditions.push(condition);
    condition.onApply?.(this);
    this.refreshConditionIndicators();
    GameContext.log?.addEntry(this._conditionAddedMsg(condition.name, condition.duration), "orange");
  }

  removeCondition(conditionName) {
    if (!conditionName) {
      return;
    }
    this.conditions
      .filter((cond) => cond?.name === conditionName)
      .forEach((cond) => {
        cond.onRemove?.(this);
      });
    this.conditions = this.conditions.filter((cond) => cond?.name !== conditionName);
    this.refreshConditionIndicators();
    GameContext.log?.addEntry(this._conditionRemovedMsg(conditionName), "green");
  }

  tickConditions() {
    this.conditions.forEach((condition) => {
      if (!condition || !this.alive) {
        return;
      }
      if (condition.tick()) {
        this.removeCondition(condition.name);
      } else {
        condition.impact(this);
      }
    });
  }

  resolveMovementIntent(dx, dy, rng = Math.random) {
    return this.conditions.reduce(
      (movement, condition) => {
        if (!condition?.modifyMovement) {
          return movement;
        }
        return condition.modifyMovement(this, movement, rng);
      },
      { dx, dy },
    );
  }

  moveTo(x, y) {
    this.position = { x, y };
  }

  setResistances(resistances = {}) {
    for (const [element, value] of Object.entries(resistances ?? {})) {
      if (!Object.hasOwn(this.resistances, element) || typeof value !== "number" || Number.isNaN(value)) {
        continue;
      }
      this.resistances[element] = value;
    }
    this.normalizeResistances();
  }

  normalizeResistances() {
    for (const element in this.resistances) {
      this.resistances[element] = Math.min(100, this.resistances[element]);
    }
  }

  setResistance(element, amount, onlySet = false) {
    if (!this.resistances || !Object.hasOwn(this.resistances, element)) {
      return;
    }

    if (onlySet) {
      this.resistances[element] = amount;
    } else {
      this.resistances[element] += amount;
    }

    this.normalizeResistances();
  }

  applyResistance(amount, element = null) {
    if (!element || !this.resistances || !Object.hasOwn(this.resistances, element)) {
      return amount;
    }

    const resistance = this.resistances[element];
    if (!resistance) {
      return amount;
    }

    amount -= (amount * resistance) / 100;
    return amount > 0 ? Math.ceil(amount) : 0;
  }

  getResistances(element = null) {
    if (element) {
      return this.resistances?.[element] ?? 0;
    }
    return this.resistances;
  }

  destroy() {
    this.clearConditionIndicators();
    if (this.gameObject) {
      this.gameObject.destroy();
      this.gameObject = null;
    }
  }

  setVisible(visible) {
    this.gameObject?.setVisible(visible);
    this.conditionIndicators.forEach((icon) => icon.setVisible(visible));
  }

  clearConditionIndicators() {
    this.conditionIndicators.forEach((icon) => icon.destroy());
    this.conditionIndicators = [];
  }

  refreshConditionIndicators() {
    this.clearConditionIndicators();

    if (!this.gameObject || !this.conditions.length) {
      return;
    }

    const iconSize = 7;
    const iconSpacing = 2;
    const maxIcons = 6;
    const visibleConditions = this.conditions.slice(0, maxIcons);
    const totalWidth = visibleConditions.length * iconSize + Math.max(0, visibleConditions.length - 1) * iconSpacing;
    const baseX = this._x * TILE_SIZE + (TILE_SIZE - totalWidth) / 2;
    const y = this._y * TILE_SIZE - iconSize - 2;

    visibleConditions.forEach((condition, index) => {
      const fillColor = normalizeColor(condition?.color, 0xffffff);
      const x = baseX + index * (iconSize + iconSpacing);
      const icon = this.scene.add.rectangle(x, y, iconSize, iconSize, fillColor, 0.95).setOrigin(0, 0);
      icon.setDepth((this.gameObject.depth ?? 1) + 1);
      icon.setStrokeStyle(1, 0x000000, 1);
      this.conditionIndicators.push(icon);
    });
  }

  updateConditionIndicatorPositions() {
    if (!this.conditionIndicators.length) {
      return;
    }

    const iconSize = 7;
    const iconSpacing = 2;
    const totalWidth = this.conditionIndicators.length * iconSize + Math.max(0, this.conditionIndicators.length - 1) * iconSpacing;
    const baseX = this._x * TILE_SIZE + (TILE_SIZE - totalWidth) / 2;
    const y = this._y * TILE_SIZE - iconSize - 2;

    this.conditionIndicators.forEach((icon, index) => {
      icon.setPosition(baseX + index * (iconSize + iconSpacing), y);
    });
  }

  _conditionAddedMsg(conditionName, duration) {
    return `${this.name} is now affected by ${conditionName} for ${duration} turns!`;
  }

  _conditionRefreshedMsg(conditionName, duration) {
    return `The ${conditionName} condition duration has been refreshed to ${duration} turns!`;
  }

  _conditionRemovedMsg(conditionName) {
    return `${this.name} is no longer affected by ${conditionName}!`;
  }
}
