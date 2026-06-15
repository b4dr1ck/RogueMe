
export const TRAPS = {
  spiketrap: {
    name: "Spike Trap",
    sprite: "spikes1a",
    dmg: 2,
    skill: 1,
  },
  firetrap: {
    name: "Fire Trap",
    sprite: "gastrap",
    dmg: 3,
    skill: 2,
    condition: { name: "Burning", duration: 3, color: "orange" },
  },
  confusiontrap: {
    name: "Confusion Trap",
    sprite: "gastrap",
    dmg: 0,
    condition: { name: "Confusion", duration: 10, color: "purple" },
    skill: 2,
  },
  poisentrap: {
    name: "Poison Trap",
    sprite: "gastrap",
    dmg: 0,
    condition: { name: "Poison", duration: 5, color: "green" },
    skill: 2,
  },
  spiderweb: {
    name: "Spider Web",
    sprite: "web",
    dmg: 0,
    condition: { name: "Slow", duration: 5, color: "lightgray" },
    skill: 1,
  },
  archertrap: {
    name: "Archer Trap",
    sprite: "archertrap",
    dmg: 2,
    skill: 3,
    range: 2,
  },
};
