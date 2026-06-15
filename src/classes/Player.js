import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";
import { GameContext } from "@/services/GameContext.js";
import { playBloodSplatter } from "@/animation/particles.js";
import { shootArrow } from "@/animation/tweens.js";

import { Item } from "@/classes/Items/Item.js";
import { Exit } from "@/classes/Exit.js";
import { Spell } from "@/classes/Spell.js";
import { Actor } from "@/classes/Actor.js";
import { Skill } from "@/classes/Skill.js";
import { Consumable } from "@/classes/Items/Consumable.js";

export class Player extends Actor {
  constructor(scene, name, sprite, x, y) {
    super(scene, name, sprite, x, y);
    this._levelIndex = 0;
    this.currentMap = scene.levels[this._levelIndex].getMap();
    this.dmg = [1, 2, 0]; // min, max
    this.stats = {
      hp: [10, 10], // current, max
      mp: [5, 5],
      stm: [8, 8],
    };
    this.steps = 0;
    this.ticks = 0;
    this.food = 100;
    this.hungerTick = 10;
    this.ac = 0;
    this.equipment = {
      weapon: null,
      armor: {
        head: null,
        body: null,
        feet: null,
        hand: null,
        accessory: null,
      },
    };
    this.conditions = [];
    this.inventory = [];
    this.spellbook = [];
    this.skills = [];

    this.dieMessages = [
      "You have met a terrible fate, haven't you?",
      "Your adventure ends here.",
      "The darkness consumes you.",
      "You have died. Better luck next time!",
      "Your journey has come to an end.",
      "AFK 4EVR!",
      "You are dead. The dungeon claims another victim.",
    ];
  }

  get levelIndex() {
    return this._levelIndex;
  }

  set levelIndex(index) {
    this._levelIndex = index;
    this.currentMap = this.scene.levels[this._levelIndex].getMap();
  }

  getAc() {
    return this.ac;
  }

  setAc(amount) {
    this.ac += amount;
    if (amount > 0) {
      GameContext.log?.addEntry(`Your armor class increased by ${amount}.`, "lightblue");
    } else {
      GameContext.log?.addEntry(`Your armor class decreased by ${-amount}.`, "red");
    }
  }

  getSteps() {
    return this.steps;
  }

  incSteps() {
    this.steps += 1;
  }

  getTicks() {
    return this.ticks;
  }

  incTicks() {
    this.ticks += 1;
    if (this.ticks % this.hungerTick === 0) {
      this.food -= 1;
    }

    if (this.ticks % 10 === 0) {
      this.stats.stm[0] += 1;
    }

    if (this.ticks % 50 === 0) {
      this.stats.mp[0] += 1;
    }

    this.normalizeValues();

    if (this.food === 0) {
      GameContext.log?.addEntry(`You are starving! Find some food soon!`, "red", true);
      this.takeDamage(1);
    }
  }

  getFood() {
    return this.food;
  }

  setFood(amount) {
    this.food += amount;
    this.normalizeValues();
    if (amount > 0) {
      GameContext.log?.addEntry(`You eat some food and feel nourished.`, "lightblue");
    } else {
      GameContext.log?.addEntry(`You eat some food and it tastes bad.`, "red");
    }
  }

  readNote(note) {
    GameContext.log?.addEntry(`You read the "${note.getName()}"...`, "lightblue");
    const noteText = note.getText();
    for (const line of Array.isArray(noteText) ? noteText : [noteText]) {
      GameContext.log?.addEntry(`"${line}"`, "Bisque");
    }
    if (note.getDeleteOnRead()) {
      note.destroy();
      this.scene.levels[this.levelIndex].removeEntity(note);
    }
  }

