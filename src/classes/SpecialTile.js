import { GameContext } from "@/services/GameContext.js";

export class SpecialTile {
  constructor(
    scene,
    {
      name,
      symbol,
      walkable = true,
      requiredSkill = null,
      requiredSkillLevel = 1,
      damage = 0,
      damageType = null,
      conditions = [],
      blockedMessage = null,
      stepMessage = null,
    },
  ) {
    this.scene = scene;
    this.name = name;
    this.symbol = symbol;
    this.walkable = walkable;
    this.requiredSkill = requiredSkill;
    this.requiredSkillLevel = requiredSkillLevel;
    this.damage = damage;
    this.damageType = damageType;
    this.blockedMessage = blockedMessage;
    this.stepMessage = stepMessage;
    this.conditions = conditions;
  }

  isWalkableBy(actor = null) {
    if (!this.walkable) {
      return false;
    }

    if (!this.requiredSkill) {
      return true;
    }

    if (!actor || typeof actor.hasSkill !== "function") {
      return false;
    }

    return actor.hasSkill(this.requiredSkill, this.requiredSkillLevel);
  }

  logBlocked(actor = null) {
    const actorName = actor?.constructor?.name === "Player" ? "You" : (actor?.name ?? "This actor");
    const message =
      this.blockedMessage ??
      `${actorName} need${actorName === "You" ? "" : "s"} ${this.requiredSkill} (Lv ${this.requiredSkillLevel}) to enter ${this.name}.`;
    GameContext.log?.addEntry(message, "orange");
  }

  onStep(actor) {
    if (!actor || typeof actor.takeDamage !== "function") {
      return;
    }

    if (this.stepMessage) {
      GameContext.log?.addEntry(this.stepMessage, "orange");
    }

    if (this.damage > 0) {
      actor.takeDamage(this.damage, this.damageType);
    }

    if (this.conditions.length > 0) {
      this.conditions.forEach((cond) => {
        const conditionInstance = cond.clone();
        actor.addCondition(conditionInstance);
      });
    }
  }
}
