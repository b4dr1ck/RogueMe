export class Skill {
  constructor(scene, name) {
    this.scene = scene;
    this._name = name;
    this._level = 1;
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
  }

  get level() {
    return this._level;
  }

  set level(value) {
    this._level = value;
  }
}
