import { Condition } from "@/classes/Condition.js";

export const SPECIAL_TILES = {
  water: {
    name: "Water",
    symbol: "♒",
    walkable: true,
    requiredSkill: "Swimming",
    requiredSkillLevel: 1,
    blockedMessage: "You need the 'Swimming' skill to cross the water.",
  },
  deepwater: {
    name: "Deep Water",
    symbol: "☰",
    walkable: true,
    requiredSkill: "Swimming",
    requiredSkillLevel: 2,
    blockedMessage: "You need the 'Swimming' skill (2) to cross the deep water.",
  },
  mud: {
    name: "Mud",
    symbol: "┉",
    walkable: true,
    requiredSkill: "Swimming",
    requiredSkillLevel: 3,
    blockedMessage: "You need the 'Swimming' skill (3) to cross the mud.",
  },
  lava: {
    name: "Lava",
    symbol: "░",
    walkable: true,
    damage: 5,
    damageType: "fire",
    stepMessage: "The lava burns the feet!",
  },
  slime: {
    name: "Slime",
    symbol: "▁",
    walkable: true,
    stepMessage: "The slime is sticky and mildly corrosive.",
    conditions: [new Condition(null, "Slimey", 3, "green", 1)],
  },
};
