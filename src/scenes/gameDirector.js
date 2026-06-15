import { GameContext } from "@/services/GameContext.js";
import { TILE_SIZE, CAMERA_ZOOM, WORLD_VIEW } from "@/config/game.js";

// ─── Camera configuration ─────────────────────────────────────────────────────

function updateCameraTarget(scene) {
  if (!scene.cameraTarget || !scene.player) return;
  const { x, y } = scene.player.position;
  scene.cameraTarget.setPosition((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
}

export function syncCameraLayers(scene) {
  if (!scene.cameras?.main || !scene.uiCamera) return;

  const uiObjects = [...(scene.hud?.lineObjects ?? []), ...(scene.log?.lineObjects ?? []), scene.cameraTarget].filter(
    Boolean,
  );

  // World camera ignores HUD/log text and the invisible follow-target
  scene.cameras.main.ignore(uiObjects);

  // UI camera ignores all world objects (tiles, actors, fog, …)
  const worldObjects = scene.children.list.filter((o) => !uiObjects.includes(o));
  scene.uiCamera.ignore(worldObjects);
}

export function setupCamera(scene) {
  const mapDefinition = scene.currentLevel?.getMap()?.getDefinition();
  if (!mapDefinition?.length || !mapDefinition[0]?.length) return;

  const worldWidth = mapDefinition[0].length * TILE_SIZE;
  const worldHeight = mapDefinition.length * TILE_SIZE;

  // ── World camera: 640 × 640 viewport, zoom ×2, follows stable tile target ──
  const cam = scene.cameras.main;
  cam.setViewport(WORLD_VIEW.x, WORLD_VIEW.y, WORLD_VIEW.width, WORLD_VIEW.height);
  cam.setBounds(0, 0, worldWidth, worldHeight);
  cam.setZoom(CAMERA_ZOOM);
  cam.roundPixels = true;

  // Invisible 1×1 point that sits at the player's tile centre.
  // The camera follows this – not player.gameObject – to stay shake-free.
  if (!scene.cameraTarget) {
    scene.cameraTarget = scene.add.rectangle(0, 0, 2, 2, 0x000000, 0);
  }
  updateCameraTarget(scene);
  cam.startFollow(scene.cameraTarget, true);

  // ── UI camera: full screen, zoom 1, locked scroll ──────────────────────────
  if (!scene.uiCamera) {
    const ui = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height);
    ui.setScroll(0, 0);
    ui.setZoom(1);
    ui.roundPixels = true;
    ui.transparent = true;
    scene.uiCamera = ui;
  }

  syncCameraLayers(scene);
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Level Rendering ─────────────────────────────────────────────────────

export function clearLevelDisplay(scene) {
  scene.currentLevel?.setVisible(false);
  scene.fogOfWar?.setVisible(false);

  if (scene.player) {
    scene.player.setVisible(false);
  }
}

export function renderCurrentLevel(scene) {
  scene.currentLevel.ensureRendered();
  scene.currentLevel.setVisible(true);
  scene.fogOfWar?.setVisible(true);

  if (!scene.player.gameObject) {
    scene.player.render();
  } else {
    scene.player.setVisible(true);
  }

  scene.fogOfWar?.updateForPlayer();

  scene.hud.update();
  setupCamera(scene);
}

// ─────────────────────────────────────────────────────────────────────────────

export function transitionToLevel(scene, levelIndex, spawnX = 1, spawnY = 1) {
  if (scene.player?.gameObject) {
    // Prevent leftover movement tweens (jump/dash) from causing a visual snap after level change
    scene.tweens.killTweensOf(scene.player.gameObject);
    scene.player.gameObject.setAlpha(1);
  }

  clearLevelDisplay(scene);

  scene.blood.clearBlood();

  scene.player.levelIndex = levelIndex;
  scene.currentLevel = scene.levels[levelIndex];
  scene.player.moveTo(spawnX, spawnY);

  // Ensure exact final visual position after tween cancellation
  if (scene.player?.gameObject) {
    scene.player.gameObject.setPosition(scene.player.position.x * TILE_SIZE, scene.player.position.y * TILE_SIZE);
  }

  renderCurrentLevel(scene);
  GameContext.log?.addEntry(`You've entered '${scene.currentLevel.getMap().name}'`, "lightgreen");
}

export function onInputMove(scene, { dx, dy }) {
  const player = scene.player;
  if (!player.alive) return;

  const ic = scene.interactionController;
  const movementIntent = player.resolveMovementIntent(dx, dy);
  const intentDx = movementIntent.dx;
  const intentDy = movementIntent.dy;
  const { x: startX, y: startY } = player.position;
  const targetX = startX + intentDx;
  const targetY = startY + intentDy;
  const hasMovementIntent = intentDx !== 0 || intentDy !== 0;

  player.incTicks();

  // attempt interactions first if there's a movement intent, otherwise just apply condition effects without moving
  const interactionResult = hasMovementIntent
    ? ic.movementAttempt(player, scene.currentLevel, targetX, targetY, intentDx, intentDy)
    : { blocked: true, reason: "no-move" };

  // check for solid deco at target location, which should block movement but not interactions
  const decoAtTarget = scene.currentLevel.getDecoAt(targetX, targetY);
  if (decoAtTarget && decoAtTarget.getSolid()) {
    interactionResult.blocked = true;
    interactionResult.reason = "solid-deco";
  }

  // If the player is still alive after condition effects, attempt movement
  const movementResult = !hasMovementIntent
    ? { moved: false, x: startX, y: startY, tile: scene.currentLevel.getMap().getTile(startX, startY) }
    : interactionResult.blocked
      ? { moved: false, x: startX, y: startY, tile: scene.currentLevel.getMap().getTile(targetX, targetY) }
      : scene.movementController.tryMove(player, scene.currentLevel.getMap(), intentDx, intentDy);

  // if player moved...
  if (movementResult.moved) {
    ic.stateAfterMove(player, scene.currentLevel, startX, startY);
    ic.stepOnTile(player, scene.currentLevel, movementResult.x, movementResult.y);
    // Check for level transition via Exit objects
    const exit = scene.currentLevel.getExitAt(movementResult.x, movementResult.y);
    if (exit) {
      transitionToLevel(scene, exit.targetLevelIndex, exit.targetX, exit.targetY);
    }
  }

  // Check for traps in range after attempting movement
  ic.inRangeOfTraps(player, scene.currentLevel);

  // handle damage-based condition effects after movement
  ic.conditionEffects(player);

  updateCameraTarget(scene);

  scene.fogOfWar?.updateForPlayer();

  scene.events.emit("enemy:move");

  scene.hud.update();
  syncCameraLayers(scene);
}

export function enemyMove(scene) {
  const { x: px, y: py } = scene.player.position;
  const enemies = [...scene.currentLevel.getEntitiesByType("enemies")];
  const doors = scene.currentLevel.getEntitiesByType("doors");
  const applyTurnConditionEffects = (enemy) => scene.interactionController.conditionEffects(enemy);

  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    enemy.incTick();

    let chaseDx = Math.sign(px - enemy.position.x);
    let chaseDy = Math.sign(py - enemy.position.y);

    if (!enemy.inRangeOf(scene.player, enemy.getView())) {
      if (!enemy.isMobile()) {
        continue;
      }
      // If the enemy is not static but the player is out of range, it should still try to move randomly
      const randomDx = Math.floor(Math.random() * 3) - 1;
      const randomDy = Math.floor(Math.random() * 3) - 1;
      chaseDx = randomDx;
      chaseDy = randomDy;
    }

    const checkDiagonal = enemy.checkDiagonal(chaseDx, chaseDy);
    const movementIntent = enemy.resolveMovementIntent(checkDiagonal.dx, checkDiagonal.dy);
    const intentDx = movementIntent.dx;
    const intentDy = movementIntent.dy;
    const targetX = enemy.position.x + intentDx;
    const targetY = enemy.position.y + intentDy;
    const targetTile = scene.currentLevel.getMap().getTile(targetX, targetY);
    const targetSpecialTile = scene.currentLevel.getSpecialTileAt(targetX, targetY);
    const isWalkable = scene.movementController.isWalkable(targetTile);
    const isPlayer = targetX === px && targetY === py;
    const isEnemy = enemies.some((e) => e.position.x === targetX && e.position.y === targetY && e.alive);
    const isDoor = doors.some((d) => d.position.x === targetX && d.position.y === targetY && !d.isOpen());

    // check if enemy stands on a trap and apply its effects before attempting movement or interactions
    scene.interactionController.stepOnTile(enemy, scene.currentLevel, enemy.position.x, enemy.position.y);

    // The enemy may die on step effects (e.g. lava/trap) and be removed from level entities.
    // Stop processing this enemy immediately.
    if (!enemy.alive) {
      continue;
    }

    // If the enemy can't move into the target tile, handle conditionEffects but don't move
    if (!isWalkable || isDoor || isEnemy || (targetSpecialTile && targetSpecialTile.requiredSkill)) {
      applyTurnConditionEffects(enemy);
      continue;
    }

    const attack = enemy.chooseAttack();
    // ranged attack
    if (attack && attack.getRange() > 1 && enemy.inRangeOf(scene.player, attack.getRange()) && !isPlayer) {
      enemy.shoot(scene.player, attack);
      applyTurnConditionEffects(enemy);
      continue;
      // aoe attack
    } else if (attack && attack.getAoe() > 0 && enemy.inRangeOf(scene.player, attack.getAoe()) && !isPlayer) {
      if (scene.player.alive) {
        enemy.attack(scene.player, attack);
      }
      applyTurnConditionEffects(enemy);
      continue;
    } else {
      // attack the player
      if (isPlayer) {
        if (scene.player.alive) {
          enemy.attack(scene.player, attack);
        }
        applyTurnConditionEffects(enemy);
        continue;
      }
    }

    // Only move if the enemy's speed allows it this turn
    if (enemy.getTicks() % enemy.getSpeed() !== 0) {
      applyTurnConditionEffects(enemy);
      continue;
    }

    enemy.moveTo(targetX, targetY);

    // Check for traps in range after attempting movement
    scene.interactionController.inRangeOfTraps(enemy, scene.currentLevel);

    // handle damage-based condition effects after attempting movement
    applyTurnConditionEffects(enemy);
    scene.interactionController.stepOnTile(enemy, scene.currentLevel, enemy.position.x, enemy.position.y);
  }

  syncCameraLayers(scene);
}

export function createGameHandlers(scene) {
  const onlyIfAlive = (handler) => {
    return (...args) => {
      if (scene.player.hasCondition("Paralysis") || scene.player.hasCondition("Petrification")) {
        GameContext.log?.addEntry("You are stunned and cannot act!", "red");
        return;
      }
      if (!scene.player.alive) {
        return;
      }
      return handler(...args);
    };
  };

  return {
    onPlayerDied: (player) => player.dies(),
    onInputMove: (payload) => onInputMove(scene, payload),
    onEnemyMove: () => enemyMove(scene),
    onUseItem: onlyIfAlive((inventoryIndex) => {
      scene.player.useItem(inventoryIndex, scene.hud.getPageOffset());
      syncCameraLayers(scene);
      scene.hud.update();
      scene.events.emit("enemy:move");
    }),
    onSwitchHudCategory: () => scene.hud.switchCategory(),
    onInventoryPageUp: () => scene.hud.pageUp(),
    onInventoryPageDown: () => scene.hud.pageDown(),
    onDropItem: onlyIfAlive((inventoryIndex) => {
      scene.player.dropItem(inventoryIndex, scene.hud.getPageOffset());
      syncCameraLayers(scene);
      scene.hud.update();
      scene.events.emit("enemy:move");
    }),
    onUnequipItem: onlyIfAlive((inventoryIndex) => {
      scene.player.unequip(inventoryIndex);
      scene.hud.update();
      scene.events.emit("enemy:move");
    }),
    onShoot: onlyIfAlive((player) => {
      if (!player.getEquipment("weapon")) {
        GameContext.log?.addEntry("You have no ranged weapon equipped!", "red");
        return;
      }
      if (player.getEquipment("weapon").getWeaponType() !== "ranged") {
        GameContext.log?.addEntry(`Your ${player.getEquipment("weapon").name} is not a ranged weapon!`, "red");
        return;
      }
      player.shoot(scene.currentLevel);
      scene.events.emit("enemy:move");
    }),
    onShowHelp: () => {
      GameContext.log?.addEntry("* Use ↑←↓→ to move and attack (melee attack)", "white");
      GameContext.log?.addEntry("* Press <TAB> to switch MENU.", "white");
      GameContext.log?.addEntry("* Press [I] or [E] to show Inventory or Equipment", "white");
      GameContext.log?.addEntry("* Press [PgUp] and [PgDn] to swap pages", "white");
      GameContext.log?.addEntry("* Press [1-9] to use/equip and <SHIFT> + [1-9] to drop/unequip items", "white");
      GameContext.log?.addEntry("* Press [1-9] to cast spells or use specials", "white");
      GameContext.log?.addEntry("* Press [W] to wait for a turn.", "white");
      GameContext.log?.addEntry("* Press [S] to shoot (ranged attack)", "white");
      GameContext.log?.addEntry("* Press [L] to look around.", "white");
      GameContext.log?.addEntry("* Press [P] for pickpocketing.", "white");
      GameContext.log?.addEntry("* Press [R] to restart the game.", "white");
    },
    onShowEquipment: () => {
      scene.hud.switchCategory("Equipment");
    },
    onShowInventory: () => {
      scene.hud.switchCategory("Inventory");
    },
    onLook: onlyIfAlive((player) => {
      const visibleEntities = player.lookAround();
      if (visibleEntities.length === 0) {
        GameContext.log?.addEntry("You see nothing of interest around you.", "grey");
      } else {
        GameContext.log?.addEntry("You look around and see...", "grey");
        visibleEntities.forEach((entity) => {
          GameContext.log?.addEntry(
            `- ${entity.name} (${entity.constructor.name}) (${entity.position.x}, ${entity.position.y})`,
            "lightblue",
          );
        });
      }
    }),
    onPickpocketing: onlyIfAlive((player) => {
      player.pickpocket();
    }),
    onCastSpell: onlyIfAlive((player, spellIndex) => {
      const spell = scene.player.getSpellbook(spellIndex + scene.hud.getPageOffset());
      if (!spell) {
        GameContext.log?.addEntry("Invalid spell selection!", "red");
        return;
      }
      player.cast(spell);
      scene.events.emit("enemy:move");
    }),
    onWait: onlyIfAlive((player) => {
      GameContext.log?.addEntry("You wait for a moment...", "grey");
      onInputMove(scene, { dx: 0, dy: 0 });
      player.incTicks();
    }),
  };
}
