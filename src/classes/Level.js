import { Trap } from "@/classes/Trap.js";
import { Enemy } from "@/classes/Enemy.js";
import { Attack } from "@/classes/Attack.js";
import { Door } from "@/classes/Door.js";
import { Switch } from "@/classes/Switch.js";
import { Readable } from "@/classes/Items/Readable.js";
import { Deco } from "@/classes/Deco.js";
import { Exit } from "@/classes/Exit.js";
import { Skill } from "@/classes/Skill.js";
import { Item } from "@/classes/Items/Item.js";
import { Note } from "@/classes/Note.js";
import { Potion } from "@/classes/Items/Potion.js";
import { Scroll } from "@/classes/Items/Scroll.js";
import { Food } from "@/classes/Items/Food.js";
import { Key } from "@/classes/Items/Key.js";
import { Condition } from "@/classes/Condition.js";
import { Teleporter } from "@/classes/Teleporter.js";
import { Tool } from "@/classes/Items/Tool.js";
import { Armor } from "@/classes/Items/Armor.js";
import { Weapon } from "@/classes/Items/Weapon.js";
import { SpecialTile } from "@/classes/SpecialTile.js";
import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";

export class Level {
  constructor(map, specialTiles = []) {
    this.map = map;
    this.rendered = false;
    this.itemStackCountTextByPosition = new Map();
    this.specialTilesBySymbol = new Map();
    this.decos = [];
    this.entities = {
      traps: [],
      enemies: [],
      doors: [],
      switches: [],
      items: [],
      exits: [],
    };

    this.setSpecialTiles(specialTiles);
  }

  addEntity(type, entity) {
    if (!this.entities[type]) {
      this.entities[type] = [];
    }

    this.entities[type].push(entity);
  }

  getMap() {
    return this.map;
  }

  setSpecialTiles(specialTiles = []) {
    this.specialTilesBySymbol.clear();

    for (const tileDef of specialTiles ?? []) {
      if (!tileDef?.symbol) {
        continue;
      }

      this.specialTilesBySymbol.set(tileDef.symbol, new SpecialTile(this.map.scene, tileDef));
    }
  }

  getSpecialTiles() {
    return [...this.specialTilesBySymbol.values()];
  }

  getSpecialTileBySymbol(symbol) {
    if (!symbol) {
      return null;
    }
    return this.specialTilesBySymbol.get(symbol) ?? null;
  }

  getSpecialTileAt(x, y) {
    const symbol = this.map.getTile(x, y);
    return this.getSpecialTileBySymbol(symbol);
  }

  getEntities() {
    return this.entities;
  }

  getEntitiesByType(type) {
    return this.entities[type] ?? [];
  }

  getEntitiesAt(x, y) {
    const entitiesAtPosition = [];

    for (const type in this.entities) {
      const typedEntities = this.getEntitiesByType(type);

      typedEntities.forEach((entity) => {
        if (entity.position.x === x && entity.position.y === y) {
          entitiesAtPosition.push(entity);
        }
      });
    }

    return entitiesAtPosition;
  }

  getTrapsAt(x, y) {
    return this.getEntitiesByType("traps").filter((trap) => trap.position.x === x && trap.position.y === y);
  }

  getEnemyAt(x, y) {
    return this.getEntitiesByType("enemies").find(
      (enemy) => enemy.position.x === x && enemy.position.y === y && enemy.alive,
    );
  }

  getDoorAt(x, y) {
    return this.getEntitiesByType("doors").find((door) => door.position.x === x && door.position.y === y);
  }

  getExitAt(x, y) {
    return this.getEntitiesByType("exits").find((exit) => exit.position.x === x && exit.position.y === y);
  }

  getSwitchAt(x, y) {
    return this.getEntitiesByType("switches").find((sw) => sw.position.x === x && sw.position.y === y);
  }

  getItemsAt(x, y) {
    return this.getEntitiesByType("items").filter((item) => item.position.x === x && item.position.y === y);
  }

  getDecoAt(x, y) {
    return this.decos.find((deco) => deco.position.x === x && deco.position.y === y);
  }

  getItemStackPositionKey(x, y) {
    return `${x},${y}`;
  }

  clearItemStackCountTextAt(x, y) {
    const key = this.getItemStackPositionKey(x, y);
    const countText = this.itemStackCountTextByPosition.get(key);
    if (countText) {
      countText.destroy();
      this.itemStackCountTextByPosition.delete(key);
    }
  }

