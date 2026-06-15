import { Item } from "./Item.js";

export class Tool extends Item {
  constructor(scene, name, sprite, type, x, y, visible = true, effects = {}, durability = 1) {
    super(scene, name, sprite, type, x, y, visible, effects);
    this.durability = durability;
  }

  getDurability() {
    return this.durability;
  }

  decreaseDurability() {
    this.durability--;
  }

  use(target = this.scene.player) {
    if (!target || !this.effects?.functionality) {
      return false;
    }
    const toolEffect = this.effects.functionality;

    switch (toolEffect) {
      case "unlock":
        return target.unlock(this);
      case "disarm":
        return target.disarm(this);
      case "dig":
        return target.dig(this);
      case "mining":
        return target.mine(this);
    }
  }
}
