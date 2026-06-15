import { TILE_SIZE } from "@/config/game.js";

export class FogOfWar {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.color = options.color ?? 0x000000;
    this.alpha = options.alpha ?? 1;
    this.depth = options.depth ?? 1000;

    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(this.depth);
    this.revealedTilesByLevel = new Map();
  }

  setVisible(visible) {
    this.graphics?.setVisible(visible);
  }

  destroy() {
    this.graphics?.destroy();
    this.graphics = null;
  }

  updateForPlayer() {
    const level = this.scene.currentLevel;
    const player = this.scene.player;

    if (!level || !player || !this.graphics) {
      return;
    }

    const { x, y } = player.position;
    const visibleRoom = this.getConnectedRoomTiles(level, x, y);
    const visibleWalls = this.getRoomBoundaryWalls(level, visibleRoom);
    const levelKey = this.getLevelKey();
    const revealedTiles = this.getOrCreateRevealedTiles(levelKey);

    visibleRoom.forEach((tileKey) => revealedTiles.add(tileKey));
    visibleWalls.forEach((tileKey) => revealedTiles.add(tileKey));

    const mapDefinition = level.getMap().getDefinition();

    this.graphics.clear();
    this.graphics.fillStyle(this.color, this.alpha);

    for (let tileY = 0; tileY < mapDefinition.length; tileY++) {
      for (let tileX = 0; tileX < mapDefinition[tileY].length; tileX++) {
        const key = `${tileX},${tileY}`;
        if (revealedTiles.has(key)) {
          continue;
        }

        this.graphics.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  getConnectedRoomTiles(level, startX, startY) {
    const mapDefinition = level.getMap().getDefinition();
    const maxY = mapDefinition.length;
    const maxX = mapDefinition[0]?.length ?? 0;
    const inBounds = (x, y) => x >= 0 && x < maxX && y >= 0 && y < maxY;
    const keyOf = (x, y) => `${x},${y}`;
    const visited = new Set();

    if (!inBounds(startX, startY)) {
      return visited;
    }

    const queue = [[startX, startY]];
    visited.add(keyOf(startX, startY));

    while (queue.length > 0) {
      const [x, y] = queue.shift();

      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (!inBounds(nx, ny)) {
          continue;
        }

        const neighborKey = keyOf(nx, ny);
        if (visited.has(neighborKey)) {
          continue;
        }

        if (!this.isRoomPassableTile(level, nx, ny)) {
          continue;
        }

        visited.add(neighborKey);
        queue.push([nx, ny]);
      }
    }

    return visited;
  }

  getRoomBoundaryWalls(level, roomTiles) {
    const mapDefinition = level.getMap().getDefinition();
    const maxY = mapDefinition.length;
    const maxX = mapDefinition[0]?.length ?? 0;
    const inBounds = (x, y) => x >= 0 && x < maxX && y >= 0 && y < maxY;
    const keyOf = (x, y) => `${x},${y}`;
    const boundaryWalls = new Set();

    for (const tileKey of roomTiles) {
      const [x, y] = tileKey.split(",").map(Number);
      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
        [x + 1, y + 1],
        [x + 1, y - 1],
        [x - 1, y + 1],
        [x - 1, y - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (!inBounds(nx, ny)) {
          continue;
        }

        const neighborKey = keyOf(nx, ny);
        if (roomTiles.has(neighborKey)) {
          continue;
        }

        if (!this.isRoomPassableTile(level, nx, ny)) {
          boundaryWalls.add(neighborKey);
        }
      }
    }

    return boundaryWalls;
  }

  getLevelKey() {
    return this.scene.player?.levelIndex ?? 0;
  }

  getOrCreateRevealedTiles(levelKey) {
    let revealed = this.revealedTilesByLevel.get(levelKey);
    if (!revealed) {
      revealed = new Set();
      this.revealedTilesByLevel.set(levelKey, revealed);
    }
    return revealed;
  }

  isRoomPassableTile(level, x, y) {
    const tile = level.getMap().getTile(x, y);

    if (tile === null) {
      return false;
    }

    const door = level.getDoorAt(x, y);
    if (door && typeof door.isOpen === "function" && !door.isOpen()) {
      return false;
    }

    if (this.scene.movementController) {
      return this.scene.movementController.isWalkable(tile);
    }

    return tile !== "#";
  }
}
