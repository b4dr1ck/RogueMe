import { Item } from "./Item.js";
import { SPELLS } from "@/config/spells.js";

export class Readable extends Item {
  use(target = this.scene.player) {
    let deleteOnUse = false;
    if (this.effects.learn) {
      for (const toLearn of this.effects.learn) {
        // learn a spell
        if (SPELLS[toLearn]) {
          target.addSpell(SPELLS[toLearn]);
          deleteOnUse = true;
        } else {
          // learn a skill
          target.addSkill(toLearn);
          deleteOnUse = true;
        }
      }
    }
    return deleteOnUse;
  }
}
