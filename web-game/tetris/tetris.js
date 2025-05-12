const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

// 🔊 Load sound effects
const scoreSound = new Audio('score.wav');
const gameOverSound = new Audio('gameover.wav');

let gameStarted = false;
let gameOver = false;
let score = 0;

function createPiece(type) {
  switch (type) {
    case 'T': return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
    case 'O': return [[2, 2], [2, 2]];
    case 'L': return [[0, 0, 3], [3, 3, 3], [0, 0, 0]];
    case 'J': return [[4, 0, 0], [4, 4, 4], [0, 0, 0]];
    case 'I': return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
    case 'S': return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    case 'Z': return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
  }
}

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);

  // 🧮 Draw score on the right side
  context.fillStyle = '#fff';
  context.font = '1px Arial';
  context.fillText('Score:', 13, 2);
  context.fillText(score.toString(), 13, 4);
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (
        m[y][x] !== 0 &&
        (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
  player.pos.y = 0;
  player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
  if (collide(arena, player)) {
    gameOver = true;
    gameStarted = false;
    gameOverSound.play(); // 🔊 Game over sound
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach(row => row.reverse());
  else matrix.reverse();
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function arenaSweep() {
  let rowCount = 0;

  outer: for (let y = arena.length - 1; y >= 0; y--) {
    for (let x = 0; x < arena[y].length; x++) {
      if (arena[y][x] === 0) continue outer;
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    y++;
    rowCount++;
  }

  // 🧮 Score logic
  if (rowCount > 0) {
    if (rowCount === 1) score += 10;
    else if (rowCount === 2) score += 15;
    else if (rowCount === 3) score += 30;
    else if (rowCount >= 4) score += 50;

    scoreSound.play(); // 🔊 Play score sound
  }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (!gameStarted) {
    context.font = '1px Arial';

    if (gameOver) {
      context.fillStyle = '#f00';
      context.fillText('Game Over', 3, 8);

      context.fillStyle = '#fff';
      context.fillText('Press SPACE to restart', 1.5, 11);
    } else {
      context.fillStyle = '#fff';
      context.fillText('Press SPACE to start', 1.5, 5);
      context.fillText('Controls:', 1.5, 8);
      context.fillText('← / → : Move', 1.5, 10);
      context.fillText('↓     : Drop', 1.5, 12);
      context.fillText('Q / W : Rotate', 1.5, 14);
      context.fillText('Score: ' + score, 13, 8);
    }

    requestAnimationFrame(update);
    return;
  }

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

document.addEventListener('keydown', e => {
  if (!gameStarted) {
    if (e.code === 'Space') {
      if (gameOver) {
        arena.forEach(row => row.fill(0));
        score = 0;
        gameOver = false;
      }
      playerReset();
      gameStarted = true;
      update();
    }
    return;
  }

  if (e.key === 'ArrowLeft') playerMove(-1);
  else if (e.key === 'ArrowRight') playerMove(1);
  else if (e.key === 'ArrowDown') playerDrop();
  else if (e.key === 'q') playerRotate(-1);
  else if (e.key === 'w') playerRotate(1);
});

const colors = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

const arena = createMatrix(12, 20);
const player = {
  pos: {x: 0, y: 0},
  matrix: null,
};

update(); // Start at main menu
