import { RENDER_DEPTH } from "@/config/game.js";

export const playBloodSplatter = (scene, x, y) => {
  const textureKey = "blood-particle";

  if (!scene.textures.exists(textureKey)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xaa0000, 1);
    g.fillRect(0, 0, 8, 8);
    g.generateTexture(textureKey, 8, 8);
    g.destroy();
  }

  const emitter = scene.add.particles(0, 0, textureKey, {
    speed: { min: 25, max: 130 },
    angle: { min: 200, max: 340 },
    scale: { start: 1, end: 0 },
    lifespan: { min: 180, max: 800 },
    quantity: 16,
    gravityY: 250,
    tint: [0xff0000],
    blendMode: "NORMAL",
    emitting: false,
  });

  emitter.explode(16, x, y);
  emitter.setDepth(RENDER_DEPTH.actor + 1);
  scene.time.delayedCall(800, () => emitter.destroy());
};

export const playPotionEffect = (scene, x, y) => {
  const textureKey = "heal-particle";
  const color = 0xaa00ff;

  if (!scene.textures.exists(textureKey)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture(textureKey, 8, 8);
    g.destroy();
  }

  const emitter = scene.add.particles(0, 0, textureKey, {
    speed: { min: 20, max: 60 },
    angle: { min: -85, max: -95 },
    scale: { start: 1, end: 0 },
    lifespan: { min: 300, max: 600 },
    quantity: 12,
    gravityY: -100,
    tint: [color],
    blendMode: "ADD",
    emitting: false,
  });

  emitter.explode(12, x + 16, y + 16);
  emitter.setDepth(RENDER_DEPTH.actor + 1);
  scene.time.delayedCall(600, () => emitter.destroy());
};

