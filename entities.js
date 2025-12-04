// entities.js
import {
  PLANT_TYPES,
  ZOMBIE_TYPES,
  CANVAS_WIDTH,
  SUNFLOWER_SUN_INTERVAL,
  PEASHOOTER_SHOT_INTERVAL,
  worldFromGrid,
  SPRITE_SCALE
} from './utils.js';

// ----- PLANT -----
export class Plant {
  constructor(type, row, col) {
    this.type = type;
    this.row = row;
    this.col = col;
    this.hp = PLANT_TYPES[type].maxHp;
    this.sunTimer = 0;
    this.shotTimer = 0;
    this.sunFlash = 0;
    this.shootFlash = 0;
  }

  get alive() {
    return this.hp > 0;
  }

  getPosition() {
    return worldFromGrid(this.col, this.row);
  }

  takeDamage(dmg) {
    this.hp -= dmg;
  }

  update(dt, game) {
    if (!this.alive) return;

    if (this.sunFlash > 0) this.sunFlash -= dt;
    if (this.shootFlash > 0) this.shootFlash -= dt;

    if (this.type === 'sunflower') {
      this.sunTimer += dt;
      if (this.sunTimer >= SUNFLOWER_SUN_INTERVAL) {
        this.sunTimer = 0;
        const pos = this.getPosition();
        game.spawnSun(pos.x, pos.y - 30);
        this.sunFlash = 400;
      }
    } else if (this.type === 'peashooter') {
      this.shotTimer += dt;
      const zombieInRow = game.zombies.some(z => z.row === this.row && z.alive);
      if (zombieInRow && this.shotTimer >= PEASHOOTER_SHOT_INTERVAL) {
        this.shotTimer = 0;
        const pos = this.getPosition();
        game.spawnPea(pos.x + 20, pos.y - 10, this.row);
        this.shootFlash = 200;
      }
    }
  }

  draw(ctx, images) {
    if (!this.alive) return;
    const pos = this.getPosition();
    let img;

    if (this.type === 'sunflower') {
      if (this.sunFlash > 0 && images.sunflower_sun) {
        img = images.sunflower_sun;
      } else {
        const frame = Math.floor(Date.now() / 300) % 2;
        img = frame === 0 ? images.sunflower_idle1 : images.sunflower_idle2;
      }
    } else if (this.type === 'peashooter') {
      if (this.shootFlash > 0 && images.peashooter_shoot) {
        img = images.peashooter_shoot;
      } else {
        const frame = Math.floor(Date.now() / 300) % 2;
        img = frame === 0 ? images.peashooter_idle1 : images.peashooter_idle2;
      }
    } else if (this.type === 'wallnut') {
      const hpRatio = this.hp / PLANT_TYPES.wallnut.maxHp;
      if (hpRatio > 0.66) img = images.wallnut_idle;
      else if (hpRatio > 0.33) img = images.wallnut_cracked;
      else img = images.wallnut_critical;
    }

    if (img) {
      const w = img.width * SPRITE_SCALE;
      const h = img.height * SPRITE_SCALE;
      ctx.drawImage(img, pos.x - w / 2, pos.y - h / 2, w, h);
    }
  }
}

// ----- ZOMBIE -----
export class Zombie {
  constructor(type, row) {
    this.type = type;
    this.row = row;
    this.hp = ZOMBIE_TYPES[type].maxHp;
    this.speed = ZOMBIE_TYPES[type].speed;
    this.x = CANVAS_WIDTH + 40;
    this.y = worldFromGrid(0, row).y - 10;
    this.state = 'walk';
    this.eatingPlant = null;
  }

  get alive() {
    return this.hp > 0;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.state = 'dead';
  }

  update(dt, game) {
    if (this.state === 'dead') return;

    if (this.state !== 'eat') {
      this.eatingPlant = game.plants.find(
        p =>
          p.row === this.row &&
          p.alive &&
          Math.abs(this.x - worldFromGrid(p.col, p.row).x) < game.cellWidth / 2
      );
      if (this.eatingPlant) this.state = 'eat';
    }

    if (this.state === 'eat') {
      if (!this.eatingPlant || !this.eatingPlant.alive) {
        this.state = 'walk';
        this.eatingPlant = null;
      } else {
        this.eatingPlant.takeDamage(20 * (dt / 1000));
      }
    }

    if (this.state === 'walk') {
      this.x -= this.speed * (dt / 1000);
      if (this.x < 0) game.gameOver();
    }
  }

  draw(ctx, images) {
    let img;
    if (this.state === 'dead') {
      if (this.type === 'classic') img = images.zombie_classic_dead;
      else if (this.type === 'cone') img = images.zombie_cone_dead;
      else img = images.zombie_bucket_dead;
    } else if (this.state === 'eat') {
      if (this.type === 'classic') img = images.zombie_classic_eat;
      else if (this.type === 'cone') img = images.zombie_cone_eat;
      else img = images.zombie_bucket_eat;
    } else {
      const frame = Math.floor(Date.now() / 300) % 2;
      if (this.type === 'classic') {
        img = frame === 0 ? images.zombie_classic_walk1 : images.zombie_classic_walk2;
      } else if (this.type === 'cone') {
        img = frame === 0 ? images.zombie_cone_walk1 : images.zombie_cone_walk2;
      } else {
        img = frame === 0 ? images.zombie_bucket_walk1 : images.zombie_bucket_walk2;
      }
    }

    if (img) {
      const w = img.width * SPRITE_SCALE;
      const h = img.height * SPRITE_SCALE;
      ctx.drawImage(img, this.x - w / 2, this.y - h / 2, w, h);
    }
  }
}

// ----- PEA -----
export class Pea {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = 300;
    this.alive = true;
  }

  update(dt, game) {
    this.x += this.speed * (dt / 1000);
    if (this.x > CANVAS_WIDTH + 50) this.alive = false;

    for (const z of game.zombies) {
      if (!z.alive || z.row !== this.row || z.state === 'dead') continue;
      if (Math.abs(this.x - z.x) < 30) {
        this.alive = false;
        z.takeDamage(50);
        game.spawnPeaSplash(this.x, this.y - 10);
        break;
      }
    }
  }

  draw(ctx, images) {
    const img = images.pea;
    const w = img.width * SPRITE_SCALE;
    const h = img.height * SPRITE_SCALE;
    ctx.drawImage(img, this.x - w / 2, this.y - h / 2, w, h);
  }
}

// ----- SUN -----
export class Sun {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.alive = true;
    this.life = 8000;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx, images) {
    const img = images.sun;
    const w = img.width * SPRITE_SCALE;
    const h = img.height * SPRITE_SCALE;
    ctx.drawImage(img, this.x - w / 2, this.y - h / 2, w, h);
  }

  getRect() {
    return { x: this.x - 25, y: this.y - 25, w: 50, h: 50 };
  }
}

// ----- PEA SPLASH -----
export class PeaSplash {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = 200;
  }

  get alive() {
    return this.life > 0;
  }

  update(dt) {
    this.life -= dt;
  }

  draw(ctx, images) {
    const img = images.pea_splash;
    const alpha = Math.max(this.life / 200, 0);
    const w = img.width * SPRITE_SCALE;
    const h = img.height * SPRITE_SCALE;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, this.x - w / 2, this.y - h / 2, w, h);
    ctx.restore();
  }
}
