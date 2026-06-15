import { RENDER_DEPTH } from "@/config/game.js";
import { TILE_SIZE } from "@/config/game.js";


export class Map {
  constructor(scene, name, mapDefinition, spriteMap) {
    this.scene = scene;
    this.name = name;
    this.mapDefinition = mapDefinition; // 2D array of tile types, e.g. [["#", "#"], [".", "."]]
    this.spriteMap = spriteMap; // { tileType: [spriteKey(string)|color(int)],  }

    this.mapGroup = this.scene.add.group();
    this.tileObjects = [];
  }

  setVisible(visible) {
    this.mapGroup.setVisible(visible);
  }

  getDefinition() {
    return this.mapDefinition;
  }

  createTileObject(x, y, tileType) {
    return this.scene.add.image(x * TILE_SIZE, y * TILE_SIZE, this.spriteMap[tileType]).setOrigin(0).setDepth(RENDER_DEPTH.tile);
  }

  renderTile(x, y) {
    const tileType = this.mapDefinition[y][x];

    const oldTile = this.tileObjects?.[y]?.[x];
    if (oldTile) {
      oldTile.destroy();
    }

    const tileObject = this.createTileObject(x, y, tileType);

    if (!this.tileObjects[y]) {
      this.tileObjects[y] = [];
    }

    this.tileObjects[y][x] = tileObject;
    this.mapGroup.add(tileObject);
  }

  // Render the map based on the map definition and sprite map
  render() {
    this.mapGroup.clear(true, true);
    this.tileObjects = [];

    for (let y = 0; y < this.mapDefinition.length; y++) {
      for (let x = 0; x < this.mapDefinition[y].length; x++) {
        this.renderTile(x, y);
      }
    }
  }

  // Update the map definition and re-render the map
  update(newMapDefinition) {
    this.mapDefinition = newMapDefinition ? newMapDefinition : this.mapDefinition;
    this.mapGroup.clear(true, true);
    this.render();
  }

  getTile(x, y) {
    if (y < 0 || y >= this.mapDefinition.length || x < 0 || x >= this.mapDefinition[y].length) {
      return null;
    }
    return this.mapDefinition[y][x];
  }

  setTile(x, y, tileType) {
    if (y < 0 || y >= this.mapDefinition.length || x < 0 || x >= this.mapDefinition[y].length) {
      return;
    }

    if (this.mapDefinition[y][x] === tileType) {
      return;
    }

    this.mapDefinition[y][x] = tileType;
    this.renderTile(x, y);
  }
}