export const playFireBurst = (scene, x, y) => {
  const coreTexture = "fire-particle-core";
  const emberTexture = "fire-particle-ember";
  const smokeTexture = "fire-particle-smoke";

  if (!scene.textures.exists(coreTexture)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(5, 5, 5);
    g.generateTexture(coreTexture, 10, 10);
    g.destroy();
  }

  if (!scene.textures.exists(emberTexture)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture(emberTexture, 6, 6);
    g.destroy();
  }

  if (!scene.textures.exists(smokeTexture)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(6, 6, 6);
    g.generateTexture(smokeTexture, 12, 12);
    g.destroy();
  }

  const flameEmitter = scene.add.particles(0, 0, coreTexture, {
    speed: { min: 80, max: 260 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.3, end: 0 },
    lifespan: { min: 180, max: 360 },
    quantity: 24,
    gravityY: -40,
    tint: [0xffffaa, 0xffdd55, 0xffa500, 0xff5500],
    blendMode: "ADD",
    emitting: false,
  });

  const emberEmitter = scene.add.particles(0, 0, emberTexture, {
    speed: { min: 60, max: 220 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    lifespan: { min: 260, max: 700 },
    quantity: 20,
    gravityY: 220,
    tint: [0xffcc55, 0xff8800, 0xff3300],
    blendMode: "ADD",
    emitting: false,
  });

  const smokeEmitter = scene.add.particles(0, 0, smokeTexture, {
    speed: { min: 30, max: 110 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.1, end: 2.2 },
    alpha: { start: 0.45, end: 0 },
    lifespan: { min: 500, max: 1000 },
    quantity: 14,
    gravityY: -120,
    tint: [0x666666, 0x444444, 0x222222],
    blendMode: "NORMAL",
    emitting: false,
  });

  flameEmitter.explode(24, x, y);
  emberEmitter.explode(20, x, y);
  smokeEmitter.explode(14, x, y);

  flameEmitter.setDepth(RENDER_DEPTH.actor + 1);
  emberEmitter.setDepth(RENDER_DEPTH.actor + 1);
  smokeEmitter.setDepth(RENDER_DEPTH.actor + 1);

  scene.time.delayedCall(1100, () => {
    flameEmitter.destroy();
    emberEmitter.destroy();
    smokeEmitter.destroy();
  });
};

export const playPoisonCloud = (scene, x, y,color) => {
  const sporeTexture = "poison-cloud-spore";
  const hazeTexture = "poison-cloud-haze";

  if (!scene.textures.exists(sporeTexture)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture(sporeTexture, 6, 6);
    g.destroy();
  }

  if (!scene.textures.exists(hazeTexture)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(8, 8, 8);
    g.generateTexture(hazeTexture, 16, 16);
    g.destroy();
  }

  const hazeEmitter = scene.add.particles(0, 0, hazeTexture, {
    speed: { min: 10, max: 55 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 1.8 },
    alpha: { start: 0.45, end: 0 },
    lifespan: { min: 650, max: 1200 },
    quantity: 16,
    gravityY: -25,
    tint: color ?? [0xb7ff7a, 0x7fe35a, 0x4caf50, 0x2e7d32],
    blendMode: "SCREEN",
    emitting: false,
  });

  const sporeEmitter = scene.add.particles(0, 0, sporeTexture, {
    speed: { min: 20, max: 90 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 0.9, end: 0 },
    lifespan: { min: 350, max: 850 },
    quantity: 24,
    gravityY: -10,
    tint: color ?? [0xe6ff9a, 0x9cff57, 0x6ddc3a, 0x3b8f2f],
    blendMode: "ADD",
    emitting: false,
  });

  hazeEmitter.explode(16, x, y);
  sporeEmitter.explode(24, x, y);

  hazeEmitter.setDepth(RENDER_DEPTH.actor + 1);
  sporeEmitter.setDepth(RENDER_DEPTH.actor + 1);

  scene.time.delayedCall(1250, () => {
    hazeEmitter.destroy();
    sporeEmitter.destroy();
  });
};

export const playHealEffect = (scene, x, y) => {
  const textureKey = "heal-plus-particle";

  if (!scene.textures.exists(textureKey)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(3, 1, 2, 6);
    g.fillRect(1, 3, 6, 2);
    g.generateTexture(textureKey, 8, 8);
    g.destroy();
  }

  const emitter = scene.add.particles(0, 0, textureKey, {
    speed: { min: 30, max: 85 },
    angle: { min: -110, max: -70 },
    rotate: { min: -25, max: 25 },
    scale: { start: 1.1, end: 0.5 },
    alpha: { start: 1, end: 0 },
    lifespan: { min: 500, max: 900 },
    quantity: 12,
    gravityY: -35,
    tint: [0x00ff00],
    blendMode: "ADD",
    emitting: false,
  });

  emitter.explode(12, x, y - 6);
  emitter.setDepth(RENDER_DEPTH.actor + 1);
  scene.time.delayedCall(1000, () => emitter.destroy());
};

export const playNecromancyEffect = (scene, x, y) => {
  const skullTexture = "necromancy-skull";

  if (!scene.textures.exists(skullTexture)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture(skullTexture, 8, 8);
    g.destroy();
  }

  const emitter = scene.add.particles(0, 0, skullTexture, {
    speed: { min: 30, max: 100 },
    angle: { min: -85, max: -95 },
    scale: { start: 1.2, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: { min: 400, max: 900 },
    quantity: 14,
    gravityY: -30,
    tint: [0xffffff, 0xdddddd, 0xbbbbbb],
    blendMode: "ADD",
    emitting: false,
  });

  emitter.explode(14, x, y);
  emitter.setDepth(RENDER_DEPTH.actor + 1);
  scene.time.delayedCall(900, () => emitter.destroy());
};

export const playFrostbite = (scene, x, y) => {
  const shardTexture = "frostbite-shard";

  if (!scene.textures.exists(shardTexture)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x95d7e8, 1);
    g.beginPath();
    g.moveTo(4, 0);
    g.lineTo(8, 4);
    g.lineTo(4, 12);
    g.lineTo(0, 4);
    g.closePath();
    g.fillPath();
    g.generateTexture(shardTexture, 8, 12);
    g.destroy();
  }

  const shardEmitter = scene.add.particles(0, 0, shardTexture, {
    speed: { min: 70, max: 190 },
    angle: { min: 0, max: 360 },
    rotate: { min: 0, max: 360 },
    scale: { start: 1.1, end: 0.2 },
    alpha: { start: 1, end: 0.2 },
    lifespan: { min: 260, max: 520 },
    quantity: 18,
    gravityY: 40,
    tint: [0x95d7e8],
    blendMode: "ADD",
    emitting: false,
  });

  shardEmitter.explode(18, x, y);
  shardEmitter.setDepth(RENDER_DEPTH.actor + 1);
  scene.time.delayedCall(950, () => {
    shardEmitter.destroy();
  });
};
