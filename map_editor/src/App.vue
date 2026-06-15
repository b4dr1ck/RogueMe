<script>
import { DOORS } from "../../src/config/doors.js";
import { ENEMIES } from "../../src/config/enemies.js";
import { ITEMS } from "../../src/config/items.js";
import { NOTES } from "../../src/config/notes.js";
import { SWITCHES } from "../../src/config/switches.js";
import { TELEPORTERS } from "../../src/config/teleporters.js";
import { TRAPS } from "../../src/config/traps.js";

export default {
  name: "App",
  data() {
    return {
      mapsize: {
        width: 20,
        height: 20,
      },
      map: {
        name: "New Map",
        data: [],
        entities: [],
      },
      activeTileCategory: "Map",
      selectedTile: "#",
      entitySearch: "",
      nextEntityId: 1,
      tileContextMenu: {
        visible: false,
        x: 0,
        y: 0,
        tileX: null,
        tileY: null,
      },
      entityEditor: {
        visible: false,
        tileX: null,
        tileY: null,
        entityIndex: null,
        model: null,
      },
      tileMapping: {
        "#": "wall1",
        "▤": "wall4",
        "▉": "wall5",
        ".": "floor1",
        " ": "floor5a",
        _: "floor5b",
        "♒": "water1",
        "☰": "water2",
        "┉": "mud",
        "░": "lava",
        "▁": "slime",
      },
      decosMapping: {
        "☠": "corpse1",
        ʊ: "toilet",
        "*": "blood1",
        Ȋ: "pillar1",
        O: "table",
      },
      exitsMapping: {
        "<": "stairsup",
        ">": "stairsdown",
        " ": "empty",
      },
      typeColorMapping: {
        Map: "#60a5fa",
        Exits: "#f97316",
        Decos: "#a78bfa",
        Items: "#34d399",
        Enemies: "#f87171",
        Switches: "#f59e0b",
        Teleporter: "#22d3ee",
        Traps: "#fb7185",
        Doors: "#facc15",
        Notes: "#c084fc",
        generic: "#94a3b8",
        map: "#60a5fa",
        exits: "#f97316",
        decos: "#a78bfa",
        items: "#34d399",
        enemies: "#f87171",
        switches: "#f59e0b",
        teleporters: "#22d3ee",
        traps: "#fb7185",
        doors: "#facc15",
        notes: "#c084fc",
      },
      tileCategories: [
        { name: "Map", elements: ["#", "▤", "▉", ".", " ", "_", "♒", "☰", "┉", "░", "▁"] },
        { name: "Exits", elements: ["<", ">", " "] },
        { name: "Decos", elements: ["☠", "ʊ", "*", "Ȋ", "O"] },
        {
          name: "Items",
          elements: Object.keys(ITEMS).sort(),
        },
        {
          name: "Enemies",
          elements: Object.keys(ENEMIES).sort(),
        },
        {
          name: "Switches",
          elements: Object.keys(SWITCHES).sort(),
        },
        {
          name: "Teleporter",
          elements: Object.keys(TELEPORTERS).sort(),
        },
        {
          name: "Traps",
          elements: Object.keys(TRAPS).sort(),
        },
        {
          name: "Doors",
          elements: Object.keys(DOORS).sort(),
        },
        {
          name: "Notes",
          elements: Object.keys(NOTES).sort(),
        },
      ],
    };
  },
  computed: {
    selectedTileCategory() {
      return this.tileCategories.find((category) => category.name === this.activeTileCategory) ?? { elements: [] };
    },
    filteredTileElements() {
      if (!this.entitySearch) {
        return this.selectedTileCategory.elements;
      }

      const elements = this.selectedTileCategory.elements;
      const search = this.entitySearch.trim().toLowerCase();
      if (!search) return elements;
      return elements.filter((tile) => {
        const title = this.getTileOptionTitle(tile).toLowerCase();
        return title.includes(search) || tile.toLowerCase().includes(search);
      });
    },
    contextMenuEntities() {
      if (this.tileContextMenu.tileX === null || this.tileContextMenu.tileY === null) {
        return [];
      }

      return this.getEntitiesAt(this.tileContextMenu.tileX, this.tileContextMenu.tileY);
    },
    switchLinksData() {
      const lines = [];
      const tileSize = 32;
      const half = tileSize / 2;

      for (let y = 0; y < this.map.entities.length; y++) {
        const row = this.map.entities[y] ?? [];
        for (let x = 0; x < row.length; x++) {
          for (const entity of row[x] ?? []) {
            if (entity?.type !== "switches") continue;
            for (const target of entity?.settings?.linkedTargets ?? []) {
              const tx = Number(target?.x);
              const ty = Number(target?.y);
              if (!Number.isFinite(tx) || !Number.isFinite(ty)) continue;
              lines.push({
                x1: x * tileSize + half,
                y1: y * tileSize + half,
                x2: tx * tileSize + half,
                y2: ty * tileSize + half,
              });
            }
          }
        }
      }
      return lines;
    },
  },
  mounted() {
    window.addEventListener("click", this.handleGlobalClick);
    this.$nextTick(() => this.drawSwitchLinks());
  },
  beforeUnmount() {
    window.removeEventListener("click", this.handleGlobalClick);
  },
  watch: {
    switchLinksData: {
      handler() {
        this.$nextTick(() => this.drawSwitchLinks());
      },
      deep: true,
    },
    "mapsize.width"() {
      this.$nextTick(() => this.drawSwitchLinks());
    },
    "mapsize.height"() {
      this.$nextTick(() => this.drawSwitchLinks());
    },
    activeTileCategory: {
      handler(newCategory) {
        this.entitySearch = "";
        const category = this.tileCategories.find((c) => c.name === newCategory);
        if (!category) {
          this.selectedTile = "";
          return;
        }

        if (!category.elements.includes(this.selectedTile)) {
          this.selectedTile = category.elements[0] ?? "";
        }
      },
      immediate: true,
    },
    "mapsize.width": {
      handler: "generateMap",
      immediate: true,
    },
    "mapsize.height": {
      handler: "generateMap",
      immediate: true,
    },
  },
  methods: {
    emptyRoom() {
      for (let y = 0; y < this.mapsize.height; y++) {
        for (let x = 0; x < this.mapsize.width; x++) {
          if (y === 0 || y === this.mapsize.height - 1 || x === 0 || x === this.mapsize.width - 1) {
            this.map.data[y][x] = "#";
          } else {
            this.map.data[y][x] = ".";
          }
          this.map.entities[y][x] = [];
        }
      }
    },
    exportMap() {
      const mapData = {
        name: this.map.name,
        width: this.mapsize.width,
        height: this.mapsize.height,
        data: this.map.data,
        entities: this.map.entities,
      };

      const newMapData = {
        name: mapData.name,
        data: mapData.data,
        specialTiles: [],
        sprites: this.tileMapping,
        exits: [],
        decos: [],
        entities: {
          notes: [],
          teleporters: [],
          items: [],
          traps: [],
          enemies: [],
          doors: [],
          switches: [],
        },
      };

      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          const tileEntities = mapData.entities?.[y]?.[x] ?? [];

          if (tileEntities.length === 0) {
            continue;
          }

          tileEntities.forEach((entity) => {
            switch (entity.type) {
              case "notes":
                if (newMapData.entities.notes.length === 0) {
                  newMapData.entities.notes = [
                    {
                      obj: NOTES[entity.name],
                      x: x,
                      y: y,
                    },
                  ];
                } else {
                  newMapData.entities.notes.push({
                    obj: NOTES[entity.name],
                    x: x,
                    y: y,
                  });
                }
                break;
              case "teleporters":
                if (newMapData.entities.teleporters.length === 0) {
                  newMapData.entities.teleporters = [
                    {
                      obj: TELEPORTERS[entity.name],
                      x: x,
                      y: y,
                      target: {
                        x: entity.settings.target.x,
                        y: entity.settings.target.y,
                      },
                      active: entity.settings.active,
                    },
                  ];
                } else {
                  newMapData.entities.teleporters.push({
                    obj: TELEPORTERS[entity.name],
                    x: x,
                    y: y,
                    target: {
                      x: entity.settings.target.x,
                      y: entity.settings.target.y,
                    },
                    active: entity.settings.active,
                  });
                }
                break;
              case "items":
                if (newMapData.entities.items.length === 0) {
                  newMapData.entities.items = [
                    {
                      obj: ITEMS[entity.name],
                      x: x,
                      y: y,
                      visible: entity.settings.visible,
                    },
                  ];
                } else {
                  newMapData.entities.items.push({
                    obj: ITEMS[entity.name],
                    x: x,
                    y: y,
                    visible: entity.settings.visible,
                  });
                }
                break;
              case "traps":
                if (newMapData.entities.traps.length === 0) {
                  newMapData.entities.traps = [
                    {
                      obj: TRAPS[entity.name],
                      x: x,
                      y: y,
                      active: entity.settings.active,
                    },
                  ];
                } else {
                  newMapData.entities.traps.push({
                    obj: TRAPS[entity.name],
                    x: x,
                    y: y,
                    active: entity.settings.active,
                  });
                }
                break;
              case "enemies":
                if (newMapData.entities.enemies.length === 0) {
                  newMapData.entities.enemies = [
                    {
                      obj: ENEMIES[entity.name],
                      x: x,
                      y: y,
                      loot:
                        entity.settings.loot.length > 0 ? entity.settings.loot.map((item) => ITEMS[item] ?? item) : [],
                    },
                  ];
                } else {
                  newMapData.entities.enemies.push({
                    obj: ENEMIES[entity.name],
                    x: x,
                    y: y,
                    loot:
                      entity.settings.loot.length > 0 ? entity.settings.loot.map((item) => ITEMS[item] ?? item) : [],
                  });
                }
                break;
              case "doors":
                if (newMapData.entities.doors.length === 0) {
                  newMapData.entities.doors = [
                    {
                      obj: DOORS[entity.name],
                      x: x,
                      y: y,
                      open: entity.settings.isOpen,
                      key: ITEMS[entity.settings.keyId]
                        ? ITEMS[entity.settings.keyId]
                        : entity.settings.keyId
                          ? { name: entity.settings.keyId }
                          : null,
                    },
                  ];
                } else {
                  newMapData.entities.doors.push({
                    obj: DOORS[entity.name],
                    x: x,
                    y: y,
                    open: entity.settings.isOpen,
                    key: ITEMS[entity.settings.keyId]
                      ? ITEMS[entity.settings.keyId]
                      : entity.settings.keyId
                        ? { name: entity.settings.keyId }
                        : null,
                  });
                }
                break;
              case "switches":
                if (newMapData.entities.switches.length === 0) {
                  newMapData.entities.switches = [
                    {
                      obj: SWITCHES[entity.name],
                      x: x,
                      y: y,
                      active: entity.settings.active,
                      linked: entity.settings.linkedTargets.map((target) => ({
                        x: target.x,
                        y: target.y,
                        tile: [target.tile1, target.tile2],
                      })),
                    },
                  ];
                } else {
                  newMapData.entities.switches.push({
                    obj: SWITCHES[entity.name],
                    x: x,
                    y: y,
                    active: entity.settings.active,
                    linked: entity.settings.linkedTargets.map((target) => ({
                      x: target.x,
                      y: target.y,
                      tile: [target.tile1, target.tile2],
                    })),
                  });
                }
                break;
              case "exits":
                if (newMapData.exits.length === 0) {
                  newMapData.exits = [
                    {
                      color: entity.name,
                      x: x,
                      y: y,
                      symbol: entity.symbol,
                      target: {
                        levelIndex: entity.settings.levelIndex,
                        x: entity.settings.targetX,
                        y: entity.settings.targetY,
                      },
                    },
                  ];
                } else {
                  newMapData.exits.push({
                    color: entity.name,
                    x: x,
                    y: y,
                    symbol: entity.symbol,
                    target: {
                      levelIndex: entity.settings.levelIndex,
                      x: entity.settings.targetX,
                      y: entity.settings.targetY,
                    },
                  });
                }
                break;
              case "decos":
                if (newMapData.decos.length === 0) {
                  newMapData.decos = [
                    {
                      color: entity.name,
                      x: x,
                      y: y,
                      symbol: entity.symbol,
                    },
                  ];
                } else {
                  newMapData.decos.push({
                    color: entity.name,
                    x: x,
                    y: y,
                    symbol: entity.symbol,
                  });
                }
                break;
            }
          });
        }
      }

      console.log(newMapData);

      // export as json-file and download
      const json = JSON.stringify(newMapData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.map.name.replace(/\s+/g, "_")}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },

    getEntityTypeByCategory(categoryName) {
      const typeMap = {
        Items: "items",
        Enemies: "enemies",
        Switches: "switches",
        Doors: "doors",
        Teleporter: "teleporters",
        Traps: "traps",
        Notes: "notes",
        Decos: "decos",
        Exits: "exits",
      };

      return typeMap[categoryName] ?? "generic";
    },
    getTypeColor(typeOrCategory) {
      return (
        this.typeColorMapping[typeOrCategory] ??
        this.typeColorMapping[String(typeOrCategory).toLowerCase()] ??
        this.typeColorMapping.generic
      );
    },
    getContrastingTextColor(color) {
      if (typeof color !== "string") {
        return "#ffffff";
      }

      const hex = color.trim().replace("#", "");
      const normalizedHex =
        hex.length === 3
          ? hex
              .split("")
              .map((char) => `${char}${char}`)
              .join("")
          : hex;

      if (!/^[0-9a-fA-F]{6}$/.test(normalizedHex)) {
        return "#ffffff";
      }

      const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
      const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
      const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);
      const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

      return brightness > 160 ? "#0f172a" : "#ffffff";
    },

    getTileOptionTitle(tile) {
      if (this.activeTileCategory === "Map") {
        return this.tileMapping[tile] ?? tile;
      }

      if (this.activeTileCategory === "Decos") {
        return this.decosMapping[tile] ?? tile;
      }

      if (this.activeTileCategory === "Exits") {
        return this.exitsMapping[tile] ?? tile;
      }

      return tile;
    },
    getTileOptionSubtitle(tile) {
      if (this.activeTileCategory === "Map") {
        return ` ${tile}`;
      }

      if (this.activeTileCategory === "Decos") {
        return ` ${tile}`;
      }

      if (this.activeTileCategory === "Exits") {
        return ` ${tile}`;
      }

      return undefined;
    },
    getDefaultEntitySettings(type) {
      if (type === "teleporters") {
        return {
          active: true,
          target: {
            x: null,
            y: null,
          },
        };
      }

      if (type === "traps") {
        return {
          active: true,
        };
      }

      if (type === "switches") {
        return {
          active: false,
          linkedTargets: [],
        };
      }

      if (type === "doors") {
        return {
          isOpen: false,
          keyId: "",
          locks: 0,
        };
      }

      if (type === "enemies") {
        return {
          loot: [],
        };
      }

      if (type === "items") {
        return {
          visible: true,
        };
      }

      if (type === "exits") {
        return {
          levelIndex: null,
          targetX: null,
          targetY: null,
        };
      }

      return {};
    },
    normalizeSwitchSettings(settings = {}) {
      const linkedTargets = [];

      if (Array.isArray(settings.linkedTargets)) {
        for (const target of settings.linkedTargets) {
          if (target && typeof target === "object") {
            linkedTargets.push({
              x: target.x ?? null,
              y: target.y ?? null,
              tile1: target.tile1 ?? "#",
              tile2: target.tile2 ?? ".",
            });
          }
        }
      }

      if (settings.linkedTileX !== undefined || settings.linkedTileY !== undefined) {
        linkedTargets.push({
          x: settings.linkedTileX ?? null,
          y: settings.linkedTileY ?? null,
          tile1: settings.linkedTile1 ?? "#",
          tile2: settings.linkedTile2 ?? ".",
        });
      }

      if (Array.isArray(settings.linkedTiles)) {
        for (const legacyTarget of settings.linkedTiles) {
          if (Array.isArray(legacyTarget)) {
            linkedTargets.push({
              x: legacyTarget[0] ?? null,
              y: legacyTarget[1] ?? null,
              tile1: legacyTarget[2] ?? "#",
              tile2: legacyTarget[3] ?? ".",
            });
            continue;
          }

          if (legacyTarget && typeof legacyTarget === "object") {
            linkedTargets.push({
              x: legacyTarget.x ?? null,
              y: legacyTarget.y ?? null,
              tile1: legacyTarget.tile1 ?? "#",
              tile2: legacyTarget.tile2 ?? ".",
            });
          }
        }
      }

      return {
        active: Boolean(settings.active),
        linkedTargets,
      };
    },
    normalizeEnemySettings(settings = {}) {
      const loot = [];

      if (Array.isArray(settings.loot)) {
        for (const item of settings.loot) {
          if (item !== null && item !== undefined && String(item).trim() !== "") {
            loot.push(String(item));
          }
        }
      } else if (typeof settings.loot === "string" && settings.loot.trim() !== "") {
        loot.push(settings.loot.trim());
      }

      return {
        loot,
      };
    },
    normalizeEntityPosition(entity, fallbackX = null, fallbackY = null) {
      return {
        x: entity?.position?.x ?? entity?.x ?? fallbackX,
        y: entity?.position?.y ?? entity?.y ?? fallbackY,
      };
    },
    createEntity(name, categoryName, x = null, y = null) {
      const type = this.getEntityTypeByCategory(categoryName);
      let symbol = name;
      if (type === "exits") {
        name = this.exitsMapping[name] ?? name;
      }

      if (type === "decos") {
        name = this.decosMapping[name] ?? name;
      }

      return {
        id: this.nextEntityId++,
        name,
        symbol,
        type,
        position: {
          x,
          y,
        },
        settings: this.getDefaultEntitySettings(type),
      };
    },
    normalizeEntity(entity, fallbackCategory = "Items", fallbackX = null, fallbackY = null) {
      if (typeof entity === "object" && entity !== null && entity.name) {
        const type = entity.type ?? this.getEntityTypeByCategory(fallbackCategory);
        let name = entity.name;
        let symbol = null;
        if (type === "exits") {
          name = this.exitsMapping[entity.name] ?? entity.name;
          symbol = entity.symbol;
        }

        if (type === "decos") {
          name = this.decosMapping[entity.name] ?? entity.name;
          symbol = entity.symbol;
        }

        const mergedSettings = {
          ...this.getDefaultEntitySettings(type),
          ...(entity.settings ?? {}),
        };

        return {
          id: entity.id ?? this.nextEntityId++,
          name: name,
          symbol: symbol,
          type,
          position: this.normalizeEntityPosition(entity, fallbackX, fallbackY),
          settings:
            type === "switches"
              ? this.normalizeSwitchSettings(mergedSettings)
              : type === "enemies"
                ? this.normalizeEnemySettings(mergedSettings)
                : mergedSettings,
        };
      }

      return this.createEntity(String(entity), fallbackCategory, fallbackX, fallbackY);
    },
    toDisplayEntity(entity, fallbackCategory = "Items", fallbackX = null, fallbackY = null) {
      if (typeof entity === "object" && entity !== null && entity.name) {
        const type = entity.type ?? this.getEntityTypeByCategory(fallbackCategory);
        let name = entity.name;
        let symbol = null;
        if (type === "exits") {
          name = this.exitsMapping[entity.name] ?? entity.name;
          symbol = entity.symbol;
        }

        if (type === "decos") {
          name = this.decosMapping[entity.name] ?? entity.name;
          symbol = entity.symbol;
        }

        const mergedSettings = {
          ...this.getDefaultEntitySettings(type),
          ...(entity.settings ?? {}),
        };

        return {
          name: name,
          type,
          symbol,
          position: this.normalizeEntityPosition(entity, fallbackX, fallbackY),
          settings:
            type === "switches"
              ? this.normalizeSwitchSettings(mergedSettings)
              : type === "enemies"
                ? this.normalizeEnemySettings(mergedSettings)
                : mergedSettings,
        };
      }

      return {
        name: String(entity),
        type: this.getEntityTypeByCategory(fallbackCategory),
        position: {
          x: fallbackX,
          y: fallbackY,
        },
        settings: this.getDefaultEntitySettings(this.getEntityTypeByCategory(fallbackCategory)),
      };
    },
    addSwitchLinkedTarget() {
      if (!this.entityEditor.model || this.entityEditor.model.type !== "switches") {
        return;
      }

      if (!Array.isArray(this.entityEditor.model.settings.linkedTargets)) {
        this.entityEditor.model.settings.linkedTargets = [];
      }

      this.entityEditor.model.settings.linkedTargets.push({
        x: null,
        y: null,
        tile: "#",
      });
    },
    removeSwitchLinkedTarget(index) {
      if (!this.entityEditor.model || this.entityEditor.model.type !== "switches") {
        return;
      }

      this.entityEditor.model.settings.linkedTargets.splice(index, 1);
    },
    addEnemyLootItem() {
      if (!this.entityEditor.model || this.entityEditor.model.type !== "enemies") {
        return;
      }

      if (!Array.isArray(this.entityEditor.model.settings.loot)) {
        this.entityEditor.model.settings.loot = [];
      }

      this.entityEditor.model.settings.loot.push("");
    },
    removeEnemyLootItem(index) {
      if (!this.entityEditor.model || this.entityEditor.model.type !== "enemies") {
        return;
      }

      this.entityEditor.model.settings.loot.splice(index, 1);
    },
    handleGlobalClick() {
      this.closeTileContextMenu();
    },
    generateMap() {
      const width = Math.max(0, Number.parseInt(this.mapsize.width, 10) || 0);
      const height = Math.max(0, Number.parseInt(this.mapsize.height, 10) || 0);

      this.map.data = [];
      this.map.entities = [];
      for (let y = 0; y < height; y++) {
        this.map.data[y] = [];
        this.map.entities[y] = [];
        for (let x = 0; x < width; x++) {
          this.map.data[y][x] = "#";
          this.map.entities[y][x] = [];
        }
      }
    },
    selectTile(tile) {
      this.selectedTile = tile;
    },
    setTile(x, y) {
      this.closeTileContextMenu();

      if (this.activeTileCategory === "Map") {
        this.map.data[y][x] = this.selectedTile || "#";
        return;
      }

      if (!this.map.entities[y]) {
        this.map.entities[y] = [];
      }
      if (!this.map.entities[y][x]) {
        this.map.entities[y][x] = [];
      }

      this.map.entities[y][x].push(this.createEntity(this.selectedTile, this.activeTileCategory, x, y));
    },
    getEntitiesAt(x, y) {
      return this.map.entities?.[y]?.[x] ?? [];
    },
    normalizeEntitiesAt(x, y) {
      const entities = this.map.entities?.[y]?.[x];
      if (!entities) {
        return;
      }

      for (let i = 0; i < entities.length; i++) {
        const needsNormalization =
          typeof entities[i] !== "object" ||
          entities[i] === null ||
          !entities[i].name ||
          entities[i].position?.x !== x ||
          entities[i].position?.y !== y;

        if (needsNormalization) {
          entities[i] = this.normalizeEntity(entities[i], "Items", x, y);
        }
      }
    },
    openTileContextMenu(event, x, y) {
      event.preventDefault();
      event.stopPropagation();

      this.normalizeEntitiesAt(x, y);

      this.tileContextMenu.visible = true;
      this.tileContextMenu.x = event.clientX;
      this.tileContextMenu.y = event.clientY;
      this.tileContextMenu.tileX = x;
      this.tileContextMenu.tileY = y;
    },
    closeTileContextMenu() {
      this.tileContextMenu.visible = false;
    },
    getEntityTitle(entity) {
      return this.toDisplayEntity(entity).name;
    },
    getEntityIndicatorStyle(entity) {
      const normalized = this.toDisplayEntity(entity);
      const backgroundColor = this.getTypeColor(normalized.type);

      return {
        backgroundColor,
        color: this.getContrastingTextColor(backgroundColor),
      };
    },
    getTileBorderStyle(x, y) {
      const entities = this.getEntitiesAt(x, y);
      if (entities.length === 0) return {};
      const color = this.getTypeColor(this.toDisplayEntity(entities[0]).type);
      return {
        borderColor: color,
        boxShadow: `inset 0 0 0 1px ${color}`,
      };
    },
    getEntitySubtitle(entity) {
      const normalized = this.toDisplayEntity(entity);
      return `Type: ${normalized.type}`;
    },
    formatSettingValue(value) {
      if (value === null || value === undefined || value === "") {
        return "-";
      }

      if (typeof value === "boolean") {
        return value ? "true" : "false";
      }

      if (typeof value === "object") {
        return JSON.stringify(value);
      }

      return String(value);
    },
    getEntitySettingsSummary(entity) {
      const normalized = this.toDisplayEntity(entity);
      const entries = Object.entries(normalized.settings ?? {});

      if (entries.length === 0) {
        return "no options";
      }

      return entries.map(([key, value]) => `${key}: ${this.formatSettingValue(value)}`).join(", ");
    },
    getTileTooltipLines(x, y) {
      const entities = this.getEntitiesAt(x, y);
      return entities.map((entity) => {
        const normalized = this.toDisplayEntity(entity);
        return `${normalized.name} (${normalized.type}) — ${this.getEntitySettingsSummary(normalized)}`;
      });
    },
    setMapName(event) {
      const value = event?.target?.value ?? "";
      this.map.name = value;
    },
    openEntityEditor(index) {
      this.closeTileContextMenu();

      if (this.tileContextMenu.tileX === null || this.tileContextMenu.tileY === null) {
        return;
      }

      const entities = this.getEntitiesAt(this.tileContextMenu.tileX, this.tileContextMenu.tileY);
      const normalized = this.normalizeEntity(
        entities[index],
        "Items",
        this.tileContextMenu.tileX,
        this.tileContextMenu.tileY,
      );
      entities[index] = normalized;

      this.entityEditor.visible = true;
      this.entityEditor.tileX = this.tileContextMenu.tileX;
      this.entityEditor.tileY = this.tileContextMenu.tileY;
      this.entityEditor.entityIndex = index;
      this.entityEditor.model = JSON.parse(JSON.stringify(normalized));
    },
    closeEntityEditor() {
      this.entityEditor.visible = false;
      this.entityEditor.tileX = null;
      this.entityEditor.tileY = null;
      this.entityEditor.entityIndex = null;
      this.entityEditor.model = null;
    },
    saveEntityEditor() {
      const { tileX, tileY, entityIndex, model } = this.entityEditor;
      if (tileX === null || tileY === null || entityIndex === null || !model) {
        return;
      }

      const entities = this.getEntitiesAt(tileX, tileY);
      entities[entityIndex] = this.normalizeEntity(model);
      this.closeEntityEditor();
    },
    removeEntityAt(index) {
      if (this.tileContextMenu.tileX === null || this.tileContextMenu.tileY === null) {
        return;
      }

      const entities = this.getEntitiesAt(this.tileContextMenu.tileX, this.tileContextMenu.tileY);
      entities.splice(index, 1);
    },
    clearEntitiesAtCurrentTile() {
      if (this.tileContextMenu.tileX === null || this.tileContextMenu.tileY === null) {
        return;
      }

      this.map.entities[this.tileContextMenu.tileY][this.tileContextMenu.tileX] = [];
    },
    drawSwitchLinks() {
      const canvas = this.$refs.linksCanvas;
      if (!canvas) return;

      const tileSize = 32;
      const w = this.mapsize.width * tileSize;
      const h = this.mapsize.height * tileSize;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);

      if (this.switchLinksData.length === 0) return;

      ctx.save();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.fillStyle = "#f59e0b";
      ctx.globalAlpha = 0.9;

      for (const { x1, y1, x2, y2 } of this.switchLinksData) {
        // line from switch centre to target centre
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // dot on the target tile
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(x2, y2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.setLineDash([4, 3]);
      }

      ctx.restore();
    },
    triggerFileInput() {
      this.$refs.fileInput?.click();
    },
    importMap(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (!imported.data || !Array.isArray(imported.data)) {
            alert("Invalid map format: missing data array");
            return;
          }

          // Set map metadata
          this.map.name = imported.name || "Imported Map";
          const height = imported.data.length;
          const width = height > 0 ? imported.data[0].length : 20;
          this.mapsize.width = width;
          this.mapsize.height = height;

          // Populate map data and entities
          this.map.data = imported.data.map((row) => [...row]);
          this.map.entities = Array.from({ length: height }, () => Array.from({ length: width }, () => []));
          this.nextEntityId = 1;

          // Reconstruct entities from flat lists
          const entityGroups = [
            { key: "notes", type: "notes" },
            { key: "teleporters", type: "teleporters" },
            { key: "items", type: "items" },
            { key: "traps", type: "traps" },
            { key: "enemies", type: "enemies" },
            { key: "doors", type: "doors" },
            { key: "switches", type: "switches" },
          ];

          for (const { key, type } of entityGroups) {
            const entities = imported.entities?.[key] || [];
            for (const entity of entities) {
              const x = entity.x ?? 0;
              const y = entity.y ?? 0;

              if (y < 0 || y >= height || x < 0 || x >= width) {
                console.warn(`Entity at (${x}, ${y}) is out of bounds, skipping`);
                continue;
              }

              const normalized = {
                id: this.nextEntityId++,
                name: entity.obj || entity.name || "unknown",
                symbol: entity.symbol || null,
                type: type,
                position: { x, y },
                settings: this.getDefaultEntitySettings(type),
              };

              // Apply type-specific settings
              if (type === "switches" && Array.isArray(entity.linked)) {
                normalized.settings.linkedTargets = entity.linked.map((target) => ({
                  x: target.x ?? null,
                  y: target.y ?? null,
                  tile1: Array.isArray(target.tile) ? (target.tile[0] ?? "#") : "#",
                  tile2: Array.isArray(target.tile) ? (target.tile[1] ?? ".") : ".",
                }));
              } else if (type === "teleporters") {
                normalized.settings.active = entity.active ?? true;
                normalized.settings.target = entity.target || { x: null, y: null };
              } else if (type === "doors") {
                normalized.settings.isOpen = entity.open ?? false;
                normalized.settings.keyId = entity.key?.name || "";
                normalized.settings.locks = entity.locks ?? 0;
              } else if (type === "enemies") {
                normalized.settings.loot = Array.isArray(entity.loot)
                  ? entity.loot.map((item) => (typeof item === "string" ? item : item?.name || ""))
                  : [];
              } else if (type === "items") {
                normalized.settings.visible = entity.visible ?? true;
              } else if (type === "traps") {
                normalized.settings.active = entity.active ?? true;
              } else if (type === "notes") {
                // Notes typically have no additional settings
              }

              this.map.entities[y][x].push(normalized);
            }
          }

          // Handle exits and decos separately (they have a different structure)
          for (const exit of imported.exits || []) {
            const x = exit.x ?? 0;
            const y = exit.y ?? 0;
            if (y < 0 || y >= height || x < 0 || x >= width) continue;

            this.map.entities[y][x].push({
              id: this.nextEntityId++,
              name: exit.color || "exit",
              symbol: exit.symbol || ">",
              type: "exits",
              position: { x, y },
              settings: {
                levelIndex: exit.target?.levelIndex ?? null,
                targetX: exit.target?.x ?? null,
                targetY: exit.target?.y ?? null,
              },
            });
          }

          for (const deco of imported.decos || []) {
            const x = deco.x ?? 0;
            const y = deco.y ?? 0;
            if (y < 0 || y >= height || x < 0 || x >= width) continue;

            this.map.entities[y][x].push({
              id: this.nextEntityId++,
              name: deco.color || "deco",
              symbol: deco.symbol || "*",
              type: "decos",
              position: { x, y },
              settings: {},
            });
          }

          console.log("Map imported successfully!", this.map);
          alert(`Map "${this.map.name}" imported successfully!`);
          event.target.value = "";
        } catch (error) {
          alert(`Failed to import map: ${error.message}`);
          console.error(error);
        }
      };
      reader.readAsText(file);
    },
  },
};
</script>

