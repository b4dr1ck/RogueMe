import { Consumable } from "./Consumable.js";
import { Spell } from "@/classes/Spell.js";
import { SPELLS } from "@/config/spells.js";
import { GameContext } from "@/services/GameContext.js";

export class Scroll extends Consumable {
  use(target = this.scene.player) {
    if (!target || !this.effects?.cast) {
      return false;
    }

    const spellConfig = SPELLS[this.effects.cast];
    if (!spellConfig) {
      GameContext.log?.addEntry(`The "${this.name}" fizzles.`, "orange");
      return false;
    }

    const effects = {
      stats: spellConfig.stats ?? {},
      extra: spellConfig.extra ?? {},
      hits: spellConfig.hits ?? 1,
      conditions: spellConfig.conditions ?? [],
      typeBasedDamage: spellConfig.typeBasedDamage ?? {},
    };

    const spell = new Spell(
      this.scene,
      spellConfig.name,
      spellConfig.sprite,
      spellConfig.color,
      spellConfig.type,
      0,
      spellConfig.aoe,
      spellConfig.singleTarget,
      effects,
    );

    return spell.cast(target);
  }
}
