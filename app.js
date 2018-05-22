#!/usr/bin/env node
const GAME_BOARD_WIDTH = 4;
const GAME_BOARD_HEIGHT = 4;
const FPS = 2;
const KEY_MAP = {
  119: '^ ',
  97: '< ',
  115: 'v ',
  100: '> '
};

class Utils {
  static async sleep (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  static randInt (maxExcl) {
    return Math.floor(Math.random() * Math.floor(maxExcl));
  }
}

class Entity {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }
}

class Snake extends Entity {
  constructor (x, y) {
    super(x, y);
    this.tails = [[x, y + 2], [x, y + 1]];
    this.justAte = false;
  }
  nextXY (dir) {
    switch (dir) {
      case '^ ':
        return [this.x, this.y - 1];
      case 'v ':
        return [this.x, this.y + 1];
      case '< ':
        return [this.x - 1, this.y];
      case '> ':
        return [this.x + 1, this.y];
      default:
        break;
    }
    return null;
  }
  canSwitchDir (dir) {
    let tailsCmp = this.tails.slice(1).map(xy => xy.join());
    return !tailsCmp.includes(this.nextXY(dir).join());
  }
  move (dir) {
    if (this.justAte) {
      this.justAte = false;
    } else {
      this.tails = this.tails.splice(1);
    }
    this.tails.push([this.x, this.y]);
    [this.x, this.y] = this.nextXY(dir);
  }
}

class Game {
  constructor () {
    this.isEnd = false;
    this.win = false;
    this.score = 0;
    this.snake = new Snake(GAME_BOARD_WIDTH / 2, GAME_BOARD_HEIGHT / 2);
    this.currentDirection = '^ ';
    this.currentFood = null;
    this.makeFood();
  }
  makeFood () {
    let candidates = [];
    let tailsCmp = this.snake.tails.slice(1).map(xy => xy.join());
    for (let y = 0; y < GAME_BOARD_HEIGHT; y++) {
      for (let x = 0; x < GAME_BOARD_WIDTH; x++) {
        if (tailsCmp.includes([x, y].join())) {
          continue;
        }
        if (this.currentFood && [x, y].join() === [this.currentFood.x, this.currentFood.y].join()) {
          continue;
        }
        candidates.push([x, y]);
      }
    }
    let pick = candidates[Utils.randInt(candidates.length)];
    if (!pick) {
      this.win = true;
      this.isEnd = false;
    } else {
      this.currentFood = new Entity(pick[0], pick[1]);
    }
  }
  isWall (x, y) {
    return x === -1 || y === -1 || x === GAME_BOARD_WIDTH || y === GAME_BOARD_HEIGHT;
  }
  updateGameState () {
    if (this.isEnd) {
      return;
    }
    let [nextX, nextY] = this.snake.nextXY(this.currentDirection);
    if (this.isWall(nextX, nextY)) {
      this.isEnd = true;
      return;
    }
    let tailsCmp = this.snake.tails.slice(1).map(xy => xy.join());
    if (tailsCmp.includes([nextX, nextY].join())) {
      this.isEnd = true;
      return;
    }
    this.snake.move(this.currentDirection);
    if (this.currentFood.x === this.snake.x && this.currentFood.y === this.snake.y) {
      this.snake.justAte = true;
      this.score += 100;
      this.makeFood();
    }
  }
  render () {
    let lines = [];
    for (let y = -1; y < GAME_BOARD_HEIGHT + 1; y++) {
      let line = [];
      for (let x = -1; x < GAME_BOARD_WIDTH + 1; x++) {
        if (x === -1 || y === -1 || x === GAME_BOARD_WIDTH || y === GAME_BOARD_HEIGHT) {
          line.push('██');
          continue;
        }
        line.push('  ');
        continue;
      }
      lines.push(line);
    }
    lines[this.snake.y + 1][this.snake.x + 1] = this.currentDirection;
    this.snake.tails.forEach((xy) => { lines[xy[1] + 1][xy[0] + 1] = 'x '; });
    lines[this.currentFood.y + 1][this.currentFood.x + 1] = 'O ';
    let buffer = lines.map(l => l.join('')).join('\n');
    buffer += `\nScore: ${this.score}\n`;
    if (this.isEnd) {
      buffer += 'Game Over!\n';
    }
    if (this.win) {
      buffer += 'You win!\n';
    }
    console.clear();
    process.stdout.write(buffer);
  }
  async start () {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', (key) => {
      if (key === '\u0003') {
        process.exit();
      }
      let code = key.charCodeAt(0);
      let newDir = KEY_MAP[code];
      if (newDir && this.snake.canSwitchDir(newDir)) {
        this.currentDirection = newDir;
      }
    });
    while (true) {
      await Utils.sleep(1000 / FPS);
      this.updateGameState();
      this.render();
    }
  }
}

(() => {
  const game = new Game();
  game.start();
})();
