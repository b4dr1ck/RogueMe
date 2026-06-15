import { TILE_SIZE } from "@/config/game.js";

export class InputController {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.cooldown = options.cooldown ?? 120;
    this.nextAt = 0;

    // Mouse Debug: Log tile coordinates on click
    this.scene.input.on("pointerdown", (pointer) => {
      const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
      const tileX = Math.floor(worldPoint.x / TILE_SIZE);
      const tileY = Math.floor(worldPoint.y / TILE_SIZE);
      console.log(`Clicked tile: (${tileX}, ${tileY})`);
      const entities = this.scene.currentLevel.getEntitiesAt(tileX, tileY);
      console.log("Entities at clicked tile:", entities);
      console.log("Tile:", this.scene.currentLevel.getMap().getTile(tileX, tileY));
    });

    this.keys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      l: Phaser.Input.Keyboard.KeyCodes.L,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      h: Phaser.Input.Keyboard.KeyCodes.H,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      i: Phaser.Input.Keyboard.KeyCodes.I,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      1: Phaser.Input.Keyboard.KeyCodes.ONE,
      2: Phaser.Input.Keyboard.KeyCodes.TWO,
      3: Phaser.Input.Keyboard.KeyCodes.THREE,
      4: Phaser.Input.Keyboard.KeyCodes.FOUR,
      5: Phaser.Input.Keyboard.KeyCodes.FIVE,
      6: Phaser.Input.Keyboard.KeyCodes.SIX,
      7: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      8: Phaser.Input.Keyboard.KeyCodes.EIGHT,
      9: Phaser.Input.Keyboard.KeyCodes.NINE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      tab: Phaser.Input.Keyboard.KeyCodes.TAB,
      pageUp: Phaser.Input.Keyboard.KeyCodes.PAGE_UP,
      pageDown: Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN,
    });
  }

  update(time) {
    if (time < this.nextAt) {
      return;
    }

    let dx = 0;
    let dy = 0;

    if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
      dx = -1;
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      dx = 1;
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      dy = -1;
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      dy = 1;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.w)) {
      this.scene.events.emit("input:wait", this.scene.player);
      this.nextAt = time + this.cooldown;
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      this.scene.events.emit("input:equipment", this.scene.player);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      this.scene.events.emit("input:inventory", this.scene.player);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.h)) {
      this.scene.events.emit("input:help", this.scene.player);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.s)) {
      this.scene.events.emit("input:shoot", this.scene.player);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.l)) {
      this.scene.events.emit("input:look", this.scene.player);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      this.scene.scene.restart();
    }

    if (dx !== 0 || dy !== 0) {
      this.scene.events.emit("input:move", { dx, dy });
      this.nextAt = time + this.cooldown;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.p)) {
      this.scene.events.emit("input:pickpocketing", this.scene.player);
    }

    // Check for item use / drop (keys 1-9)
    // Shift + number => drop item in slot
    // number => use item in slot
    for (let i = 1; i <= 9; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.keys[i])) {
        if (this.keys.shift.isDown) {
          if (this.scene.hud.getCurrentCategory() === "Inventory") {
            this.scene.events.emit("input:dropItem", i - 1);
          } else if (this.scene.hud.getCurrentCategory() === "Equipment") {
            this.scene.events.emit("input:unequipItem", i - 1);
          }
        } else {
          if (this.scene.hud.getCurrentCategory() === "Inventory") {
            this.scene.events.emit("input:useItem", i - 1);
          } else if (this.scene.hud.getCurrentCategory() === "Spellbook") {
            this.scene.events.emit("input:castSpell", this.scene.player, i - 1);
          }
        }
        break;
      }
    }
    // Debug: Restart scene on 'R' key press
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      this.scene.scene.restart();
    }

    // Switch HUD category on 'TAB' key press
    if (Phaser.Input.Keyboard.JustDown(this.keys.tab)) {
      this.scene.events.emit("input:switchHudCategory");
    }

    // Inventory page navigation
    if (Phaser.Input.Keyboard.JustDown(this.keys.pageUp)) {
      this.scene.events.emit("input:hudPageUp");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.pageDown)) {
      this.scene.events.emit("input:hudPageDown");
    }
  }
}
