import { Game } from "@/scenes/Game.js";

const config = {
  type: Phaser.AUTO,
  pixelArt: true,
  backgroundColor: "#000000",
  width: 1700,
  height: 800,
  scene: [Game],
};

new Phaser.Game(config);