  sortItemsByTypeAndName() {
    this.inventory.sort((a, b) => {
      const typeA = a.items?.[0]?.type ?? "";
      const typeB = b.items?.[0]?.type ?? "";
      if (typeA !== typeB) return typeA.localeCompare(typeB);
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  }

  dropItem(inventoryIndex, offset = 0) {
    if (!this.alive) {
      return;
    }

    const absoluteIndex = inventoryIndex + offset;
    if (absoluteIndex < 0 || absoluteIndex >= this.inventory.length) {
      GameContext.log?.addEntry(`No item on this slot!`, "red");
      return;
    }

    const selectedStack = this.inventory[absoluteIndex];
    if (!selectedStack?.items?.length) {
      GameContext.log?.addEntry(`No item on this slot!`, "red");
      return;
    }

    const itemToDrop = selectedStack.items[0];
    itemToDrop.position = { ...this.position };
    this.scene.currentLevel.addEntity("items", itemToDrop);
    this.scene.currentLevel.renderItemStackAt(this.position.x, this.position.y);
    this.removeFromInventory(itemToDrop);
    this.sortItemsByTypeAndName();
    GameContext.log?.addEntry(`You drop "${itemToDrop.name}".`, "lightblue");
  }

  useItem(inventoryIndex, offset = 0) {
    if (!this.alive) {
      return;
    }

    if (this.scene.hud.getCurrentCategory() !== "Inventory") {
      return;
    }

    const absoluteIndex = inventoryIndex + offset;
    if (absoluteIndex < 0 || absoluteIndex >= this.inventory.length) {
      GameContext.log?.addEntry(`No item on this slot!`, "red");
      return;
    }

    const selectedStack = this.inventory[absoluteIndex];
    if (!selectedStack?.items?.length) {
      GameContext.log?.addEntry(`No item on this slot!`, "red");
      return;
    }

    if (selectedStack.items[0].type === "misc") {
      GameContext.log?.addEntry(`You can't use the "${selectedStack.name}" that way!`, "orange");
      return;
    }

    if (selectedStack.items[0] instanceof Consumable) {
      GameContext.log?.addEntry(`You consume "${selectedStack.name}"!`, "lightblue");
    } else {
      GameContext.log?.addEntry(`You use "${selectedStack.name}"!`, "lightblue");
    }

    const item = selectedStack.items[0];
    if (item.use()) {
      this.removeFromInventory(item);
      this.sortItemsByTypeAndName();
    }
  }

  removeFromInventory(item) {
    const stack = this.inventory.find((entry) => entry.items.includes(item));
    if (!stack) return;

    stack.count -= 1;
    stack.items = stack.items.filter((i) => i !== item);
    if (stack.count <= 0) {
      this.inventory = this.inventory.filter((entry) => entry !== stack);
    }
  }

  addToInventory(item) {
    const key = `${item.name}`.replaceAll(/\s+/g, "").toLowerCase();
    let stack = this.inventory.find((entry) => entry.key === key);

    if (!stack) {
      stack = {
        key,
        name: item.name,
        count: 0,
        items: [],
      };
      this.inventory.push(stack);
    }

    stack.count += 1;
    GameContext.log?.addEntry(`You pick up "${item.name}"! (${stack.count})`, "lightblue");
    stack.items.push(item);
    this.sortItemsByTypeAndName();
    item.destroy();

    return stack;
  }

  updateEquipmentStats() {
    let totalAc = 0;
    for (const armor of Object.values(this.equipment.armor)) {
      if (armor && armor.effects.ac) {
        totalAc += armor.effects.ac;
      }
    }
    this.ac = totalAc;
    this.dmg = this.equipment.weapon?.effects?.stats?.dmg ? [...this.equipment.weapon.effects.stats.dmg] : this.dmg;
  }

  getSpellbook(index) {
    return this.spellbook[index];
  }

  getEquipment(slot) {
    if (slot === "weapon") {
      return this.equipment.weapon;
    }
    return this.equipment.armor[slot];
  }

  unequip(slotIndex) {
    if (!this.alive) {
      return;
    }

    let slot;
    const armorSlots = ["head", "body", "feet", "hand", "accessory"];
    if (slotIndex === 5) {
      slot = "weapon";
    } else {
      slot = armorSlots[slotIndex];
    }
    // Weapon
    if (slot === "weapon") {
      if (!this.equipment.weapon) {
        GameContext.log?.addEntry(`You have no weapon equipped!`, "red");
        return;
      }
      this.addToInventory(this.equipment.weapon);
      this.equipment.weapon = null;
      // Armor
    } else {
      if (!this.equipment.armor[slot]) {
        GameContext.log?.addEntry(`You have no armor equipped in the ${slot} slot!`, "red");
        return;
      }
      GameContext.log?.addEntry(
        `You unequip your "${this.equipment.armor[slot].name}" from your ${slot} slot.`,
        "lightblue",
      );

      // remove resistances from player when unequipping armor
      if (this.equipment.armor[slot].effects?.resistances) {
        for (const [element, value] of Object.entries(this.equipment.armor[slot].effects.resistances)) {
          this.setResistance(element, -value);
        }
      }

      // remove max stat bonuses from player when unequipping armor
      if (this.equipment.armor[slot].effects?.maxStats) {
        for (const [stat, value] of Object.entries(this.equipment.armor[slot].effects.maxStats)) {
          this.setMaxStats(stat, -value);
        }
      }

      // remove stats bonuses from player when unequipping armor
      if (this.equipment.armor[slot].effects?.stats) {
        for (const [stat, value] of Object.entries(this.equipment.armor[slot].effects.stats)) {
          this.setStats(stat, -value);
        }
      }

      this.normalizeValues();

      this.addToInventory(this.equipment.armor[slot]);
      this.equipment.armor[slot] = null;
    }
    this.updateEquipmentStats();
  }

  equip(item, slot) {
    if (!this.alive) {
      return;
    }

    if (slot === "weapon") {
      if (this.equipment.weapon) {
        GameContext.log?.addEntry(`You already have a weapon equipped!`, "red");
        return false;
      }
      this.equipment.weapon = item;
    } else {
      if (this.equipment.armor[slot]) {
        GameContext.log?.addEntry(`You already have armor equipped in the ${slot} slot!`, "red");
        return false;
      }
      this.equipment.armor[slot] = item;

      if (item.effects?.resistances) {
        for (const [element, value] of Object.entries(item.effects.resistances)) {
          this.setResistance(element, value);
        }
      }
      if (item.effects?.maxStats) {
        for (const [stat, value] of Object.entries(item.effects.maxStats)) {
          this.setMaxStats(stat, value);
        }
      }
    }
    GameContext.log?.addEntry(`You equip the "${item.name}" on your ${slot}!`, "green");
    this.removeFromInventory(item);
    this.sortItemsByTypeAndName();
    this.updateEquipmentStats();
  }

  _conditionAddedMsg(conditionName, duration) {
    return `You are now affected by ${conditionName} for ${duration} turns!`;
  }

  _conditionRemovedMsg(conditionName) {
    return `The ${conditionName} condition has worn off!`;
  }

  render() {
    this.gameObject = this.scene.add.sprite(this._x * TILE_SIZE, this._y * TILE_SIZE, this.sprite).setOrigin(0);
    this.gameObject.setDepth(RENDER_DEPTH.actor);
    this.refreshConditionIndicators();
  }

  getNearestEnemy() {
    const enemies = this.scene.currentLevel.getEntitiesByType("enemies");
    let nearestEnemy = null;
    let minDistance = this.equipment.weapon?.getRange() ?? 1; // default melee range is 1

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const distance = Math.abs(enemy._x - this._x) + Math.abs(enemy._y - this._y);
      if (distance <= minDistance && this.hasLineOfSight(enemy._x, enemy._y)) {
        minDistance = distance;
        nearestEnemy = enemy;
      }
    }

    return nearestEnemy;
  }

  getEnemiesInAOE(centerX, centerY, radius, singleTarget = false) {
    const enemies = this.scene.currentLevel.getEntitiesByType("enemies");
    const targets = [];

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = Math.abs(enemy._x - centerX);
      const dy = Math.abs(enemy._y - centerY);
      const distance = Math.max(dx, dy);
      if (distance <= radius && this.hasLineOfSight(enemy._x, enemy._y)) {
        targets.push(enemy);
      }
    }

    if (singleTarget && targets.length > 0) {
      // select the nearest target in range
      let nearestTarget = targets[0];
      let nearestDistance = Math.abs(nearestTarget._x - centerX) + Math.abs(nearestTarget._y - centerY);

      for (let i = 1; i < targets.length; i++) {
        const target = targets[i];
        const targetDistance = Math.abs(target._x - centerX) + Math.abs(target._y - centerY);
        if (targetDistance < nearestDistance) {
          nearestDistance = targetDistance;
          nearestTarget = target;
        }
      }

      return [nearestTarget];
    }

    return targets;
  }