  renderItemStackCountAt(x, y, count) {
    const key = this.getItemStackPositionKey(x, y);

    if (count <= 1) {
      this.clearItemStackCountTextAt(x, y);
      return;
    }

    let countText = this.itemStackCountTextByPosition.get(key);
    if (!countText) {
      countText = this.map.scene.add.text(x * TILE_SIZE + TILE_SIZE - 4, y * TILE_SIZE + 2, String(count), {
        fontSize: "10px",
        fontFamily: "monospace",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      });
      countText.setOrigin(1, 0);
      countText.setDepth(RENDER_DEPTH.item + 1);
      this.itemStackCountTextByPosition.set(key, countText);
    } else {
      countText.setPosition(x * TILE_SIZE + TILE_SIZE - 4, y * TILE_SIZE + 2);
      countText.setText(String(count));
    }
  }

  renderItemStackAt(x, y) {
    const stackStepPx = 1;
    const items = this.getItemsAt(x, y);

    if (items.length === 0) {
      this.clearItemStackCountTextAt(x, y);
      return;
    }

    // render only top item of stack for simplicity
    items[items.length - 1].render(0);
    if (items.some((item) => item.visible)) {
      this.renderItemStackCountAt(x, y, items.length);
    }
  }

  removeEntity(entity) {
    for (const type in this.entities) {
      const index = this.entities[type].indexOf(entity);
      if (index !== -1) {
        const oldPosition = entity.position ? { ...entity.position } : null;
        this.entities[type].splice(index, 1);

        if (type === "items" && oldPosition) {
          this.renderItemStackAt(oldPosition.x, oldPosition.y);
        }

        return true;
      }
    }
    return false;
  }

  removeTrap(trap) {
    return this.removeEntity(trap);
  }

  removeEnemy(enemy) {
    return this.removeEntity(enemy);
  }

  removeItem(item) {
    return this.removeEntity(item);
  }

  removeDoor(door) {
    return this.removeEntity(door);
  }

  removeSwitch(sw) {
    return this.removeEntity(sw);
  }

  renderDecos() {
    this.decos.forEach((deco) => deco.render());
  }

  renderEntities() {
    for (const type in this.entities) {
      switch (type) {
        case "notes":
          this.entities.notes.forEach((note) => note.render());
          break;
        case "traps":
          this.entities.traps.forEach((trap) => trap.render());
          break;
        case "enemies":
          this.entities.enemies.forEach((enemy) => enemy.render());
          break;
        case "doors":
          this.entities.doors.forEach((door) => door.render());
          break;
        case "switches":
          this.entities.switches.forEach((sw) => sw.render());
          break;
        case "items":
          {
            // group items by position to render stacks
            const grouped = new Map();
            this.entities.items.forEach((item) => {
              const key = `${item.position.x},${item.position.y}`;
              if (!grouped.has(key)) {
                grouped.set(key, []);
              }
              grouped.get(key).push(item);
            });

            for (const [key] of grouped) {
              const [x, y] = key.split(",").map(Number);
              this.renderItemStackAt(x, y);
            }
          }
          break;

        case "teleporters":
          this.entities.teleporters.forEach((tp) => tp.render());
          break;
        case "exits":
          this.entities.exits.forEach((exit) => exit.render());
          break;
        default:
          console.warn(`Unknown entity type: ${type}`);
      }
    }
  }

  ensureRendered() {
    if (this.rendered) {
      return;
    }

    this.map.render();
    this.renderDecos();
    this.renderEntities();
    this.rendered = true;
  }

  setVisible(visible) {
    this.map.setVisible(visible);

    this.decos.forEach((deco) => {
      deco.gameObject?.setVisible(visible);
    });

    for (const entities of Object.values(this.entities)) {
      entities.forEach((entity) => {
        if ("visible" in entity && entity.visible === false) return;
        if (typeof entity.setVisible === "function") {
          entity.setVisible(visible);
          return;
        }
        entity.gameObject?.setVisible(visible);
      });
    }

    this.itemStackCountTextByPosition.forEach((countText) => {
      countText.setVisible(visible);
    });
  }

  createDecos(decos = []) {
    this.decos = (decos ?? []).map((deco) => {
      return new Deco(this.map.scene, deco.x, deco.y, deco.symbol, deco.color, deco.solid);
    });
  }

