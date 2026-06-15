import { Condition } from "@/classes/Condition.js";
import { Skill } from "@/classes/Skill.js";
import { SPELLS } from "@/config/spells.js";
import { Scroll } from "@/classes/Items/Scroll.js";
import { Key } from "@/classes/Items/Key.js";
import { Item } from "@/classes/Items/Item.js";
import { GameContext } from "@/services/GameContext.js";
import { Hud } from "@/classes/Hud.js";
import { InputController } from "@/classes/InputController.js";
import { InteractionController } from "@/classes/InteractionController.js";
import { Level } from "@/classes/Level.js";
import { Log } from "@/classes/Log.js";
import { MAPS } from "@/config/levels.js";
import { Map } from "@/classes/Map.js";
import { MovementController } from "@/classes/MovementController.js";
import { PLAYER_SPRITE } from "@/config/player.js";
import { Player } from "@/classes/Player.js";
import { WALKABLE_TILES, TILE_SIZE, WORLD_VIEW } from "@/config/game.js";
import { createGameHandlers, renderCurrentLevel, setupCamera, syncCameraLayers } from "@/scenes/gameDirector.js";
import { Blood } from "@/classes/Blood.js";
import { FogOfWar } from "@/classes/FogOfWar.js";

export class Game extends Phaser.Scene {
  constructor() {
    super("Game");
    this.inputController = null;
    this.fpRenderer = null;
    this.movementController = null;
    this.interactionController = null;
    this.currentLevel = null;
    this.levels = [];
    this.player = null;
    this.hud = null;
    this.log = null;
    this.handlers = null;
    this.blood = null;
    this.fogOfWar = null;
    this.uiCamera = null;
    this.cameraTarget = null;
  }

