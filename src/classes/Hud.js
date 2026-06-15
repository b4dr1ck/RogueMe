import { FONT_SIZE, FONT_FAMILY, DEFAULT_COLOR, STATS_COLOR, ITEM_CATEGORIES_COLOR } from "@/config/text.js";

export class Hud {
  constructor(scene, player, x, y) {
    this.scene = scene;
    this.player = player;
    this.x = x;
    this.y = y;
    this.categories = ["Conditions", "Inventory", "Equipment", "Spellbook", "Skills"];
    this.currentCategory = "Inventory";
    this.pageSize = 9;

    this.categoryPages = {};
    this.categories.forEach((cat) => {
      this.categoryPages[cat] = 0;
    });

    this.hudGroup = this.scene.add.group();

    this.content = [];
    this.lineObjects = [];
  }

  update() {
    this.create();
    this.ensureLineObjects(this.content.length);
    this.applyContent();
  }

  switchCategory(categoryName) {
    if (categoryName && this.categories.includes(categoryName)) {
      this.currentCategory = categoryName;
      this.clampCurrentPage();
      this.update();
      return;
    }
    this.currentCategory =
      this.categories[(this.categories.indexOf(this.currentCategory) + 1) % this.categories.length];
    this.clampCurrentPage();
    this.update();
  }

  getCurrentCategory() {
    return this.currentCategory;
  }

  getPageCount(category = this.currentCategory) {
    if (category === "Inventory") {
      return Math.max(1, Math.ceil(this.player.inventory.length / this.pageSize));
    } else if (category === "Spellbook") {
      return Math.max(1, Math.ceil(this.player.spellbook.length / this.pageSize));
    }

    return 1;
  }

  getCurrentPage(category = this.currentCategory) {
    return this.categoryPages[category] ?? 0;
  }

  setCurrentPage(page, category = this.currentCategory) {
    if (!this.categoryPages.hasOwnProperty(category)) {
      this.categoryPages[category] = 0;
    }
    const maxPage = this.getPageCount(category) - 1;
    this.categoryPages[category] = Math.max(0, Math.min(page, maxPage));
  }

  clampCurrentPage() {
    const current = this.getCurrentPage();
    const maxPage = this.getPageCount() - 1;
    if (current > maxPage) {
      this.setCurrentPage(maxPage);
    }
  }

  getPageOffset(category = this.currentCategory) {
    return this.getCurrentPage(category) * this.pageSize;
  }

  pageUp() {
    if (this.getPageCount() <= 1) {
      return; // No paging for this category
    }

    const current = this.getCurrentPage();
    if (current > 0) {
      this.setCurrentPage(current - 1);
      this.update();
    }
  }

  pageDown() {
    if (this.getPageCount() <= 1) {
      return; // No paging for this category
    }

    const current = this.getCurrentPage();
    const maxPage = this.getPageCount() - 1;
    if (current < maxPage) {
      this.setCurrentPage(current + 1);
      this.update();
    }
  }

  create() {
    const seperator = [""];
    switch (this.currentCategory) {
      case "Conditions":
        this.content = [this.createStatsContent(), seperator, this.createConditionsContent()].flat();
        break;
      case "Inventory":
        this.content = [this.createStatsContent(), seperator, this.createInventoryContent()].flat();
        break;
      case "Equipment":
        this.content = [this.createStatsContent(), seperator, this.createEquipmentContent()].flat();
        break;
      case "Spellbook":
        this.content = [this.createStatsContent(), seperator, this.createSpellbookContent()].flat();
        break;
      case "Skills":
        this.content = [this.createStatsContent(), seperator, this.createSkillsContent()].flat();
        break;
    }
  }

  createSkillsContent() {
    const skills =
      this.player.getSkills().length === 0
        ? [["(none)", DEFAULT_COLOR]]
        : this.player.getSkills().map((skill) => {
            const color = STATS_COLOR[skill] || DEFAULT_COLOR;
            return [`${skill.name} (${skill.level})`, color];
          });

    return [["Skills", "lightgreen"], ["=============================", DEFAULT_COLOR], ...skills];
  }