  createItemsEntity(item) {
    const effects = {};
    if (item.obj.stats) {
      effects.stats = item.obj.stats;
    }
    if (item.obj.maxStats) {
      effects.maxStats = item.obj.maxStats;
    }
    if (item.obj.conditions) {
      effects.conditions = item.obj.conditions.map((condition) => {
        return new Condition(this.map.scene, condition.name, condition.duration, condition.color, condition.chance);
      });
    }
    if (item.obj.resistances) {
      effects.resistances = item.obj.resistances;
    }
    if (item.obj.food) {
      effects.food = item.obj.food;
    }
    if (item.obj.cast) {
      effects.cast = item.obj.cast;
    }
    if (item.obj.cure) {
      effects.cure = item.obj.cure;
    }

    if (item.obj.functionality) {
      effects.functionality = item.obj.functionality;
    }
    if (item.obj.ac) {
      effects.ac = item.obj.ac;
    }

    if (item.obj.learn) {
      effects.learn = item.obj.learn;
    }

    if (item.obj.extra) {
      effects.extra = item.obj.extra;
    }

    const itemArgs = [
      this.map.scene,
      item.obj.name,
      item.obj.sprite,
      item.obj.type,
      item.x,
      item.y,
      item.visible ?? true,
      effects,
    ];
    switch (item.obj.type) {
      case "potion":
        return new Potion(...itemArgs);
      case "scroll":
        return new Scroll(...itemArgs);
      case "food":
        return new Food(...itemArgs);
      case "key":
        return new Key(...itemArgs);
      case "tool":
        return new Tool(...itemArgs, item.obj.durability);
      case "armor":
        return new Armor(...itemArgs, item.obj.slot);
      case "weapon":
        return new Weapon(...itemArgs, item.obj.slot, item.obj.weaponType, item.obj.range);
      case "readable":
        return new Readable(...itemArgs);
      default:
        return new Item(...itemArgs);
    }
  }

  createEntities(entities = {}) {
    for (const type in entities) {
      switch (type) {
        case "notes":
          this.entities.notes = (entities.notes ?? []).map((note) => {
            return new Note(
              this.map.scene,
              note.obj.name,
              note.obj.text,
              note.x,
              note.y,
              note.obj.sprite,
              note.obj.deleteOnRead,
            );
          });
          break;
        case "traps":
          this.entities.traps = (entities.traps ?? []).map((trap) => {
            const condition = trap.obj.condition
              ? new Condition(
                  this.map.scene,
                  trap.obj.condition.name,
                  trap.obj.condition.duration,
                  trap.obj.condition.color,
                )
              : null;

            return new Trap(
              this.map.scene,
              trap.obj.name,
              trap.obj.sprite,
              trap.obj.dmg,
              condition,
              trap.x,
              trap.y,
              trap.active,
              trap.obj.range,
              trap.obj.skill,
              trap.visible ?? true,
            );
          });
          break;
        case "enemies":
          this.entities.enemies = (entities.enemies ?? []).map((enemy) => {
            const attacks = (enemy.obj.attacks ?? []).map((attack) => {
              return new Attack(
                this.map.scene,
                attack.name,
                attack.dmg,
                attack.condition
                  ? new Condition(
                      this.map.scene,
                      attack.condition.name,
                      attack.condition.duration,
                      attack.condition.color,
                      attack.condition.chance,
                    )
                  : null,
                attack.cooldown,
                attack.extra ?? null,
                attack.range ?? 1,
                attack.aoe ?? 0,
                attack.hits ?? 1,
              );
            });

            const enemyLoot = (enemy.loot ?? []).map((item) => this.createItemsEntity({ obj: item, x: 0, y: 0 }));
            return new Enemy(
              this.map.scene,
              enemy.obj.name,
              enemy.obj.type,
              enemy.obj.sprite,
              enemy.x,
              enemy.y,
              enemy.obj.hp,
              enemy.obj.ac,
              enemy.obj.view,
              enemy.obj.speed,
              enemy.obj.diagonal,
              attacks,
              enemy.obj.mobile,
              enemy.obj.resistances,
              enemyLoot,
              enemy.obj.canPickPocket,
            );
          });
          break;
        case "doors":
          this.entities.doors = (entities.doors ?? []).map((door) => {
            return new Door(
              this.map.scene,
              door.obj.name,
              door.obj.sprite,
              door.x,
              door.y,
              door.open,
              door.key,
              door.locks ?? 0,
              door.obj.skill,
              door.visible ?? true,
            );
          });
          break;
        case "switches":
          this.entities.switches = (entities.switches ?? []).map((sw) => {
            return new Switch(
              this.map.scene,
              sw.obj.name,
              sw.obj.sprite,
              sw.x,
              sw.y,
              sw.active,
              sw.linked,
              sw.obj.onlyOnStep,
              sw.visible ?? true,
            );
          });
          break;
        case "items":
          this.entities.items = (entities.items ?? []).map((item) => {
            return this.createItemsEntity(item);
          });
          break;
        case "teleporters":
          this.entities.teleporters = (entities.teleporters ?? []).map((tp) => {
            return new Teleporter(
              this.map.scene,
              tp.obj.name,
              tp.obj.sprite,
              tp.x,
              tp.y,
              tp.target.x,
              tp.target.y,
              tp.active,
            );
          });
          break;
        case "exits":
          this.entities.exits = (entities.exits ?? []).map((exitDef) => {
            return new Exit(
              this.map.scene,
              exitDef.x,
              exitDef.y,
              exitDef.symbol,
              exitDef.color,
              exitDef.target.levelIndex,
              exitDef.target.x,
              exitDef.target.y,
            );
          });
          break;
        default:
          console.warn(`Unknown entity type: ${type}`);
      }
    }
  }
}