  lookAround() {
    if (!this.alive) {
      return;
    }

    const entities = this.scene.currentLevel.getEntities();
    const visibleEntities = [];
    for (const type in entities) {
      for (const entity of entities[type]) {
        if (Math.abs(entity._x - this._x) <= 1 && Math.abs(entity._y - this._y) <= 1) {
          // skipp hidden exits that are behind walls
          if (
            entity instanceof Exit &&
            this.scene.currentLevel.getMap().getTile(entity.position.x, entity.position.y) === "#"
          ) {
            continue;
          }
          if (entity instanceof Item && entity.getVisible()) {
            visibleEntities.push(entity);
          } else if (!(entity instanceof Item)) {
            visibleEntities.push(entity);
          }
        }
      }
    }

    return visibleEntities;
  }

  revealHiddenItemsAt(x, y, hiddenIn) {
    const itemsOnTile = this.scene.currentLevel.getItemsAt(x, y);

    if (itemsOnTile.length > 0) {
      itemsOnTile.forEach((item) => {
        if (!item.getVisible()) {
          GameContext.log?.addEntry(`You find a "${item.name}" hidden in the ${hiddenIn}!`, "green");
          item.toggleVisibility();
        }
      });
      return;
    }

    GameContext.log?.addEntry(`You find nothing hidden in the ${hiddenIn}.`, "green");
  }

