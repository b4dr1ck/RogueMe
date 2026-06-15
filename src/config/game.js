export const TILE_SIZE = 32;
export const WALKABLE_TILES = [".", " ", "_"];


// Entity rendering depth (higher = on top)
export const RENDER_DEPTH = {
  tile: 0,
  item: 10,
  deco: 1,
  trap: 1,
  teleporter: 10,
  door: 15,
  switch: 2,
  actor: 100, // Player and Enemy
  exit: 5,
};


export const WORLD_VIEW = { x: 0, y: 0, width: 640, height: 640 };
export const CAMERA_ZOOM = 2;