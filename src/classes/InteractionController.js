import { playDashAnimation, shakeCamera } from "@/animation/tweens.js";
import { Item } from "@/classes/Items/Item.js";
import { Exit } from "@/classes/Exit.js";
import { Enemy } from "@/classes/Enemy.js";

export class InteractionController {
  constructor(scene) {
    this.scene = scene;
  }

  conditionEffects(player) {
    player.tickConditions();
  }

  inRangeOfTraps(player, level) {
    const traps = level.getEntitiesByType("traps");
    traps.forEach((trap) => {
      trap.inRangeOf(player);
    });
  }

  toggleSwitchAndLinked(level, sw, actor) {
    sw.toggle(actor);
    sw.linked.forEach((linked) => {
      this.toggleLinkedEntity(sw, level, linked.x, linked.y, linked.tile);
    });
  }

  movementAttempt(actor, level, targetX, targetY, dx = 0, dy = 0) {
    const entities = level.getEntitiesAt(targetX, targetY);

    for (const entity of entities) {
      const type = entity.constructor.name;

      // Check for enemy collision first
      if (type === "Enemy" && entity.alive) {
        this.enemyCollision(actor, entity, dx, dy);
        return { blocked: true, reason: "enemy" };
      }

      // Check for door collision
      if (type === "Door" && !entity.isOpen()) {
        entity.open();
        return { blocked: true, reason: "door" };
      }

      // check for Notes
      if (type === "Note") {
        actor.readNote(entity);
      }

      // allow interaction with wall-mounted switches (non-walkable tiles)
      if (type === "Switch") {
        const targetTile = level.getMap().getTile(targetX, targetY);
        const isWalkable = this.scene.movementController.isWalkable(targetTile);

        // walkable switches are handled in stepOnTile to avoid double triggers
        if (!isWalkable) {
          this.toggleSwitchAndLinked(this.scene.currentLevel, entity, actor);
          return { blocked: true, reason: "switch" };
        }
      }
    }

    return { blocked: false };
  }

  enemyCollision(actor, enemy, dx = 0, dy = 0) {
    playDashAnimation(this.scene, actor, dx, dy);
    shakeCamera(this.scene, actor);

    // Atack the enemy
    actor.attack(enemy);
  }

  stateAfterMove(player, level, fromX, fromY) {
    const doors = level.getEntitiesByType("doors");
    const switches = level.getEntitiesByType("switches");

    // close door after entering a room
    doors.forEach((door) => {
      if (door.position.x === fromX && door.position.y === fromY && door.isOpen()) {
        door.close();
      }
    });

    // Only toggle switches that are set to "onlyOnStep" and have no items on them
    switches.forEach((sw) => {
      if (!sw.onlyOnStep) {
        return;
      }
      const items = level.getEntitiesAt(fromX, fromY).filter((e) => e instanceof Item);
      if (sw.position.x === fromX && sw.position.y === fromY && items.length === 0) {
        this.toggleSwitchAndLinked(this.scene.currentLevel, sw, player);
      }
    });
  }

  stepOnTile(actor, level, x, y) {
    const specialTile = level.getSpecialTileAt(x, y);
    if (specialTile) {
      specialTile.onStep(actor);
    }

    const entities = level.getEntitiesAt(x, y);

    entities.forEach((entity) => {
      const type = entity.constructor.name;
      // Trigger Trap and Teleporter
      if (type === "Trap" || type === "Teleporter") {
        entity.onStep(actor);
        // Read Note
      } else if (type === "Note" && actor.constructor.name === "Player") {
        actor.readNote(entity);
        // Trigger Switches that are not "onlyOnStep" or have items on them
      } else if (type === "Switch") {
        const items = level.getEntitiesAt(x, y).filter((e) => e instanceof Item);

        if (items.length > 0 && entity.onlyOnStep) {
          return;
        }
        this.toggleSwitchAndLinked(this.scene.currentLevel, entity, actor);
        // Pick up items
      } else if (entity instanceof Item && entity.getVisible() && actor.constructor.name === "Player") {
        actor.addToInventory(entity);
        level.removeItem(entity);
      }
    });
  }

  toggleLinkedEntity(sw, level, linkedX, linkedY, linkedTile) {
    const linkedEntities = level.getEntitiesAt(linkedX, linkedY);

    for (const entity of linkedEntities) {
      const type = entity.constructor.name;

      if (type === "Door") {
        if (entity.key) {
          entity.setKey(null); // Remove key requirement when toggled by a switch
          entity.isOpen() ? entity.close() : entity.open();
        }

        if (sw.isActive()) {
          if (entity.locks > 0) {
            entity.locks -= 1;
          }
        } else {
          entity.locks += 1;
          entity.close();
        }
      }

      if (type === "Trap") {
        entity.setActive(!entity.active);
      }

      if (entity instanceof Item) {
        entity.toggleVisibility();
      }

      if (type === "Teleporter") {
        entity.toggleActive();
      }
    }

    // If no entity found (except Exit and Item), try to toggle tile
    if (
      linkedEntities.length === 0 ||
      linkedEntities.some((e) => e instanceof Enemy) ||
      linkedEntities.some((e) => e instanceof Exit) ||
      linkedEntities.some((e) => e instanceof Item)
    ) {
      const tile = level.getMap().getTile(linkedX, linkedY);
      let newTile = null;
      if (linkedTile) {
        newTile = sw.isActive() ? linkedTile[1] : linkedTile[0];
      } else {
        // If no specific tile is defined, toggle between floor and wall
        newTile = tile === "." ? "#" : ".";
      }
      level.getMap().setTile(linkedX, linkedY, newTile);
    }
  }
}
