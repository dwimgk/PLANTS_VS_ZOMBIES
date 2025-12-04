// game.js
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_ROWS,
  GRID_COLS,
  CELL_WIDTH,
  CELL_HEIGHT,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  SUN_START,
  SUN_VALUE,
  PLANT_TYPES,
  ZOMBIE_SPAWN_INTERVAL_START,
  ZOMBIE_SPAWN_INTERVAL_MIN,
  ZOMBIE_SPAWN_INTERVAL_DECAY,
  pointInRect,
  loadImages,
  imageSources,
  PASSIVE_SUN_INTERVAL,
  worldFromGrid
} from './utils.js';

import { Plant, Zombie, Pea, Sun, PeaSplash } from './entities.js';

// ----- DOM / GLOBAL -----
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const hudSunCount = document.getElementById('sun-count');
const seedElements = document.querySelectorAll('.seed');
const gameOverDiv = document.getElementById('game-over');

let images = {};
let game;

// ----- GAME -----
class Game {
  constructor() {
    this.plants = [];
    this.zombies = [];
    this.peas = [];
    this.suns = [];
    this.splashes = [];
    this.sunPoints = SUN_START;
    this.selectedSeed = null;
    this.running = true;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.spawnInterval = ZOMBIE_SPAWN_INTERVAL_START;
    this.cellWidth = CELL_WIDTH;
    this.passiveSunTimer = 0;

    hudSunCount.textContent = this.sunPoints;
  }

  spawnSun(x, y) {
    this.suns.push(new Sun(x, y));
  }

  spawnPea(x, y, row) {
    this.peas.push(new Pea(x, y, row));
  }

  spawnPeaSplash(x, y) {
    this.splashes.push(new PeaSplash(x, y));
  }

  spawnZombie() {
    const row = Math.floor(Math.random() * GRID_ROWS);
    const r = Math.random();
    let type = 'classic';
    if (r > 0.7 && r <= 0.9) type = 'cone';
    else if (r > 0.9) type = 'bucket';
    this.zombies.push(new Zombie(type, row));
  }

  gameOver() {
    if (!this.running) return;
    this.running = false;
    gameOverDiv.classList.remove('hidden');
  }

  plantAt(row, col) {
    if (this.plants.some(p => p.row === row && p.col === col && p.alive)) return;

    const type = this.selectedSeed;
    if (!type) return;
    const cost = PLANT_TYPES[type].cost;
    if (this.sunPoints < cost) return;

    this.sunPoints -= cost;
    hudSunCount.textContent = this.sunPoints;
    this.plants.push(new Plant(type, row, col));
  }

  collectSunAt(x, y) {
    for (const sun of this.suns) {
      if (!sun.alive) continue;
      if (pointInRect(x, y, sun.getRect())) {
        sun.alive = false;
        this.sunPoints += SUN_VALUE;
        hudSunCount.textContent = this.sunPoints;
        break;
      }
    }
  }

  update(dt) {
    if (!this.running) return;

    this.plants.forEach(p => p.update(dt, this));
    this.zombies.forEach(z => z.update(dt, this));
    this.peas.forEach(p => p.update(dt, this));
    this.peas = this.peas.filter(p => p.alive);

    this.suns.forEach(s => s.update(dt));
    this.suns = this.suns.filter(s => s.alive);

    this.splashes.forEach(s => s.update(dt));
    this.splashes = this.splashes.filter(s => s.alive);

    // ----- zombie spawn -----
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnZombie();
      this.spawnInterval = Math.max(
        ZOMBIE_SPAWN_INTERVAL_MIN,
        this.spawnInterval * ZOMBIE_SPAWN_INTERVAL_DECAY
      );
    }

    // ----- passive sun -----
    this.passiveSunTimer += dt;
    if (this.passiveSunTimer >= PASSIVE_SUN_INTERVAL) {
      this.passiveSunTimer = 0;
      const col = Math.floor(Math.random() * GRID_COLS);
      const row = Math.floor(Math.random() * GRID_ROWS);
      const pos = worldFromGrid(col, row);
      this.spawnSun(pos.x, GRID_OFFSET_Y + 20);
    }
  }

  draw() {
    ctx.drawImage(images.lawn, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_OFFSET_X + c * CELL_WIDTH;
        const y = GRID_OFFSET_Y + r * CELL_HEIGHT;
        ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
      }
    }
    ctx.restore();

    this.plants.forEach(p => p.draw(ctx, images));
    this.zombies.forEach(z => z.draw(ctx, images));
    this.peas.forEach(p => p.draw(ctx, images));
    this.suns.forEach(s => s.draw(ctx, images));
    this.splashes.forEach(s => s.draw(ctx, images));
  }

  loop(now) {
    const dt = now - this.lastTime;
    this.lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }
}

// ----- INPUT -----
function setupInput(gameInstance) {
  seedElements.forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const type = el.dataset.type;
      gameInstance.selectedSeed = type;
      seedElements.forEach(s => s.classList.remove('selected'));
      el.classList.add('selected');
    });
  });

  canvas.addEventListener('click', e => {
    if (!gameInstance.running) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    const beforeSun = gameInstance.sunPoints;
    gameInstance.collectSunAt(x, y);
    if (gameInstance.sunPoints !== beforeSun) return;

    const col = Math.floor((x - GRID_OFFSET_X) / CELL_WIDTH);
    const row = Math.floor((y - GRID_OFFSET_Y) / CELL_HEIGHT);
    if (
      row >= 0 &&
      row < GRID_ROWS &&
      col >= 0 &&
      col < GRID_COLS
    ) {
      gameInstance.plantAt(row, col);
    }
  });
}

// ----- BOOTSTRAP -----
loadImages(imageSources).then(imgs => {
  images = imgs;
  game = new Game();
  setupInput(game);
  requestAnimationFrame(t => game.loop(t));
});
