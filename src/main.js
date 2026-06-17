import { state } from './state.js';
import { processProjectileHit } from './combat.js';
import { generateMapData } from './map.js';
import { updateUI, addLog } from './hud.js';
import { draw, resizeCanvas } from './render.js';
import { updateCamera } from './camera.js';
import { updateEnemies } from './enemies.js';
import { updateProjectiles } from './projectiles.js';
import { keys, setupInput } from './input.js';
import { isValidPosition } from './collision.js';
import { generateRoom, handleInteract } from './rooms.js';
import { renderMapUI } from './ui.js';

const canvas = document.getElementById('gameCanvas');

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

setupInput();

function update() {
  if (state.gameState !== 'playing') return;
  const p = state.player;

  if (p.invulnerable > 0) p.invulnerable--;
  if (p.armorTimer > 0) { p.armorTimer--; if (p.armorTimer === 0) p.armor = 0; }
  if (p.dashCooldown > 0) p.dashCooldown--;

  if (p.dashTimer > 0) {
    const dnx = p.x + p.dashVx;
    const dny = p.y + p.dashVy;
    if (isValidPosition(dnx, dny, p.radius)) { p.x = dnx; p.y = dny; }
    else if (isValidPosition(p.x, dny, p.radius)) { p.y = dny; }
    else if (isValidPosition(dnx, p.y, p.radius)) { p.x = dnx; }
    if (p.dashTimer % 3 === 0) p.dashGhosts.push({ x: p.x, y: p.y, alpha: 0.6 });
    p.dashTimer--;
  } else {
    p.vx = 0; p.vy = 0;
    if (keys['w'] || keys['W'] || keys['ArrowUp']) p.vy = -p.speed;
    if (keys['s'] || keys['S'] || keys['ArrowDown']) p.vy = p.speed;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) p.vx = -p.speed;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) p.vx = p.speed;
    if (p.vx !== 0 && p.vy !== 0) { p.vx *= 0.7071; p.vy *= 0.7071; }
    const nx = p.x + p.vx;
    const ny = p.y + p.vy;
    if (isValidPosition(nx, ny, p.radius)) { p.x = nx; p.y = ny; }
    else if (isValidPosition(p.x, ny, p.radius)) { p.y = ny; }
    else if (isValidPosition(nx, p.y, p.radius)) { p.x = nx; }
  }

  updateCamera();

  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.lifetime++;

    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const enemy = state.enemies[j];
      if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < 28) {
        const damage = proj.roundType === 'black' ? 2 : 1;
        const result = processProjectileHit(enemy, state, damage);
        addLog(result.message, result.killed ? 'win' : 'info');
        if (proj.roundType === 'red') {
          state.visualEffects.push({ x: proj.x, y: proj.y, radius: 5, alpha: 0.8 });
        }
        if (result.killed && state.enemies.length === 0) addLog('\u2728 All enemies vanquished!', 'win');
        state.projectiles.splice(i, 1);
        hit = true;
        break;
      }
    }

    if (!hit && state.boss && Math.hypot(proj.x - state.boss.x, proj.y - state.boss.y) < 50) {
      const dmg = proj.roundType === 'black' ? 2 : 1;
      state.boss.hp -= dmg;
      state.boss.flashTimer = 6;
      addLog(`\u{1F479} Boss: ${state.boss.hp}/${state.boss.maxHp}`, 'info');
      if (proj.roundType === 'red') state.visualEffects.push({ x: state.boss.x, y: state.boss.y, radius: 5, alpha: 0.8 });
      if (state.boss.hp <= 0) {
        state.player.gold += 50 + Math.floor(Math.random() * 51);
        addLog('\u{1F451} BOSS DEFEATED!', 'win');
        state.boss = null;
        state.gameState = 'victory';
        document.getElementById('victory-screen').style.display = 'flex';
      }
      state.projectiles.splice(i, 1);
      hit = true;
      continue;
    }

    if (hit) continue;
    if (proj.lifetime > 120 || proj.x < 0 || proj.x > state.world.width || proj.y < 0 || proj.y > state.world.height) {
      state.projectiles.splice(i, 1);
    }
  }

  updateProjectiles();
  updateEnemies();

  if (p.hp <= 0 && state.gameState === 'playing') {
    state.gameState = 'gameover';
    document.getElementById('game-over-screen').style.display = 'flex';
    return;
  }

  if (!state.isRoomCleared && state.enemies.length === 0 && !state.chest && !state.boss) {
    state.isRoomCleared = true;
    addLog('ROOM CLEARED! Press [Tab] to leave.', 'win');
    renderMapUI();
  }

  let zone = 'Between Zones';
  for (const room of state.rooms) {
    if (p.x >= room.x && p.x <= room.x + room.w && p.y >= room.y && p.y <= room.y + room.h) {
      zone = room.name;
      break;
    }
  }
  document.getElementById('zoneLabel').textContent = `CURRENT ZONE: ${zone.toUpperCase()}`;

  updateUI();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

addLog('\uD83C\uDFB0 Grave Bets \u2014 Luciano\'s Roulette Gun loaded.', 'info');
addLog('\uD83D\uDDB1\uFE0F Click to fire. Red=1dmg, Black=2dmg, Green=Shield!', 'info');
addLog('\uD83D\uDEB6 Move with WASD / Arrow keys.', 'info');
addLog('\uD83D\uDCA8 Space to dodge (i-frames + ghost trail).', 'info');
state.mapData = generateMapData();
updateUI();
loop();
