import { playBloodSplatter } from "@/animation/particles.js";
import { GameContext } from "@/services/GameContext.js";
import { TILE_SIZE, RENDER_DEPTH } from "@/config/game.js";

import { Actor } from "@/classes/Actor.js";
import { shootArrow } from "@/animation/tweens.js";

export class Enemy extends Actor {
  constructor(
    scene,
    name,
    type,
    sprite,
    x,
    y,
    hp,
    ac = 0,
    view = 5,
    speed = 1,
    diagonal = true,
    attacks = [],
    mobile = false,
    resistances = { fire: 0, water: 0, earth: 0, air: 0 },
    loot = [],
    canPickPocket = 1,
  ) {
    super(scene, name, sprite, x, y, resistances);
    this.type = type;
    this.hp = hp;
    this.ac = ac;
    this.view = view;
    this.speed = speed;
    this.diagonal = diagonal;
    this.ticks = 0;
    this.attacks = attacks;
    this.mobile = mobile;
    this.dieMessages = [
      `${this.name} collapses to the ground!`,
      `With a final gasp, ${this.name} falls!`,
      `${this.name} has been slain!`,
      `The ${this.name} lets out a final roar before dying!`,
      `The ${this.name} has been defeated!`,
      `${this.name} dies in pain!`,
    ];
    this.loot = loot;
    this.canPickPocket = canPickPocket;
  }

  // Enemy-specific condition log messages
  _conditionAddedMsg(conditionName, duration) {
    return `The ${this.name} is now affected by ${conditionName} for ${duration} turns!`;
  }

  _conditionRefreshedMsg(_conditionName, duration) {
    return `The ${this.name} condition duration has been refreshed to ${duration} turns!`;
  }

  _conditionRemovedMsg(conditionName) {
    return `The ${this.name} is no longer affected by ${conditionName}!`;
  }

  getType() {
    return this.type;
  }

  getView() {
    return this.view;
  }

  getLoot() {
    return this.loot;
  }

  setLoot(loot) {
    this.loot = loot;
  }

  canPickPocket() {
    return this.canPickPocket;
  }

  takeDamage(amount, element = null) {
    if (!this.alive) {
      return;
    }
    amount = this.applyResistance(amount, element);
    if (element && amount === 0) {
      GameContext.log?.addEntry(`${this.name} is immune to ${element} damage!`, "cadetblue");
      return false;
    }

    if (amount === 0) {
      GameContext.log?.addEntry(`${this.name} resists the attack!`, "gray");
      return false;
    }

    playBloodSplatter(this.scene, this._x * TILE_SIZE + TILE_SIZE / 2, this._y * TILE_SIZE + TILE_SIZE / 2);
    this.scene.blood.addBlood(this._x * TILE_SIZE + TILE_SIZE / 2, this._y * TILE_SIZE + TILE_SIZE / 2);
    GameContext.log?.addEntry(`${this.name} takes ${amount} damage! ${element ? `(${element} damage)` : ""}`, "green");
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) {
      this.alive = false;
      this.destroy();
      this.createLoot();
    }
    return true;
  }

  createLoot() {
    const level = this.scene.currentLevel;

    if (this.loot.length === 0) {
      return;
    }

    GameContext.log?.addEntry(`${this.name} dropped some stuff!`, "yellow");
    this.loot.forEach((item) => {
      item.position = { x: this._x, y: this._y };
      level.addEntity("items", item);
    });
    level.renderItemStackAt(this._x, this._y);
  }

  getAc() {
    return this.ac;
  }

  isMobile() {
    return this.mobile;
  }

  checkDiagonal(dx, dy) {
    if (!this.diagonal) {
      if (dx !== 0 && dy !== 0) {
        // Randomly choose to prioritize horizontal or vertical movement when both are options
        if (Math.random() < 0.5) {
          dy = 0; // Prioritize horizontal movement
        } else {
          dx = 0; // Prioritize vertical movement
        }
      }
    }
    return { dx, dy };
  }

  incTick() {
    this.ticks++;
    this.attacks.forEach((attack) => {
      attack.advanceCooldown();
    });
  }

  getTicks() {
    return this.ticks;
  }

  getSpeed() {
    return this.speed;
  }

  inRangeOf(player, range) {
    if (player.hasCondition("Invisibility")) {
      return false;
    }

    const playerDistance = Math.max(
      Math.abs(player.position.x - this.position.x),
      Math.abs(player.position.y - this.position.y),
    );
    if (playerDistance > range) {
      return false;
    }

    if (this.hasLineOfSight(player.position.x, player.position.y)) {
      GameContext.log?.addEntry(`${this.name} notices you!`, "orange", true);
      return true;
    }
    return false;
  }

  chooseAttack() {
    if (!this.attacks.length) {
      return;
    }

    const availableAttacks = this.attacks.filter((attack) => attack.isReady());
    if (!availableAttacks.length) {
      return;
    }

    const attack = Phaser.Utils.Array.GetRandom(availableAttacks);
    return attack;
  }

  shoot(player, attack) {
    shootArrow(this.scene, this, player.position.x * TILE_SIZE, player.position.y * TILE_SIZE);
    this.attack(player, attack);
  }

  attack(player, attack = this.chooseAttack()) {
    if (!attack) {
      return false;
    }

    for (let i = 0; i < attack.getHits(); i++) {
      if (!player.alive || player.hasCondition("Invisibility")) {
        return true;
      }

      attack.consume(player);

      let dmg = attack.rollDamage();
      const playerAc = player.getAc();
      const d20 = Phaser.Math.Between(1, 20);
      const hit = d20 >= playerAc ? d20 : 0;
      const name = attack.getName();
      const condition = attack.getCondition();

      if (dmg > 0) {
        if (i === 0) {
          if (!hit) {
            GameContext.log?.addEntry(`${this.name} tries to attack you with ${name} but misses!`, "gray");
            return true;
          }

          if (hit === 20) {
            GameContext.log?.addEntry(`${this.name} critically hits you with ${name}!`, "darkred");
            dmg *= 2;
          } else {
            if (attack.getRange() > 1) {
              GameContext.log?.addEntry(
                `${this.name} (${this._x}, ${this._y}) attacks you with ${name} from a distance!`,
                "red",
              );
            } else {
              GameContext.log?.addEntry(`${this.name} (${this._x}, ${this._y}) attacks you with ${name}!`, "red");
            }
          }
        }

        // always apply physical damage first, then apply elemental damage from weapon effects
        dmg = player.applyResistance(dmg, "physical");
        player.takeDamage(dmg);
      }

      // cause condition on attack
      if (condition) {
        GameContext.log?.addEntry(
          `${this.name} (${this._x}, ${this._y}) inflicts ${condition.name} on you with ${name}!`,
          "purple",
        );
        player.addCondition(condition.clone());
      }

      // apply extra elemental damage from weapon effects
      if (attack.extra) {
        for (const [element, value] of Object.entries(attack.extra)) {
          if (!player.takeDamage(value, element)) {
            return true;
          }
        }
      }
    }
    return true;
  }

  render() {
    this.gameObject = this.scene.add.sprite(this._x * TILE_SIZE, this._y * TILE_SIZE, this.sprite).setOrigin(0);
    this.gameObject.setDepth(RENDER_DEPTH.actor);
    this.refreshConditionIndicators();
  }

  destroy() {
    const dieMessage = Phaser.Utils.Array.GetRandom(this.dieMessages);
    GameContext.log?.addEntry(dieMessage, "orange");
    const level = this.scene.currentLevel;
    if (level) {
      level.removeEnemy(this);
    }
    super.destroy();
  }
}
