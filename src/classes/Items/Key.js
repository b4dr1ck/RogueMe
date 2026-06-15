import { Item } from "./Item.js";
import { GameContext } from "@/services/GameContext.js";

export class Key extends Item {
  use(target = this.scene.player) {
    if (!target) {
      return false;
    }
    return this.useKeyOnDoor(target);
  }

  useKeyOnDoor(target) {
    const door = this.scene.currentLevel.entities.doors.find((door) => {
      return (
        door.getKey() &&
        ((Math.abs(door.position.x - target.position.x) === 1 && door.position.y === target.position.y) ||
          (Math.abs(door.position.y - target.position.y) === 1 && door.position.x === target.position.x))
      );
    });

    if (!door) {
      GameContext.log?.addEntry(`There is no door adjacent to use the ${this.name} on.`, "orange");
      return false;
    }

    if (door.key?.name === this.name) {
      door.setKey(null); // Remove the key requirement from the door
      door.open();
    } else {
      GameContext.log?.addEntry(`The ${this.name} doesn't fit the ${door.name}.`, "orange");
      return false;
    }

    return true;
  }
}
