import { FONT_SIZE, FONT_FAMILY, DEFAULT_COLOR, MAX_LOG_ENTRIES } from "@/config/text.js";

export class Log {
  constructor(scene, x, y) {
    this.MAX_TOTAL = 1000;

    this.scene = scene;
    this.x = x;
    this.y = y;

    this.logGroup = this.scene.add.group();

    this.content = [];
    this.lineObjects = [];
  }

  addEntry(text, color = DEFAULT_COLOR, once = false, size = FONT_SIZE) {
    if (once) {
      const existingEntry = this.content.find(([entryText]) => entryText === text);
      if (existingEntry) {
        return; // Skip adding duplicate entry
      }
    }
    this.content.push([text, color, size]);
    this.render();
  }

  ensureLineObjects() {
    while (this.lineObjects.length < MAX_LOG_ENTRIES) {
      const index = this.lineObjects.length;
      const textObj = this.scene.add.text(this.x, this.y + index * (FONT_SIZE + 4), "", {
        fontSize: `${FONT_SIZE}px`,
        fontFamily: FONT_FAMILY,
        color: DEFAULT_COLOR,
      });
      textObj.setScrollFactor(0);

      this.logGroup.add(textObj);
      this.lineObjects.push(textObj);
    }
  }

  render() {
    this.cleanup();

    this.ensureLineObjects();
    const entriesToShow = this.content.slice(-MAX_LOG_ENTRIES);

    this.lineObjects.forEach((lineObject, index) => {
      const entry = entriesToShow[index];

      if (!entry) {
        lineObject.setText("");
        lineObject.setVisible(false);
        return;
      }

      const [text, color, size] = entry;
      lineObject.setPosition(this.x, this.y + index * (size + 4));
      lineObject.setText(text);
      lineObject.setFontSize(size);
      lineObject.setColor(color);
      lineObject.setScrollFactor(0);
      lineObject.setVisible(true);
    });
  }

  cleanup() {
    if (this.content.length > this.MAX_TOTAL) {
      this.content = this.content.slice(-this.MAX_TOTAL);
      this.render();
    }
  }

  clear() {
    this.content = [];
    this.lineObjects.forEach((lineObject) => {
      lineObject.setText("");
      lineObject.setVisible(false);
    });
  }
}
