export class DDDRenderer {
  constructor(scene, tiles, entities) {
    this.scene = scene;
    this.tiles = tiles;
    this.entities = entities;
    this.group = this.scene.add.group();

    this.view = {
      x: 640,
      y: 350,
      width: 275,
      height: 275,
      rows: 8,
      cols: 8,
      minScale: 0.35,
      maxScale: 1.8,
      baseFontSize: 24,
      opacity: 0.5,
    };
  }

  setTiles(tiles) {
    this.tiles = tiles;
  }

  getViewBounds() {
    const player = this.scene.player;
    const { rows, cols } = this.view;
    return {
      startX: player.position.x - Math.floor(cols / 2),
      startY: player.position.y - Math.floor(rows / 2),
      rows,
      cols,
    };
  }

  getTiles() {
    const mapDefinition =
      Array.isArray(this.tiles) && this.tiles.length > 0
        ? this.tiles
        : this.scene.currentLevel?.getMap?.().getDefinition?.();
    const player = this.scene.player;
    if (!mapDefinition || !player) {
      return [];
    }

    const { rows, cols, startX, startY } = this.getViewBounds();
    const out = [];

    for (let y = 0; y < rows; y++) {
      const mapY = startY + y;
      const row = [];

      for (let x = 0; x < cols; x++) {
        const mapX = startX + x;
        if (mapY < 0 || mapY >= mapDefinition.length || mapX < 0 || mapX >= mapDefinition[mapY].length) {
          row.push(null);
        } else {
          row.push(mapDefinition[mapY][mapX]);
        }
      }

      out.push(row);
    }

    return out;
  }

  getEntityPriority(entity) {
    const type = entity?.constructor?.name;
    switch (type) {
      case "Player":
        return 100;
      case "Enemy":
        return 90;
      case "Door":
        return 80;
      case "Switch":
        return 70;
      case "Trap":
        return 60;
      case "Teleporter":
      case "Exit":
        return 50;
      case "Item":
      case "Food":
      case "Potion":
      case "Tool":
      case "Key":
      case "Armor":
      case "Weapon":
      case "Readable":
      case "Scroll":
        return 40;
      default:
        return 10;
    }
  }

  getEntityGlyph(entity) {
    const type = entity?.constructor?.name;

    if (type === "Player") {
      return { char: "@", color: "#ffd166" };
    }

    if (typeof entity?.gameObject?.text === "string" && entity.gameObject.text.length > 0) {
      return { char: entity.gameObject.text[0], color: "#ff9f7f" };
    }

    if (typeof entity?.symbol === "string" && entity.symbol.length > 0) {
      return { char: entity.symbol[0], color: "#ff9f7f" };
    }

    if (typeof entity?.name === "string" && entity.name.length > 0) {
      return { char: entity.name[0].toUpperCase(), color: "#ff9f7f" };
    }

    return { char: "*", color: "#ff9f7f" };
  }

  getEntityOverlayChar(worldX, worldY) {
    const level = this.scene.currentLevel;
    const player = this.scene.player;
    if (!level || !player) {
      return null;
    }

    const candidates = [];

    if (player.position.x === worldX && player.position.y === worldY) {
      candidates.push(player);
    }

    const entitiesAtPos = level.getEntitiesAt(worldX, worldY) || [];
    for (const entity of entitiesAtPos) {
      if (entity?.hasOwnProperty("visible") && !entity.visible) {
        continue;
      }
      if (entity?.hasOwnProperty("alive") && !entity.alive) {
        continue;
      }
      candidates.push(entity);
    }

    const deco = level.getDecoAt(worldX, worldY);
    if (deco) {
      candidates.push(deco);
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => this.getEntityPriority(b) - this.getEntityPriority(a));
    return this.getEntityGlyph(candidates[0]);
  }

  render() {
    this.group.clear(true, true);

    const tiles = this.getTiles();
    if (tiles.length === 0) {
      return;
    }

    const centerX = this.view.x + this.view.width * 0.5;
    const topY = this.view.y;
    const rows = tiles.length;
    const { startX, startY } = this.getViewBounds();

    const panel = this.scene.add
      .rectangle(this.view.x, this.view.y, this.view.width, this.view.height, 0x111111, 0.35)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x333333, 0.8)
      .setScrollFactor(0)
      .setDepth(950);
    this.group.add(panel);

    for (let y = 0; y < rows; y++) {
      const row = Array.isArray(tiles[y]) ? tiles[y] : String(tiles[y]).split("");
      const depthRatio = (y + 1) / rows;
      const scale = this.view.minScale + depthRatio * (this.view.maxScale - this.view.minScale);
      const alpha = 0.45 + depthRatio * 0.55;
      const yPos = topY + Math.pow(depthRatio, 1.35) * (this.view.height - 20);
      const stepX = 18 * scale;
      const rowWidth = (row.length - 1) * stepX;
      const rowStartX = centerX - rowWidth * 0.5;

      for (let x = 0; x < row.length; x++) {
        const worldX = startX + x;
        const worldY = startY + y;
        const entityGlyph = this.getEntityOverlayChar(worldX, worldY);
        const char = entityGlyph?.char ?? row[x] ?? " ";
        if (char === " " || char === null) {
          continue;
        }

        const glyphColor = entityGlyph?.color ?? (char === "#" ? "#c0c0c0" : "#7ad1ff");

        const glyph = this.scene.add
          .text(rowStartX + x * stepX, yPos, char, {
            fontFamily: "monospace",
            fontSize: `${Math.max(8, this.view.baseFontSize * scale)}px`,
            color: glyphColor,
            align: "center",
          })
          .setOrigin(0.5, 0.5)
          .setAlpha(alpha)
          .setDepth(960 + y)
          .setScrollFactor(0);

        this.group.add(glyph);
      }
    }
    this.group.setAlpha(this.view.opacity);
  }
}
