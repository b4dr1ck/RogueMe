import { playDashAnimation, playJumpAnimation, shakeCamera } from "@/animation/tweens.js";
import { GameContext } from "@/services/GameContext.js";

export class MovementController {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.walkableTiles = new Set(options.walkableTiles ?? ["."]);
  }

  isWalkable(tile, actor = null) {
    if (tile === null) {
      return false;
    }

    if (this.walkableTiles.has(tile)) {
      return true;
    }

    const specialTile = this.scene.currentLevel?.getSpecialTileBySymbol(tile);
    if (!specialTile) {
      return false;
    }

    return actor ? specialTile.isWalkableBy(actor) : specialTile.walkable;
  }

  tryMove(player, map, dx, dy) {
    const { x, y } = player.position;
    const nextX = x + dx;
    const nextY = y + dy;
    const nextTile = map.getTile(nextX, nextY);
    const specialTile = this.scene.currentLevel?.getSpecialTileBySymbol(nextTile);

    // play step-sound
    //this.scene.sound.play("step");

    if (player.getStats("stm") <= 0) {
      GameContext.log?.addEntry(`You are too exhausted to move! Rest or use a stamina item.`, "red");
      return { moved: false, x, y, tile: map.getTile(x, y) };
    }

    if (specialTile && !specialTile.isWalkableBy(player)) {
      playDashAnimation(this.scene, player, dx, dy);
      shakeCamera(this.scene, player);
      specialTile.logBlocked(player);
      player.setStats("stm", -1);
      return { moved: false, x, y, tile: nextTile };
    }

    if (!this.isWalkable(nextTile, player)) {
      // Check if the next tile is blocked
      if (
        this.scene.currentLevel
          .getEntitiesAt(nextX, nextY)
          .some((e) => e.constructor.name === "Switch" || e.constructor.name === "Note")
      ) {
        return { moved: false, x, y, tile: nextTile };
      }

      playDashAnimation(this.scene, player, dx, dy);
      shakeCamera(this.scene, player);
      GameContext.log?.addEntry(`Bump! Can't move to (${nextX}, ${nextY})`, "orange");
      player.setStats("stm", -1);
      return { moved: false, x, y, tile: nextTile };
    }

    player.moveTo(nextX, nextY);
    player.incSteps();

    playJumpAnimation(this.scene, player, player.gameObject.y);
    //GameContext.log?.addEntry(`You move to (${nextX}, ${nextY})`, "lightblue");

    return { moved: true, x: nextX, y: nextY, tile: nextTile };
  }
}