<template>
  <h1 class="text-headline-large pa-0 ma-0">Map Editor</h1>
  <div id="options" class="d-flex align-items-center">
    <v-text-field
      max-width="100"
      type="number"
      class="ma-2"
      label="Width"
      density="compact"
      hide-details
      placeholder="width"
      v-model.number="mapsize.width"></v-text-field>
    <v-text-field
      max-width="100"
      type="number"
      class="ma-2"
      label="Height"
      density="compact"
      hide-details
      placeholder="height"
      v-model.number="mapsize.height"></v-text-field>
    <v-text-field
      max-width="200"
      class="ma-2"
      label="Name"
      density="compact"
      hide-details
      placeholder="map name"
      :model-value="map.name"
      @change="setMapName"
      @blur="setMapName"></v-text-field>

    <v-btn @click="emptyRoom()" class="ma-2">Empty Room</v-btn>

    <v-btn @click="exportMap()" class="ma-2">Export Map</v-btn>

    <v-btn @click="triggerFileInput" class="ma-2">Import Map</v-btn>
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="importMap"
      aria-label="Import map JSON file" />
  </div>

  <div class="d-flex align-items-center justify-space-between">
    <!--Game Map-->
    <div class="map-grid-wrapper">
      <canvas ref="linksCanvas" class="switch-links-canvas"></canvas>
      <div class="d-flex">
        <div v-for="x in mapsize.width" :key="x" class="d-flex flex-column">
          <v-tooltip
            v-for="y in mapsize.height"
            :key="y"
            location="top"
            :open-delay="150"
            :disabled="getEntitiesAt(x - 1, y - 1).length === 0">
            <template #activator="{ props }">
              <div
                v-bind="props"
                :data-x="x - 1"
                @click="setTile(x - 1, y - 1)"
                @contextmenu="openTileContextMenu($event, x - 1, y - 1)"
                :data-y="y - 1"
                class="ma-0 tile"
                :class="{ 'has-entities': getEntitiesAt(x - 1, y - 1).length > 0 }"
                :style="getTileBorderStyle(x - 1, y - 1)"
                style="width: 32px; height: 32px; background-color: black; font-family: monospace">
                <div class="tile-base">{{ map.data[y - 1][x - 1] }}</div>
                <div
                  class="tile-entity-indicator"
                  v-if="getEntitiesAt(x - 1, y - 1).length > 0"
                  :style="getEntityIndicatorStyle(getEntitiesAt(x - 1, y - 1)[0])">
                  {{
                    getEntitiesAt(x - 1, y - 1)[0]
                      .type.substring(0, 1)
                      .toUpperCase()
                  }}
                </div>
              </div>
            </template>

            <div class="tile-tooltip-content">
              <div class="tile-tooltip-title">Entities</div>
              <div v-for="(line, index) in getTileTooltipLines(x - 1, y - 1)" :key="index" class="tile-tooltip-line">
                {{ line }}
              </div>
            </div>
          </v-tooltip>
        </div>
      </div>
    </div>
    <!-- Tile Options-->
    <div style="max-width: 500px; font-family: monospace">
      <div class="pa-2 text-caption">Selected: {{ selectedTile }}</div>
      <v-tabs v-model="activeTileCategory" align-tabs="start" color="primary">
        <v-tab
          v-for="category in tileCategories"
          :key="category.name"
          :value="category.name"
          :style="{ color: getTypeColor(category.name) }">
          {{ category.name }}
        </v-tab>
      </v-tabs>

      <v-text-field
        v-model="entitySearch"
        density="compact"
        hide-details
        clearable
        placeholder="Search…"
        prepend-inner-icon="mdi-magnify"
        class="mx-2 mb-1 mt-1"></v-text-field>

      <v-list lines="one" style="max-height: 560px; overflow-y: auto">
        <v-list-item v-if="filteredTileElements.length === 0" title="No results" disabled></v-list-item>
        <v-list-item
          v-for="tile in filteredTileElements"
          :key="tile"
          :title="getTileOptionTitle(tile) + (getTileOptionSubtitle(tile) ? ' ' + getTileOptionSubtitle(tile) : '')"
          :active="selectedTile === tile"
          @click="selectTile(tile)"
          prepend-icon="mdi-cube-outline"></v-list-item>
      </v-list>
    </div>
  </div>

  <div
    v-if="tileContextMenu.visible"
    class="tile-context-menu"
    :style="{ left: `${tileContextMenu.x}px`, top: `${tileContextMenu.y}px` }"
    @click.stop>
    <div class="text-caption mb-2">Tile ({{ tileContextMenu.tileX }}, {{ tileContextMenu.tileY }})</div>

    <v-list density="compact" class="mb-2">
      <v-list-item v-if="contextMenuEntities.length === 0" title="No entities"></v-list-item>

      <v-list-item
        v-for="(entity, index) in contextMenuEntities"
        :key="`${entity.id ?? entity.name ?? 'entity'}-${index}`"
        :title="getEntityTitle(entity)"
        :subtitle="getEntitySubtitle(entity)"
        @click.stop="openEntityEditor(index)">
        <template #append>
          <v-btn size="x-small" color="primary" variant="text" @click.stop="openEntityEditor(index)"> Edit </v-btn>
          <v-btn size="x-small" color="error" variant="text" @click.stop="removeEntityAt(index)"> Delete </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <div class="d-flex ga-2 justify-end">
      <v-btn size="small" variant="text" @click="closeTileContextMenu">Close</v-btn>
      <v-btn size="small" color="error" variant="tonal" @click="clearEntitiesAtCurrentTile">Clear All</v-btn>
    </div>
  </div>

  <v-dialog v-model="entityEditor.visible" max-width="520" @click:outside="closeEntityEditor">
    <v-card v-if="entityEditor.model">
      <v-card-title>Entity Options</v-card-title>
      <v-card-text>
        <div class="text-caption mb-3">Tile ({{ entityEditor.tileX }}, {{ entityEditor.tileY }})</div>

        <v-text-field label="Name" density="compact" readonly v-model="entityEditor.model.name"></v-text-field>

        <v-text-field label="Type" density="compact" readonly v-model="entityEditor.model.type"></v-text-field>

        <template v-if="entityEditor.model.type === 'decos' || entityEditor.model.type === 'exits'">
          <v-text-field label="Symbol" density="compact" readonly v-model="entityEditor.model.symbol"></v-text-field>
        </template>

        <template v-if="entityEditor.model.type === 'traps'">
          <v-switch label="Active" color="primary" v-model="entityEditor.model.settings.active"></v-switch>
        </template>

        <template v-if="entityEditor.model.type === 'exits'">
          <v-text-field
            type="number"
            label="Target Level Index"
            density="compact"
            v-model.number="entityEditor.model.settings.levelIndex"></v-text-field>
          <v-text-field
            type="number"
            label="Target X"
            density="compact"
            v-model.number="entityEditor.model.settings.targetX"></v-text-field>
          <v-text-field
            type="number"
            label="Target Y"
            density="compact"
            v-model.number="entityEditor.model.settings.targetY"></v-text-field>
        </template>

        <template v-if="entityEditor.model.type === 'teleporters'">
          <v-switch label="Active" color="primary" v-model="entityEditor.model.settings.active"></v-switch>
          <v-text-field
            type="number"
            label="Target Tile X"
            density="compact"
            v-model.number="entityEditor.model.settings.target.x"></v-text-field>
          <v-text-field
            type="number"
            label="Target Tile Y"
            density="compact"
            v-model.number="entityEditor.model.settings.target.y"></v-text-field>
        </template>

        <template v-if="entityEditor.model.type === 'switches'">
          <v-switch label="Active" color="primary" v-model="entityEditor.model.settings.active"></v-switch>

          <div class="text-caption mb-2">Linked Triggers</div>

          <div
            v-for="(target, targetIndex) in entityEditor.model.settings.linkedTargets"
            :key="targetIndex"
            class="mb-2">
            <div class="d-flex">
              <v-text-field
                type="number"
                label="Target X"
                density="compact"
                hide-details
                v-model.number="target.x"></v-text-field>
              <v-text-field
                type="number"
                label="Target Y"
                density="compact"
                hide-details
                v-model.number="target.y"></v-text-field>
            </div>

            <div class="d-flex">
              <v-text-field
                label="Linked Tile 1"
                density="compact"
                hide-details
                placeholder="#"
                v-model="target.tile1"></v-text-field>
              <v-text-field
                label="Linked Tile 2"
                density="compact"
                hide-details
                placeholder="."
                v-model="target.tile2"></v-text-field>
            </div>
            <v-btn
              icon="mdi-delete"
              color="error"
              variant="text"
              size="small"
              @click="removeSwitchLinkedTarget(targetIndex)"></v-btn>
          </div>

          <v-btn variant="tonal" size="small" color="primary" @click="addSwitchLinkedTarget">Add Trigger</v-btn>
        </template>

        <template v-else-if="entityEditor.model.type === 'doors'">
          <v-switch label="Open" color="primary" v-model="entityEditor.model.settings.isOpen"></v-switch>
          <v-text-field label="Key ID" density="compact" v-model="entityEditor.model.settings.keyId"></v-text-field>
          <v-text-field
            type="number"
            label="Locks"
            density="compact"
            hide-details
            v-model.number="entityEditor.model.settings.locks"></v-text-field>
        </template>

        <template v-else-if="entityEditor.model.type === 'enemies'">
          <div class="text-caption mb-2">Loot</div>

          <div
            v-for="(lootItem, lootIndex) in entityEditor.model.settings.loot"
            :key="lootIndex"
            class="d-flex ga-2 align-center mb-2">
            <v-text-field
              :label="`Loot ${lootIndex + 1}`"
              density="compact"
              hide-details
              placeholder="potion, gold, key"
              v-model="entityEditor.model.settings.loot[lootIndex]"></v-text-field>
            <v-btn
              icon="mdi-delete"
              color="error"
              variant="text"
              size="small"
              @click="removeEnemyLootItem(lootIndex)"></v-btn>
          </div>

          <v-btn variant="tonal" size="small" color="primary" @click="addEnemyLootItem">Add Loot Item</v-btn>
        </template>

        <template v-else-if="entityEditor.model.type === 'items'">
          <v-switch label="Visible" color="primary" v-model="entityEditor.model.settings.visible"></v-switch>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="closeEntityEditor">Cancel</v-btn>
        <v-btn color="primary" variant="tonal" @click="saveEntityEditor">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.map-grid-wrapper {
  position: relative;
  display: inline-flex;
}

.switch-links-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
}

.tile {
  cursor: pointer;
  text-align: center;
  color: #fff;
  border: 1px solid #2e2e2e;
  position: relative;
}

.tile:hover {
  background-color: #684545 !important;
}

/* .tile.has-entities border/box-shadow applied dynamically via getTileBorderStyle() */

.tile-base {
  font-size: 24px;
  line-height: 28px;
}

.tile-entity-indicator {
  position: absolute;
  right: 2px;
  bottom: 1px;
  font-size: 9px;
  line-height: 10px;
  font-weight: 700;
  border-radius: 4px;
  padding: 1px 3px;
}

.tile-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 260px;
  max-width: 340px;
  background: #1e1e1e;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  padding: 8px;
}

.tile-tooltip-content {
  max-width: 360px;
}

.tile-tooltip-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}

.tile-tooltip-line {
  font-size: 11px;
  line-height: 1.35;
  margin-bottom: 2px;
}
</style>