  createEquipmentContent() {
    function formatedArmorDetails(player, type) {
      const armor = player.getEquipment(type);
      if (!armor) {
        return "(none)";
      }
      const ac = armor.effects?.ac ? `AC ${armor.effects.ac}` : "";
      const res = armor.effects?.resistances
        ? Object.entries(armor.effects.resistances)
            .map(([res, value]) => `${res.substring(0, 3)} ${value > 0 ? "+" : ""}${value}`)
            .join(" ")
        : "";
      const stats = armor.effects?.maxStats
        ? Object.entries(armor.effects.maxStats)
            .map(([stat, value]) => `${stat.substring(0, 3)} ${value > 0 ? "+" : ""}${value}`)
            .join(" ")
        : "";

      return `${ac} [${res}] [${stats}]`;
    }

    function fromatedWeaponDetails(player) {
      const weapon = player.getEquipment("weapon");
      if (!weapon) {
        return "(none)";
      }
      const dmg = weapon.effects?.stats?.dmg
        ? `${weapon.effects.stats.dmg[0]}d${weapon.effects.stats.dmg[1]}+${weapon.effects.stats.dmg[2]}`
        : "";
      const extra = weapon.effects?.extra
        ? Object.entries(weapon.effects.extra)
            .map(([element, value]) => `${element.substring(0, 3)} ${value > 0 ? "+" : ""}${value}`)
            .join(" ")
        : "";
      const conditions = weapon.effects?.conditions
        ? weapon.effects.conditions.map((cond) => cond.name.substring(0, 3)).join(" ")
        : "";

      return `${dmg} [${extra}] [${conditions}]`;
    }

    return [
      ["Equipment", "lightgreen"],
      ["=============================", DEFAULT_COLOR],
      [`[1] Head: ${this.player.getEquipment("head")?.name ?? "(none)"}`, ITEM_CATEGORIES_COLOR.armor],
      [`${formatedArmorDetails(this.player, "head")}`, DEFAULT_COLOR],
      [`[2] Body: ${this.player.getEquipment("body")?.name ?? "(none)"}`, ITEM_CATEGORIES_COLOR.armor],
      [`${formatedArmorDetails(this.player, "body")}`, DEFAULT_COLOR],
      [`[3] Feet: ${this.player.getEquipment("feet")?.name ?? "(none)"}`, ITEM_CATEGORIES_COLOR.armor],
      [`${formatedArmorDetails(this.player, "feet")}`, DEFAULT_COLOR],
      [`[4] Hand: ${this.player.getEquipment("hand")?.name ?? "(none)"}`, ITEM_CATEGORIES_COLOR.armor],
      [`${formatedArmorDetails(this.player, "hand")}`, DEFAULT_COLOR],
      [`[5] Accessory: ${this.player.getEquipment("accessory")?.name ?? "(none)"}`, ITEM_CATEGORIES_COLOR.armor],
      [`${formatedArmorDetails(this.player, "accessory")}`, DEFAULT_COLOR],
      [`[6] Weapon: ${this.player.getEquipment("weapon")?.name ?? "(none)"}`, ITEM_CATEGORIES_COLOR.weapon],
      [`${fromatedWeaponDetails(this.player)}`, DEFAULT_COLOR],
      ["-----------------------------", DEFAULT_COLOR],
      [`Total AC: ${this.player.getAc()}`, STATS_COLOR.ac || DEFAULT_COLOR],
    ];
  }

  createSpellbookContent() {
    this.clampCurrentPage();

    const pageCount = this.getPageCount("Spellbook");
    const offset = this.getPageOffset("Spellbook");
    const visibleEntries = this.player.spellbook.slice(offset, offset + this.pageSize);
    const currentPage = this.getCurrentPage("Spellbook");
    const lines = [
      [`Spellbook (${currentPage + 1}/${pageCount})`, "fuchsia"],
      ["=============================", DEFAULT_COLOR],
    ];

    if (visibleEntries.length === 0) {
      lines.push(["(empty)", "fuchsia"]);
      return lines;
    }

    visibleEntries.forEach((entry, index) => {
      const color = entry.color || "fuchsia";
      const cost = entry.type === "spell" ? ` (${entry.cost} MP)` : ` (${entry.cost} STM)`;
      lines.push([`[${index + 1}] ${entry.name}${cost}`, color]);
    });

    return lines;
  }

