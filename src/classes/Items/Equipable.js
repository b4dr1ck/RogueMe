import { Item } from "./Item.js";

export class Equipable extends Item {
  constructor(scene, name, sprite, type, x, y, visible = true, effects = {}, slot = null) {
    super(scene, name, sprite, type, x, y, visible, effects);
    this.slot = slot;
  }
  use(target = this.scene.player) {
    if (!target.equip(this, this.slot)) {
      return false;
    }

    if (this.effects.maxStats && !this.applyMaxStatEffects(target, this.effects.maxStats)) {
      return false;
    }
    if (this.effects.stats && !this.applyStatEffects(target, this.effects.stats)) {
      return false;
    }
    if (this.effects.resistances && !this.applyResistanceEffects(target, this.effects.resistances)) {
      return false;
    }
  }
}
