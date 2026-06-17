import { state } from './state.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const { cols, rows, tileSize } = state.grid;

canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

const EMOJI_FONT = '42px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", "EmojiOne Color", sans-serif';

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* draw grid tiles */
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * tileSize;
      const py = y * tileSize;

      /* checkerboard floor */
      ctx.fillStyle = (x + y) % 2 === 0 ? '#1a0e0a' : '#1f120c';
      ctx.fillRect(px, py, tileSize, tileSize);

      /* subtle grid line */
      ctx.strokeStyle = '#25150e';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, tileSize, tileSize);
    }
  }

  /* draw player */
  const { x, y, emoji } = state.player;
  ctx.font = EMOJI_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
}

function movePlayer(dx, dy) {
  const p = state.player;
  const nx = p.x + dx;
  const ny = p.y + dy;

  if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;

  p.x = nx;
  p.y = ny;
  draw();
}

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': movePlayer(0, -1); e.preventDefault(); break;
    case 'ArrowDown':  case 's': case 'S': movePlayer(0,  1); e.preventDefault(); break;
    case 'ArrowLeft':  case 'a': case 'A': movePlayer(-1, 0); e.preventDefault(); break;
    case 'ArrowRight': case 'd': case 'D': movePlayer(1,  0); e.preventDefault(); break;
  }
});

draw();
