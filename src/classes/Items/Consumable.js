import { Item } from "./Item.js";
import { playPotionEffect } from "@/animation/particles.js";
import { TILE_SIZE } from "@/config/game.js";

export class Consumable extends Item {
  use(target = this.scene.player) {
    if (!target || !this.effects) {
      return false;
    }

    playPotionEffect(this.scene, target.position.x * TILE_SIZE, target.position.y * TILE_SIZE);

    if (this.effects.maxStats && !this.applyMaxStatEffects(target, this.effects.maxStats)) {
      return false;
    }
    if (this.effects.stats && !this.applyStatEffects(target, this.effects.stats)) {
      return false;
    }
    if (this.effects.conditions && !this.applyConditionEffects(target, this.effects.conditions)) {
      return false;
    }
    if (this.effects.resistances && !this.applyResistanceEffects(target, this.effects.resistances)) {
      return false;
    }
    if (this.effects.cure && !this.applyCureEffects(target, this.effects.cure)) {
      return false;
    }
    if (this.effects.food && !this.applyFoodEffects(target, this.effects.food)) {
      return false;
    }

    return true;
  }
}
