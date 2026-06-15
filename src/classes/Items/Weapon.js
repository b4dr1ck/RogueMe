import { Equipable } from "./Equipable.js";

export class Weapon extends Equipable {
  constructor(scene, name, sprite, type, x, y, visible = true, effects = {}, slot = null, weaponType = "melee", range = 1) {
    super(scene, name, sprite, type, x, y, visible, effects, slot);
    this.weaponType = weaponType;
    this.range = range;
  }

  getWeaponType() {
    return this.weaponType;
  }

  getRange() {
    return this.range;
  }
}