  handleToolBreak(tool) {
    tool.decreaseDurability();
    if (tool.getDurability() === 0) {
      GameContext.log?.addEntry(`Your "${tool.name}" breaks after extensive use.`, "orange");
      return true;
    }

    return false;
  }

  isAdjacentTo(entity) {
    return (
      (Math.abs(entity.position.x - this.position.x) === 1 && entity.position.y === this.position.y) ||
      (Math.abs(entity.position.y - this.position.y) === 1 && entity.position.x === this.position.x)
    );
  }

  pickpocket() {
    if (!this.alive) {
      return;
    }

    if (!this.hasSkill("Pickpocketing")) {
      GameContext.log?.addEntry(`You are not skilled enough.`, "orange");
      return;
    }

    const enemy = this.scene.currentLevel.entities.enemies.find((enemy) => {
      return enemy.alive && this.isAdjacentTo(enemy);
    });

    if (!enemy) {
      GameContext.log?.addEntry(`There is no enemy adjacent to pickpocket!`, "orange");
      return false;
    }

    if (enemy) {
      if (this.hasSkill("Pickpocketing", enemy.canPickPocket())) {
        const loot = enemy.getLoot()[0];
        enemy.setLoot(enemy.getLoot().slice(1));

        if (!loot) {
          GameContext.log?.addEntry(`You pickpocket the ${enemy.name} but find nothing of value.`, "yellow");
        } else {
          this.addToInventory(loot);
          GameContext.log?.addEntry(`You pickpocket the ${enemy.name} and find some loot!`, "green");
        }
      } else {
        GameContext.log?.addEntry(`You fail to pickpocket the ${enemy.name} and get caught!`, "red");
        enemy.incTick();
        const attack = enemy.chooseAttack();
        enemy.attack(this, attack);
      }
    }
  }

  unlock(tool) {
    if (!this.alive) {
      return;
    }

    const door = this.scene.currentLevel.entities.doors.find((door) => {
      return !door.isOpen() && this.isAdjacentTo(door);
    });

    if (!door) {
      GameContext.log?.addEntry(`There is no door adjacent to use the "${tool.name}" on.`, "orange");
      return false;
    }

    return door.lockpick(this, tool);
  }

  disarm(tool) {
    const trap = this.scene.currentLevel.entities.traps.find((trap) => {
      return trap.active && this.isAdjacentTo(trap);
    });

    if (!trap) {
      GameContext.log?.addEntry(`There is no trap adjacent to use the "${tool.name}" on.`, "orange");
      return false;
    }

    return trap.disarm(this, tool);
  }

