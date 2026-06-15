function createSeededRandom(seed = Date.now()) {
  const normalizedSeed = typeof seed === "string"
    ? seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    : seed;

  let t = (normalizedSeed >>> 0) || 1;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function createGrid(width, height, fill = "#") {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

function carveRoom(grid, room, tile = ".") {
  for (let y = room.y; y < room.y + room.h; y += 1) {
    for (let x = room.x; x < room.x + room.w; x += 1) {
      grid[y][x] = tile;
    }
  }
}

function carveCorridor(grid, x1, y1, x2, y2, rng) {
  const horizontalFirst = rng() < 0.5;

  const carveH = (fromX, toX, y) => {
    const start = Math.min(fromX, toX);
    const end = Math.max(fromX, toX);
    for (let x = start; x <= end; x += 1) grid[y][x] = ".";
  };

  const carveV = (fromY, toY, x) => {
    const start = Math.min(fromY, toY);
    const end = Math.max(fromY, toY);
    for (let y = start; y <= end; y += 1) grid[y][x] = ".";
  };

  if (horizontalFirst) {
    carveH(x1, x2, y1);
    carveV(y1, y2, x2);
  } else {
    carveV(y1, y2, x1);
    carveH(x1, x2, y2);
  }
}

function roomCenter(room) {
  return {
    x: Math.floor(room.x + room.w / 2),
    y: Math.floor(room.y + room.h / 2),
  };
}

function collectFloorTiles(grid) {
  const tiles = [];
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[0].length; x += 1) {
      if (grid[y][x] === ".") tiles.push({ x, y });
    }
  }
  return tiles;
}

/**
 * BSP based random level generation.
 * Returns an object compatible with existing entries in MAPS.
 */
export function generateLevel({
  seed = Date.now(),
  width = 30,
  height = 20,
  name = "Random Level",
  minLeafSize = 8,
  maxDepth = 4,
  minRoomSize = 4,
} = {}) {
  const rng = createSeededRandom(seed);
  const grid = createGrid(width, height, "#");

  const root = { x: 1, y: 1, w: width - 2, h: height - 2, left: null, right: null, room: null };
  const leaves = [];

  const splitNode = (node, depth) => {
    const canSplitHorizontally = node.h >= minLeafSize * 2;
    const canSplitVertically = node.w >= minLeafSize * 2;

    if (depth >= maxDepth || (!canSplitHorizontally && !canSplitVertically)) {
      leaves.push(node);
      return;
    }

    const splitHorizontally = canSplitHorizontally && (!canSplitVertically || rng() < 0.5);

    if (splitHorizontally) {
      const split = randInt(rng, minLeafSize, node.h - minLeafSize);
      node.left = { x: node.x, y: node.y, w: node.w, h: split, left: null, right: null, room: null };
      node.right = {
        x: node.x,
        y: node.y + split,
        w: node.w,
        h: node.h - split,
        left: null,
        right: null,
        room: null,
      };
    } else {
      const split = randInt(rng, minLeafSize, node.w - minLeafSize);
      node.left = { x: node.x, y: node.y, w: split, h: node.h, left: null, right: null, room: null };
      node.right = {
        x: node.x + split,
        y: node.y,
        w: node.w - split,
        h: node.h,
        left: null,
        right: null,
        room: null,
      };
    }

    splitNode(node.left, depth + 1);
    splitNode(node.right, depth + 1);
  };

  splitNode(root, 0);

  for (const leaf of leaves) {
    const maxRoomW = Math.max(minRoomSize, leaf.w - 2);
    const maxRoomH = Math.max(minRoomSize, leaf.h - 2);
    const roomW = randInt(rng, minRoomSize, maxRoomW);
    const roomH = randInt(rng, minRoomSize, maxRoomH);
    const roomX = randInt(rng, leaf.x + 1, leaf.x + leaf.w - roomW - 1);
    const roomY = randInt(rng, leaf.y + 1, leaf.y + leaf.h - roomH - 1);

    leaf.room = { x: roomX, y: roomY, w: roomW, h: roomH };
    carveRoom(grid, leaf.room, ".");
  }

  const roomFromNode = (node) => {
    if (!node) return null;
    if (node.room) return node.room;
    const first = rng() < 0.5 ? node.left : node.right;
    const second = first === node.left ? node.right : node.left;
    return roomFromNode(first) || roomFromNode(second);
  };

  const connectTree = (node) => {
    if (!node || !node.left || !node.right) return;
    connectTree(node.left);
    connectTree(node.right);

    const roomA = roomFromNode(node.left);
    const roomB = roomFromNode(node.right);
    if (!roomA || !roomB) return;

    const a = roomCenter(roomA);
    const b = roomCenter(roomB);
    carveCorridor(grid, a.x, a.y, b.x, b.y, rng);
  };

  connectTree(root);

  const floorTiles = collectFloorTiles(grid);
  if (floorTiles.length >= 2) {
    const up = floorTiles[randInt(rng, 0, floorTiles.length - 1)];
    let down = up;
    let bestDistance = -1;

    for (const tile of floorTiles) {
      const distance = Math.abs(tile.x - up.x) + Math.abs(tile.y - up.y);
      if (distance > bestDistance) {
        bestDistance = distance;
        down = tile;
      }
    }

    grid[up.y][up.x] = "<";
    grid[down.y][down.x] = ">";
  }

  return {
    name: `${name} (${seed})`,
    data: grid,
    entities: {
      teleporters: [],
      items: [],
      traps: [],
      enemies: [],
      doors: [],
      switches: [],
    },
  };
}