  createInfoContent() {
    return [
      [`${this.scene.currentLevel.getMap().name}`, "yellow"],
      ["=============================", DEFAULT_COLOR],
      [`"${this.player.name}"`, "white"],
      [`Position: ${this.player.position.x}, ${this.player.position.y}`, DEFAULT_COLOR],
      [`Steps: ${this.player.getSteps()}`, DEFAULT_COLOR],
      [`Hunger: ${100 - this.player.getFood()}/100`, DEFAULT_COLOR],
    ];
  }

  createStatsContent() {
    const statSymbols = { hp: "♥", mp: "✦", stm: "⚡" };

    const info = this.createInfoContent();
    const stats = Object.entries(this.player.stats).map(([stat, value]) => {
      const color = STATS_COLOR[stat] || DEFAULT_COLOR;
      return [`${statSymbols[stat]} ${stat.toUpperCase()}: ${value[0]} / ${value[1]}`, color];
    });

    const resistanceEntries = Object.entries(this.player.resistances);
    const resistanceLines = [];
    const hasResistances = resistanceEntries.some(([_, value]) => value !== 0);

    if (!hasResistances) {
      resistanceLines.push(["(no resistances)", DEFAULT_COLOR]);
    } else {
      for (let i = 0; i < resistanceEntries.length; i += 3) {
        const chunk = resistanceEntries.filter(([_, value]) => value !== 0).slice(i, i + 3);
        const line = chunk.map(([res, value]) => `${res.substring(0, 3)}: ${value}`).join(" ");
        if (line) {
          resistanceLines.push([line, DEFAULT_COLOR]);
        }
      }
    }

    return [
      ...info,
      ["-----------------------------", DEFAULT_COLOR],
      ...stats,
      ["-----------------------------", DEFAULT_COLOR],
      ...resistanceLines,
    ];
  }

  createConditionsContent() {
    const conditions =
      this.player.conditions.length === 0
        ? [["(none)", DEFAULT_COLOR]]
        : this.player.conditions.map((cond) => [`${cond.name} (${cond.duration} turns)`, cond.color || DEFAULT_COLOR]);

    return [["Conditions", "orange"], ["=============================", DEFAULT_COLOR], ...conditions];
  }

  createInventoryContent() {
    this.clampCurrentPage();

    const pageCount = this.getPageCount();
    const offset = this.getPageOffset();
    const visibleEntries = this.player.inventory.slice(offset, offset + this.pageSize);
    const currentPage = this.getCurrentPage();
    const lines = [
      [`Inventory (${currentPage + 1}/${pageCount})`, "lightblue"],
      ["=============================", DEFAULT_COLOR],
    ];

    if (visibleEntries.length === 0) {
      lines.push(["(empty)", "lightblue"]);
      return lines;
    }

    visibleEntries.forEach((entry, index) => {
      // New stacked inventory format: { name, count, ... }
      if (entry && typeof entry === "object" && "count" in entry && "name" in entry) {
        const color = ITEM_CATEGORIES_COLOR[entry.items[0].type] || "lightblue";
        lines.push([`[${index + 1}] ${entry.name} (${entry.count})`, color]);
        return;
      }

      lines.push([`[${index + 1}] ${entry?.name ?? "Unknown"}`, "lightblue"]);
    });

    return lines;
  }

  ensureLineObjects(lineCount) {
    while (this.lineObjects.length < lineCount) {
      const index = this.lineObjects.length;
      const textObj = this.scene.add.text(this.x, this.y + index * (FONT_SIZE + 4), "", {
        fontSize: `${FONT_SIZE}px`,
        fontFamily: FONT_FAMILY,
        color: DEFAULT_COLOR,
      });
      textObj.setScrollFactor(0);

      this.hudGroup.add(textObj);
      this.lineObjects.push(textObj);
    }
  }

  applyContent() {
    this.lineObjects.forEach((lineObject, index) => {
      const entry = this.content[index];

      if (!entry) {
        lineObject.setVisible(false);
        return;
      }

      const [text, color] = entry;
      lineObject.setPosition(this.x, this.y + index * (FONT_SIZE + 4));
      lineObject.setText(text);
      lineObject.setColor(color);
      lineObject.setScrollFactor(0);
      lineObject.setVisible(true);
    });
  }

  render() {
    this.update();
  }
}
