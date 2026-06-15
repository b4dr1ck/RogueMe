import { RENDER_DEPTH } from "@/config/game.js";

export class Blood {
  constructor(scene) {
    this.scene = scene;
     this.bloodGroup = this.scene.add.group();  
  }

  addBlood(x,y) {
    const randomSize = Phaser.Math.Between(3, 7);
    const blood = this.scene.add.circle(x, y, randomSize, 0xff0000);
    const xOffset = Phaser.Math.Between(-10, 10);
    const yOffset = Phaser.Math.Between(-10, 10);
    blood.x += xOffset;
    blood.y += yOffset;

    this.bloodGroup.add(blood);
    this.bloodGroup.setDepth(RENDER_DEPTH.deco - 1); 
    this.bloodGroup.setAlpha(0.5);
  }

  clearBlood() {
    this.bloodGroup.clear(true, true); 
  }
}