  preload() {
    // graphics
    this.load.image("apple1", "assets/apple1.png");
    this.load.image("apple2", "assets/apple2.png");
    this.load.image("archertrap", "assets/archertrap.png");
    this.load.image("blackpotion", "assets/blackpotion.png");
    this.load.image("blood1", "assets/blood1.png");
    this.load.image("blueportal", "assets/blueportal.png");
    this.load.image("bluepotion", "assets/bluepotion.png");
    this.load.image("book1", "assets/book1.png");
    this.load.image("book2", "assets/book2.png");
    this.load.image("book3", "assets/book3.png");
    this.load.image("bow", "assets/bow.png");
    this.load.image("bread", "assets/bread.png");
    this.load.image("broadsword", "assets/broadsword.png");
    this.load.image("bronzekey", "assets/bronzekey.png");
    this.load.image("cheese", "assets/cheese.png");
    this.load.image("corpse1", "assets/corpse1.png");
    this.load.image("darkbluepotion", "assets/darkbluepotion.png");
    this.load.image("darkgreenpotion", "assets/darkgreenpotion.png");
    this.load.image("darkredpotion", "assets/darkredpotion.png");
    this.load.image("floor1", "assets/floor1.png");
    this.load.image("floor2", "assets/floor2.png");
    this.load.image("floor3", "assets/floor3.png");
    this.load.image("floor4", "assets/floor4.png");
    this.load.image("floor5a", "assets/floor5a.png");
    this.load.image("floor5b", "assets/floor5b.png");
    this.load.image("gastrap", "assets/gastrap.png");
    this.load.image("goblin", "assets/goblin.png");
    this.load.image("goldendoor", "assets/goldendoor.png");
    this.load.image("goldenkey", "assets/goldenkey.png");
    this.load.image("greenpotion", "assets/greenpotion.png");
    this.load.image("greenslime", "assets/greenslime.png");
    this.load.image("irondoor1", "assets/irondoor1.png");
    this.load.image("irondoor2", "assets/irondoor2.png");
    this.load.image("irongate", "assets/irongate.png");
    this.load.image("ironkey", "assets/ironkey.png");
    this.load.image("lava", "assets/lava.png");
    this.load.image("leatherarmor", "assets/leatherarmor.png");
    this.load.image("leatherarmor2", "assets/leatherarmor2.png");
    this.load.image("leatherboots", "assets/leatherboots.png");
    this.load.image("leathercap", "assets/leathercap.png");
    this.load.image("lever1a", "assets/lever1a.png");
    this.load.image("lever1b", "assets/lever1b.png");
    this.load.image("lightgreenpotion", "assets/lightgreenpotion.png");
    this.load.image("lightgreypotion", "assets/lightgreypotion.png");
    this.load.image("lockpick", "assets/lockpick.png");
    this.load.image("meat", "assets/meat.png");
    this.load.image("mud", "assets/mud.png");
    this.load.image("note1", "assets/note1.png");
    this.load.image("oakendoor", "assets/oakendoor.png");
    this.load.image("orangepotion", "assets/orangepotion.png");
    this.load.image("ogre", "assets/ogre.png");
    this.load.image("pickaxe", "assets/pickaxe.png");
    this.load.image("pillar1", "assets/pillar1.png");
    this.load.image("plate1a", "assets/plate1a.png");
    this.load.image("plate1b", "assets/plate1b.png");
    this.load.image("player", "assets/player.png");
    this.load.image("rat", "assets/rat.png");
    this.load.image("redpotion", "assets/redpotion.png");
    this.load.image("roach", "assets/roach.png");
    this.load.image("rottenapple", "assets/rottenapple.png");
    this.load.image("rottenmeat", "assets/rottenmeat.png");
    this.load.image("rustydoor", "assets/rustydoor.png");
    this.load.image("rustysword", "assets/rustysword.png");
    this.load.image("scroll1", "assets/scroll1.png");
    this.load.image("scroll2", "assets/scroll2.png");
    this.load.image("scroll3", "assets/scroll3.png");
    this.load.image("scroll4", "assets/scroll4.png");
    this.load.image("shovel", "assets/shovel.png");
    this.load.image("skeleton", "assets/skeleton.png");
    this.load.image("slime", "assets/slime.png");
    this.load.image("spike", "assets/spike.png");
    this.load.image("spikes1a", "assets/spikes1a.png");
    this.load.image("spikes1b", "assets/spikes1b.png");
    this.load.image("stairsdown", "assets/stairsdown.png");
    this.load.image("stairsup", "assets/stairsup.png");
    this.load.image("stick", "assets/stick.png");
    this.load.image("stone", "assets/stone.png");
    this.load.image("stonedoor", "assets/stonedoor.png");
    this.load.image("stonekey", "assets/stonekey.png");
    this.load.image("table", "assets/table.png");
    this.load.image("toilet", "assets/toilet.png");
    this.load.image("trapdisarmkit", "assets/trapdisarmkit.png");
    this.load.image("trapwire", "assets/trapwire.png");
    this.load.image("wall1", "assets/wall1.png");
    this.load.image("wall2", "assets/wall2.png");
    this.load.image("wall3", "assets/wall3.png");
    this.load.image("wall4", "assets/wall4.png");
    this.load.image("wall5", "assets/wall5.png");
    this.load.image("wall6", "assets/wall6.png");
    this.load.image("water1", "assets/water1.png");
    this.load.image("water2", "assets/water2.png");
    this.load.image("web", "assets/web.png");
    this.load.image("woodendoor", "assets/woodendoor.png");
    this.load.image("zombie", "assets/zombie.png");

    // audio
    //this.load.audio("step", "assets/step.wav");
  }