  dig(tool) {
    if (!this.hasSkill("Digging")) {
      GameContext.log?.addEntry(`You need a higher skill level in "Digging" to use the "${tool.name}".`, "orange");
      return false;
    }

    const tile = this.scene.currentLevel.getMap().getTile(this.position.x, this.position.y);
    if (tile !== " ") {
      GameContext.log?.addEntry(`You can't dig here.`, "orange");
      return false;
    }

    this.scene.currentLevel.getMap().setTile(this.position.x, this.position.y, "_");
    GameContext.log?.addEntry(`You dig through the floor.`, "green");
    this.revealHiddenItemsAt(this.position.x, this.position.y, "floor");

    return this.handleToolBreak(tool);
  }

  mine(tool) {
    if (!this.hasSkill("Mining")) {
      GameContext.log?.addEntry(`You need a higher skill level in "Mining" to use the "${tool.name}".`, "orange");
      return false;
    }

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    for (const dir of directions) {
      const x = this.position.x + dir.dx;
      const y = this.position.y + dir.dy;
      const tile = this.scene.currentLevel.getMap().getTile(x, y);

      if (tile !== "#") {
        continue;
      }

      this.scene.currentLevel.getMap().setTile(x, y, ".");
      GameContext.log?.addEntry(`You mine through the rock.`, "green");
      this.revealHiddenItemsAt(x, y, "rock");

      return this.handleToolBreak(tool);
    }

    GameContext.log?.addEntry(`You can't mine here.`, "orange");
    return false;
  }

  takeDamage(amount, element = null) {
    // Apply resistances
    amount = this.applyResistance(amount, element);
    if (element && amount === 0) {
      GameContext.log?.addEntry(`You are immune to ${element} damage!`, "cadetblue");
      return false;
    }

    playBloodSplatter(this.scene, this._x * TILE_SIZE + TILE_SIZE / 2, this._y * TILE_SIZE + TILE_SIZE / 2);
    this.scene.blood.addBlood(this._x * TILE_SIZE + TILE_SIZE / 2, this._y * TILE_SIZE + TILE_SIZE / 2);
    this.stats.hp[0] -= amount;
    GameContext.log?.addEntry(`You take ${amount} damage! ${element ? `(${element} damage)` : ""}`, "red");

    this.normalizeValues();

    if (this.stats.hp[0] <= 0) {
      this.scene.events.emit("player:died", this);
    }
    return true;
  }

  normalizeValues() {
    for (const stat in this.stats) {
      this.stats[stat][0] = Math.min(this.stats[stat][1], Math.max(0, this.stats[stat][0]));
    }
    this.normalizeResistances();
    this.food = Math.min(100, Math.max(0, this.food));
  }

  setResistance(element, amount, onlySet = false) {
    if (!this.resistances || !Object.hasOwn(this.resistances, element)) {
      return;
    }

    super.setResistance(element, amount, onlySet);

    if (onlySet) {
      GameContext.log?.addEntry(`Your ${element} resistance is now ${amount}.`, "lightblue", true);
      return;
    }

    if (amount > 0) {
      GameContext.log?.addEntry(`Your ${element} resistance increased by ${amount}.`, "lightblue");
    } else {
      GameContext.log?.addEntry(`Your ${element} resistance decreased by ${-amount}.`, "lightblue");
    }
  }

  setMaxStats(stat, amount, index = 1) {
    this.setStats(stat, amount, index);
  }

  getStats(stat) {
    return this.stats?.[stat]?.[0] ?? null;
  }

  setStats(stat, amount, index = 0) {
    if (!this.stats[stat]) return;
    this.stats[stat][index] += amount;
    this.normalizeValues();

    if (amount > 0) {
      if (this.hasCondition("Disease") && stat === "hp") {
        GameContext.log?.addEntry(`You are diseased and can not heal yourself!`, "red");
        return;
      }
      if (index === 0) {
        GameContext.log?.addEntry(`You gain ${amount} ${stat.toUpperCase()}!`, "green");
      } else {
        GameContext.log?.addEntry(`Your maximum ${stat.toUpperCase()} increased by ${amount}!`, "green");
      }
    } else {
      if (index === 0) {
        GameContext.log?.addEntry(`You lose ${-amount} ${stat.toUpperCase()}!`, "red");
      } else {
        GameContext.log?.addEntry(`Your maximum ${stat.toUpperCase()} decreased by ${-amount}!`, "red");
      }
    }

    if (stat === "hp" && this.stats[stat][0] <= 0) {
      this.scene.events.emit("player:died", this);
      return;
    }
  }

