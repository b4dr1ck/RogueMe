export const ATTACKS = {
  snap: { name: "Snap", dmg: [1, 2], cooldown: 1, hits: 2 },
  strike: { name: "Strike", dmg: [1, 2], cooldown: 1 },
  doublestrike: { name: "Double Strike", dmg: [1, 4], cooldown: 3, hits: 2 },
  slash: {
    name: "Slash",
    dmg: [1, 2],
    cooldown: 1,
  },
  stab: { name: "Stab", dmg: [1, 3], cooldown: 2 },
  claw: { name: "Claw", dmg: [1, 2], cooldown: 1 },
  bite: { name: "Poisoned Bite", dmg: [0, 1], condition: { name: "Poison", duration: 5, color: "green" }, cooldown: 5 },
  bite2: {
    name: "Diseased Bite",
    dmg: [1, 3],
    condition: { name: "Disease", duration: 10, color: "brown" },
    cooldown: 5,
  },
  stone: { name: "Stone", dmg: [1, 2], cooldown: 3, range: 5 },
  smash: { name: "Smash", dmg: [2, 4], cooldown: 2 },
  stomp: {
    name: "Stomp",
    dmg: [2, 4],
    aoe: 2,
    cooldown: 5,
    condition: { name: "Paralysis", duration: 3, color: "yellow", chance: 0.5 },
  },
  confusion: {
    name: "Confusion",
    cooldown: 5,
    condition: { name: "Confusion", duration: 10, color: "purple", chance: 1 },
  },
};
