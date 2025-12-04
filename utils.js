// utils.js

// ----- CONFIG -----
export const SPRITE_SCALE = 0.9;

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const CELL_WIDTH = 71;
export const CELL_HEIGHT = 64;
export const GRID_OFFSET_X = 130;
export const GRID_OFFSET_Y = 185; 

export const SUN_START = 50;
export const SUN_VALUE = 25;

export const PLANT_TYPES = {
  sunflower: { cost: 50, maxHp: 300 },
  peashooter: { cost: 100, maxHp: 300 },
  wallnut: { cost: 50, maxHp: 1200 }
};

export const ZOMBIE_TYPES = {
  classic: { maxHp: 200, speed: 20 },
  cone:    { maxHp: 400, speed: 20 },
  bucket:  { maxHp: 800, speed: 20 }
};

// ----- TIMING -----
export const PASSIVE_SUN_INTERVAL = 9000;
export const SUNFLOWER_SUN_INTERVAL = 7000;
export const PEASHOOTER_SHOT_INTERVAL = 1500;
export const ZOMBIE_SPAWN_INTERVAL_START = 9000;
export const ZOMBIE_SPAWN_INTERVAL_MIN = 2500;
export const ZOMBIE_SPAWN_INTERVAL_DECAY = 0.99;

// ----- HELPERS -----
export function worldFromGrid(col, row) {
  return {
    x: GRID_OFFSET_X + col * CELL_WIDTH + CELL_WIDTH / 2,
    y: GRID_OFFSET_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2
  };
}

export function pointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.w &&
    py >= rect.y &&
    py <= rect.y + rect.h
  );
}

export function loadImages(map) {
  const entries = Object.entries(map);
  const promises = entries.map(([key, src]) => {
    return new Promise(res => {
      const img = new Image();
      img.src = src;
      img.onload = () => res([key, img]);
    });
  });
  return Promise.all(promises).then(results => {
    const out = {};
    results.forEach(([key, img]) => (out[key] = img));
    return out;
  });
}

// ----- ASSET PATHS -----
export const imageSources = {
  lawn: 'assets/Lawn.png',
  sun: 'assets/Sun.png',
  pea: 'assets/Pea_shoot.png',
  pea_splash: 'assets/Pea_splash.png',

  sunflower_idle1: 'assets/Sunflower_idle-1.png',
  sunflower_idle2: 'assets/Sunflower_idle-2.png',
  sunflower_sun:   'assets/Sunflower_sun.png',

  peashooter_idle1: 'assets/Peashooter_idle-1.png',
  peashooter_idle2: 'assets/Peashooter_idle-2.png',
  peashooter_shoot: 'assets/Peashooter_shoot.png',

  wallnut_idle: 'assets/Wallnut_idle.png',
  wallnut_cracked: 'assets/Wallnut_cracked.png',
  wallnut_critical: 'assets/Wallnut_critical.png',

  zombie_classic_walk1: 'assets/Zombie_Classic_walk-1.png',
  zombie_classic_walk2: 'assets/Zombie_Classic_walk-2.png',
  zombie_classic_eat: 'assets/Zombie_Classic_eat.png',
  zombie_classic_dead: 'assets/Zombie_Classic_dead.png',

  zombie_cone_walk1: 'assets/Zombie_Cone_walk-1.png',
  zombie_cone_walk2: 'assets/Zombie_Cone_walk-2.png',
  zombie_cone_eat: 'assets/Zombie_Cone_eat.png',
  zombie_cone_dead: 'assets/Zombie_Cone_dead.png',

  zombie_bucket_walk1: 'assets/Zombie_Bucket_walk-1.png',
  zombie_bucket_walk2: 'assets/Zombie_Bucket_walk-2.png',
  zombie_bucket_eat: 'assets/Zombie_Bucket_eat.png',
  zombie_bucket_dead: 'assets/Zombie_Bucket_dead.png'
};