  addSpell(spell) {
    if (this.spellbook.some((s) => s.name === spell.name)) {
      GameContext.log?.addEntry(`You already know the "${spell.name}" spell!`, "yellow");
      return;
    }

    const effects = {
      stats: spell.stats ?? {},
      extra: spell.extra ?? {},
      hits: spell.hits ?? 1,
      conditions: spell.conditions ?? [],
      typeBasedDamage: spell.typeBasedDamage ?? {},
    };

    this.spellbook.push(
      new Spell(
        this.scene,
        spell.name,
        spell.sprite,
        spell.color,
        spell.type,
        spell.cost,
        spell.aoe,
        spell.singleTarget,
        effects,
      ),
    );
    GameContext.log?.addEntry(`You learn the "${spell.name}" spell!`, "green");
  }

  getSkills() {
    return this.skills;
  }

  addSkill(skill) {
    if (this.hasSkill(skill)) {
      for (const s of this.skills) {
        if (s.name === skill) {
          s.level += 1;
          GameContext.log?.addEntry(`Your ${skill} skill has increased to level ${s.level}!`, "green");
          return;
        }
      }
      return;
    }

    this.skills.push(new Skill(this.scene, skill));
    GameContext.log?.addEntry(`You learn the ${skill} skill!`, "green");
  }

  removeSkill(skill) {
    if (!this.skills.some((s) => s.name === skill.name)) {
      return;
    }
    this.skills = this.skills.filter((s) => s.name !== skill.name);
    GameContext.log?.addEntry(`You forget the ${skill.name} skill!`, "red");
  }

  hasSkill(skillName, level = 1) {
    return this.skills.some((skill) => skill.name === skillName && skill.level >= level);
  }

  cast(spell) {
    spell.cast(this);
  }

  shoot() {
    if (this.hasCondition("Blindness")) {
      GameContext.log?.addEntry(`You are blinded and can't see to shoot!`, "yellow");
      return;
    }
    const enemy = this.getNearestEnemy();
    if (enemy) {
      shootArrow(this.scene, this, enemy.position.x * TILE_SIZE, enemy.position.y * TILE_SIZE);
      this.attack(enemy);
    } else {
      GameContext.log?.addEntry(`There is no clear target in range (${this.equipment.weapon?.getRange()})!`, "yellow");
    }
  }

  attack(enemy) {
    let actorDmg = Phaser.Math.Between(this.dmg[0], this.dmg[1]) + this.dmg[2];
    const enemyAc = enemy.getAc();
    const d20 = Phaser.Math.Between(1, 20);
    const hit = d20 >= enemyAc ? d20 : 0;
    const weapon = this.equipment.weapon;

    if (!hit) {
      GameContext.log?.addEntry(`You attack ${enemy.name} but miss!`, "yellow");
      return;
    }
    if (hit === 20) {
      GameContext.log?.addEntry(`Critical hit! You attack ${enemy.name} with great force!`, "orange");
      actorDmg *= 2;
    } else {
      GameContext.log?.addEntry(`You attack ${enemy.name} with your ${weapon?.name ?? "fists"}!`, "red");
    }

    // always apply physical damage first, then apply elemental damage from weapon effects
    actorDmg = enemy.applyResistance(actorDmg, "physical");
    enemy.takeDamage(actorDmg);

    // apply weapon conditions on hit
    if (weapon?.effects?.conditions) {
      for (const condition of weapon.effects.conditions) {
        if (condition.getChance() < Math.random()) {
          continue;
        }
        enemy.addCondition(condition.clone());
      }
    }

    // additional damage from weapon effects
    if (weapon?.effects?.extra) {
      for (const [element, value] of Object.entries(weapon.effects.extra)) {
        if (!enemy.takeDamage(value, element)) {
          return;
        }
      }
    }
  }

  dies() {
    this.alive = false;

    if (typeof this.sprite === "string") {
      this.gameObject.setTint(0xff0000);
      this.gameObject.setAlpha(0.5);
    } else {
      this.gameObject.setTint(0xff0000);
      this.gameObject.text = "X";
    }
    this.clearConditionIndicators();
    const dieMessage = Phaser.Utils.Array.GetRandom(this.dieMessages);
    GameContext.log?.addEntry(`***${dieMessage}***`, "red");
  }
}
