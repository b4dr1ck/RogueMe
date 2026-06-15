export const playJumpAnimation = (scene, player, baseY) => {
  player.gameObject.alpha = 1;
  scene.tweens.killTweensOf(player.gameObject);
  scene.tweens.add({
    targets: player.gameObject,
    y: baseY - 8,
    duration: 70,
    yoyo: true,
    ease: "Sine.Out",
  });
};

export const playDashAnimation = (scene, player, dx, dy, repeat = 0) => {
  player.gameObject.alpha = 1;
  scene.tweens.killTweensOf(player.gameObject);
  const originalX = player.gameObject.x;
  const originalY = player.gameObject.y;
  scene.tweens.add({
    targets: player.gameObject,
    x: originalX + dx * 16,
    y: originalY + dy * 16,
    duration: 50,
    repeat,
    yoyo: true,
    ease: "Sine.Out",
  });
};

export const playTeleportAnimation = (scene, player) => {
  scene.tweens.killTweensOf(player.gameObject);
  scene.tweens.add({
    targets: player.gameObject,
    alpha: 0,
    duration: 200,
    ease: "Quad.Out",
    onComplete: () => {
      player.gameObject.alpha = 1;
    },
  });
};


export const shakeCamera = (scene, player) => {
  scene.cameras.main.shake(120, 0.004);
  scene.tweens.killTweensOf(player.sprite);
  scene.tweens.add({
    targets: player.sprite,
    angle: 90,
    alpha: 0.95,
    duration: 180,
    ease: "Quad.Out",
  });
};

export const shootArrow = (scene, actor, targetX, targetY, color = Phaser.Display.Color.GetColor(160, 82, 45)) => {
  const arrow = scene.add.rectangle(actor.gameObject.x + 16, actor.gameObject.y + 16, 8, 8, color);
  scene.tweens.killTweensOf(actor.gameObject);
  scene.tweens.add({
    targets: arrow,
    x: targetX,
    y: targetY,
    duration: 100,
    ease: "Linear",
    onComplete: () => {
      arrow.destroy();
    },
  });
};