  create() {
    // levels from MAPS
    this.levels = MAPS.map((map) => {
      const mapInstance = new Map(this, map.name, map.data, map.sprites);
      const newLevel = new Level(mapInstance, map.specialTiles ?? []);
      newLevel.createEntities({ ...map.entities, exits: map.exits ?? [] });
      newLevel.createDecos(map.decos);

      return newLevel;
    });

    // player
    this.player = new Player(this, "The Spider Monkey", PLAYER_SPRITE, 1, 1);
    //this.player.levelIndex = 3;
    this.currentLevel = this.levels[this.player.levelIndex];

    // hud
    const hudy = 10;
    const hudx = WORLD_VIEW.width + 20;
    const logx = hudx + 300;
    this.hud = new Hud(this, this.player, hudx, hudy);

    // log
    this.log = new Log(this, logx, hudy);
    GameContext.log = this.log;
    GameContext.log.addEntry("Welcome to RogueMe!", "lightgreen", false, 18);
    GameContext.log.addEntry("=============================", "lightgreen");
    GameContext.log.addEntry("Press [H] for help.", "white");

    // rendering
    renderCurrentLevel(this);
    this.log.render();
    this.blood = new Blood(this);
    this.fogOfWar = new FogOfWar(this, { alpha: 0.95 });
    this.fogOfWar.updateForPlayer();
    setupCamera(this);
    syncCameraLayers(this);

    // Input, Interaction & Movement Controllers
    this.inputController = new InputController(this, { cooldown: 120 });
    this.movementController = new MovementController(this, { walkableTiles: WALKABLE_TILES });
    this.interactionController = new InteractionController(this);
    this.handlers = createGameHandlers(this);
    this.events.on("player:died", this.handlers.onPlayerDied, this);
    this.events.on("input:move", this.handlers.onInputMove, this);
    this.events.on("enemy:move", this.handlers.onEnemyMove, this);
    this.events.on("input:useItem", this.handlers.onUseItem, this);
    this.events.on("input:dropItem", this.handlers.onDropItem, this);
    this.events.on("input:unequipItem", this.handlers.onUnequipItem, this);
    this.events.on("input:switchHudCategory", this.handlers.onSwitchHudCategory, this);
    this.events.on("input:hudPageUp", this.handlers.onInventoryPageUp, this);
    this.events.on("input:hudPageDown", this.handlers.onInventoryPageDown, this);
    this.events.on("input:look", this.handlers.onLook, this);
    this.events.on("input:shoot", this.handlers.onShoot, this);
    this.events.on("input:help", this.handlers.onShowHelp, this);
    this.events.on("input:equipment", this.handlers.onShowEquipment, this);
    this.events.on("input:inventory", this.handlers.onShowInventory, this);
    this.events.on("input:castSpell", this.handlers.onCastSpell, this);
    this.events.on("input:pickpocketing", this.handlers.onPickpocketing, this);
    this.events.on("input:wait", this.handlers.onWait, this);
    // Clean up event listeners on scene shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off("player:died", this.handlers.onPlayerDied, this);
      this.events.off("input:move", this.handlers.onInputMove, this);
      this.events.off("enemy:move", this.handlers.onEnemyMove, this);
      this.events.off("input:useItem", this.handlers.onUseItem, this);
      this.events.off("input:dropItem", this.handlers.onDropItem, this);
      this.events.off("input:unequipItem", this.handlers.onUnequipItem, this);
      this.events.off("input:switchHudCategory", this.handlers.onSwitchHudCategory, this);
      this.events.off("input:hudPageUp", this.handlers.onInventoryPageUp, this);
      this.events.off("input:hudPageDown", this.handlers.onInventoryPageDown, this);
      this.events.off("input:look", this.handlers.onLook, this);
      this.events.off("input:shoot", this.handlers.onShoot, this);
      this.events.off("input:help", this.handlers.onShowHelp, this);
      this.events.off("input:equipment", this.handlers.onShowEquipment, this);
      this.events.off("input:inventory", this.handlers.onShowInventory, this);
      this.events.off("input:castSpell", this.handlers.onCastSpell, this);
      this.events.off("input:pickpocketing", this.handlers.onPickpocketing, this);
      this.events.off("input:wait", this.handlers.onWait, this);
      this.fogOfWar?.destroy();
      this.fogOfWar = null;
      this.uiCamera = null;
      this.cameraTarget = null;
    });
  }

  update(time) {
    if (this.inputController) {
      this.inputController.update(time);
    }
  }
}
