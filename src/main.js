import { state } from './state.js';
import { processProjectileHit, defeatBoss } from './combat.js';
import { generateMapData } from './map.js';
import { updateUI, addLog } from './hud.js';
import { draw, resizeCanvas } from './render.js';
import { updateCamera } from './camera.js';
import { updateEnemies } from './enemies.js';
import { updateProjectiles } from './projectiles.js';
import { keys, setupInput } from './input.js';
import { isBlockedByObstacle, tryMove } from './collision.js';
import { generateRoom, applyRelicEffect, takeChestRelic, respinChestRelic } from './rooms.js';
import { renderMapUI, populateSaveSlots } from './ui.js';
import { CHARACTERS } from './characters.js';
import { buildCharCards, refreshLounge, hideAllScreens } from './ui-main.js';
import { RELICS } from './relics.js';
import { tickStatusEffects, getSuitMultiplier } from './suits.js';
import { loadData, saveData, loadRun, clearAllRuns } from './storage.js';

const canvas = document.getElementById('gameCanvas');

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

setupInput();

function updateTimers() {
  const p = state.player;
  const isMoving = p.vx !== 0 || p.vy !== 0;
  const statusResult = tickStatusEffects(p, isMoving, (entity) => {
    if (entity.characterId === 'roxanne') {
      entity.armor = Math.min(5, (entity.armor || 0) + 1);
      entity.armorTimer = 120;
    }
  });

  const qs = p.quirkState;
  const ccImmune = qs.ccImmune > 0;
  const speedMult = ccImmune ? 1.0 : statusResult.speedMult;

  if (qs.ccImmune > 0) qs.ccImmune--;

  if (p.invulnerable > 0) p.invulnerable--;
  if (p.armorTimer > 0) { p.armorTimer--; if (p.armorTimer === 0) p.armor = 0; }
  if (p.dashCooldown > 0) p.dashCooldown--;
  if (p.activeCooldown > 0) p.activeCooldown--;

  return speedMult;
}

function updateDash() {
  const p = state.player;
  if (p.dashTimer > 0) {
    if (tryMove(p, p.dashVx, p.dashVy)) {
      if (p.dashTimer % 3 === 0) p.dashGhosts.push({ x: p.x, y: p.y, alpha: 0.6 });
      p.dashTimer--;
    } else {
      p.dashTimer = 0;
      p.dashVx = 0;
      p.dashVy = 0;
    }
    if (p.dashTimer === 0 && state.deferredMap) {
      state.deferredMap = false;
      renderMapUI();
    }
  }
}

function updateMovement(speedMult) {
  const p = state.player;
  if (p.dashTimer > 0) return;
  const qs = p.quirkState;
  const bc = CHARACTERS[p.characterId];
  if (bc) {
    let spd = bc.speed;
    if (qs.silasSpeedTimer > 0) spd = bc.speed * 2;
    else if (p.characterId === 'luciano' && qs.lucianoSpeed > 0) spd = bc.speed * (1 + qs.lucianoSpeed * 0.1);
    p.speed = spd * speedMult;
  }
  p.vx = 0; p.vy = 0;
  if (keys['w'] || keys['W'] || keys['ArrowUp']) p.vy = -p.speed;
  if (keys['s'] || keys['S'] || keys['ArrowDown']) p.vy = p.speed;
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) p.vx = -p.speed;
  if (keys['d'] || keys['D'] || keys['ArrowRight']) p.vx = p.speed;
  if (p.vx !== 0 && p.vy !== 0) { p.vx *= 0.7071; p.vy *= 0.7071; }
  tryMove(p, p.vx, p.vy);
}

function updatePlayerProjectiles() {
  const p = state.player;
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.lifetime++;

    let removed = false;

    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const enemy = state.enemies[j];
      if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < 28) {
        const baseDmg = proj.roundType === 'black' ? 2 : 1;
        const result = processProjectileHit(enemy, state, baseDmg, proj);
        addLog(result.message, result.killed ? 'win' : 'info');
        if (proj.roundType === 'red') {
          state.visualEffects.push({ x: proj.x, y: proj.y, radius: 5, alpha: 0.8 });
        }
        if (result.killed && state.enemies.length === 0) addLog('\u2728 All enemies vanquished!', 'win');

        if (proj.characterId === 'luciano') {
          const qs = state.player.quirkState;
          state.player.shotCount = (state.player.shotCount || 0) + 1;
          if (proj.roundType === 'black') qs.lucianoCrit = Math.min(3, (qs.lucianoCrit || 0) + 1);
          else if (proj.roundType === 'red') qs.lucianoSpeed = Math.min(3, (qs.lucianoSpeed || 0) + 1);
          if (state.player.shotCount >= 6) { qs.lucianoCrit = 0; qs.lucianoSpeed = 0; state.player.shotCount = 0; }
        }

        if (proj.characterId === 'valerie') {
          proj.piercesLeft = (proj.piercesLeft ?? 3) - 1;
          if (proj.piercesLeft <= 0) { state.projectiles.splice(i, 1); removed = true; break; }
        } else {
          state.projectiles.splice(i, 1); removed = true; break;
        }
      }
    }

    if (removed) continue;

    if (state.boss && Math.hypot(proj.x - state.boss.x, proj.y - state.boss.y) < 50) {
      let dmg = proj.roundType === 'black' ? 2 : 1;
      const mult = getSuitMultiplier(proj.suit || p.suit, state.boss.suit);
      dmg = Math.ceil(dmg * mult);
      state.boss.hp -= dmg;
      state.boss.flashTimer = 6;
      addLog(`\u{1F479} Boss: ${state.boss.hp}/${state.boss.maxHp}`, 'info');
      if (proj.roundType === 'red') state.visualEffects.push({ x: state.boss.x, y: state.boss.y, radius: 5, alpha: 0.8 });
      if (state.boss.hp <= 0) defeatBoss(state);
      state.projectiles.splice(i, 1);
      continue;
    }

    if (isBlockedByObstacle(proj.x, proj.y, proj.radius || 4)) {
      state.visualEffects.push({ x: proj.x, y: proj.y, radius: 4, alpha: 0.6, color: '#fbbf24', shadowColor: '#f59e0b' });
      state.projectiles.splice(i, 1);
      continue;
    }

    if (proj.lifetime > 120 || proj.x < 0 || proj.x > state.world.width || proj.y < 0 || proj.y > state.world.height) {
      state.projectiles.splice(i, 1);
    }
  }
}

function updateAbilities() {
  const qs = state.player.quirkState;
  if (qs.valGravityTimer > 0) {
    qs.valGravityTimer--;
    if (qs.valGravityTimer % 15 === 0) {
      for (const enemy of state.enemies) {
        if (Math.hypot(enemy.x - qs.valGravityX, enemy.y - qs.valGravityY) < 150) {
          enemy.hp -= 1;
          state.visualEffects.push({ x: enemy.x, y: enemy.y, radius: 4, alpha: 0.6 });
        }
      }
    }
    for (const enemy of state.enemies) {
      const dx = qs.valGravityX - enemy.x;
      const dy = qs.valGravityY - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < 150) {
        enemy.x += (dx / dist) * 2;
        enemy.y += (dy / dist) * 2;
      }
    }
  }

  if (qs.busterBoostTimer > 0) qs.busterBoostTimer--;
  if (qs.silasSpeedTimer > 0) qs.silasSpeedTimer--;
  if (qs.roxanneDoubleDown > 0) qs.roxanneDoubleDown--;
  if (qs.bustTimer > 0) qs.bustTimer--;
}

function checkGameOver() {
  const p = state.player;
  if (p.hp <= 0 && state.gameState === 'playing') {
    state.gameState = 'gameover';
    const cashChips = Math.floor(p.gold / 10);
    state.runSoulChips += cashChips;
    state.meta.soulChips += state.runSoulChips;
    const display = document.getElementById('cash-out-display');
    if (cashChips > 0 || state.runSoulChips > 0) {
      display.textContent = `Cashed out ${p.gold} Gold for ${cashChips} Chips! Total this run: ${state.runSoulChips} \u{1FADB}`;
    } else {
      display.textContent = `\u{1FADB} ${state.runSoulChips} Soul Chips this run`;
    }
    saveData(state);
    clearAllRuns();
    document.getElementById('game-over-screen').style.display = 'flex';
    return true;
  }
  return false;
}

function checkRoomClear() {
  if (!state.isRoomCleared && state.enemies.length === 0 && !state.chest && !state.boss) {
    state.isRoomCleared = true;
    let chips = 1;
    if (state.currentNodeType === 'Elite') chips = 5;
    if (state.boss) chips = 20;
    if (state.currentNodeType !== 'shop') {
      state.runSoulChips += chips;
      addLog(`\u{1FADB} +${chips} Soul Chips! (${state.runSoulChips} this run)`, 'win');
    }
    addLog('ROOM CLEARED! Press [Tab] to leave.', 'win');
    if (state.player.dashTimer > 0) {
      state.deferredMap = true;
    } else {
      renderMapUI();
    }
  }
}

function updateZoneLabel() {
  const p = state.player;
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

function update() {
  if (state.gameState !== 'playing') return;
  if (state.isPaused) return;
  const speedMult = updateTimers();
  updateDash();
  updateMovement(speedMult);
  updateCamera();
  updatePlayerProjectiles();
  updateProjectiles();
  updateEnemies(speedMult);
  updateAbilities();
  if (checkGameOver()) return;
  checkRoomClear();
  updateZoneLabel();
}

let loopId = null;

function loop() {
  update();
  draw();
  loopId = requestAnimationFrame(loop);
}

function startGame(charId) {
  if (loopId) cancelAnimationFrame(loopId);

  const char = CHARACTERS[charId];
  const p = state.player;

  p.characterId = charId;
  p.suit = char.suit;
  p.statusEffects = [];
  p.emoji = char.emoji;
  p.radius = char.radius;
  p.speed = char.speed;
  p.hp = char.hp + state.meta.upgrades.extraHp;
  p.maxHp = char.maxHp + state.meta.upgrades.extraHp;
  p.stats = { ...char.stats };
  p.gold = state.meta.upgrades.startingGold || 0;
  p.relics = [];
  p.quirkState = {};
  p.activeCooldown = 0;
  p.shotCount = 0;
  p.invulnerable = 0;
  p.armor = 0;
  p.armorTimer = 0;
  p.dashCooldown = 0;
  p.dashTimer = 0;
  p.dashGhosts = [];
  p.x = 1500;
  p.y = 1500;

  if (state.meta.upgrades.startWithRelic) {
    const r = RELICS[Math.floor(Math.random() * RELICS.length)];
    p.relics.push(r.id);
    applyRelicEffect(r.id);
  }

  state.runSoulChips = 0;
  state.runFreeRespins = state.meta.upgrades.canRespinChest;
  state.deferredMap = false;
  state.gameState = 'playing';
  state.boss = null;
  state.enemies.length = 0;
  state.enemyProjectiles.length = 0;
  state.projectiles.length = 0;
  state.visualEffects.length = 0;
  state.log.length = 0;
  document.getElementById('game-over-screen').style.display = 'none';
  document.getElementById('victory-screen').style.display = 'none';
  document.getElementById('pause-screen').style.display = 'none';
  document.getElementById('chest-panel').style.display = 'none';
  document.getElementById('actionLog').innerHTML = '';

  state.mapData = generateMapData();
  generateRoom('combat', 'Normal');

  document.getElementById('character-select-screen').style.display = 'none';
  document.getElementById('executive-lounge-screen').style.display = 'none';

  addLog(`\uD83C\uDFB0 ${char.name} enters Grave Bets!`, 'win');
  addLog(char.desc, 'info');
  addLog('\uD83D\uDEB6 WASD / Arrow keys to move.', 'info');
  addLog('\uD83D\uDCA8 Space to dash (i-frames).', 'info');
  addLog(`[E] ${char.activeName}: ${char.activeDesc}`, 'info');

  updateUI();
  loop();
}

const continueSlot = (slot) => {
  if (loadRun(state, slot)) {
    document.getElementById('executive-lounge-screen').style.display = 'none';
    updateUI();
    loop();
  }
};

document.getElementById('lounge-upgrades').addEventListener('click', (e) => {
  const btn = e.target.closest('.lounge-btn');
  if (!btn || btn.disabled) return;
  const upgrade = btn.dataset.upgrade;
  switch (upgrade) {
    case 'unlock_val': {
      if (state.meta.soulChips < 50) return;
      state.meta.soulChips -= 50;
      state.meta.unlockedCharacters.push('val');
      addLog('Lady Val unlocked!', 'win');
      break;
    }
    case 'starting_gold': {
      if (state.meta.soulChips < 15) return;
      state.meta.soulChips -= 15;
      state.meta.upgrades.startingGold += 20;
      break;
    }
    case 'extra_hp': {
      if (state.meta.soulChips < 25) return;
      state.meta.soulChips -= 25;
      state.meta.upgrades.extraHp += 10;
      break;
    }
    case 'respin_chest': {
      const level = state.meta.upgrades.canRespinChest;
      const costs = [40, 60, 80];
      if (level >= 3 || state.meta.soulChips < costs[level]) return;
      state.meta.soulChips -= costs[level];
      state.meta.upgrades.canRespinChest = level + 1;
      break;
    }
    case 'start_relic': {
      if (state.meta.soulChips < 60) return;
      state.meta.soulChips -= 60;
      state.meta.upgrades.startWithRelic = true;
      break;
    }
  }
  saveData(state);
  buildCharCards({ onSelectChar: (id) => startGame(id) });
  refreshLounge({ onContinueSlot: continueSlot });
});

document.getElementById('hit-floor-btn').addEventListener('click', () => {
  saveData(state);
  buildCharCards({ onSelectChar: (id) => startGame(id) });
  document.getElementById('executive-lounge-screen').style.display = 'none';
  document.getElementById('character-select-screen').style.display = 'flex';
});

document.getElementById('pause-resume-btn').addEventListener('click', () => {
  state.isPaused = false;
  document.getElementById('pause-screen').style.display = 'none';
  document.getElementById('pause-save-slots').style.display = 'none';
});

document.getElementById('pause-save-btn').addEventListener('click', () => {
  const slots = document.getElementById('pause-save-slots');
  if (slots.style.display === 'none' || !slots.style.display) {
    populateSaveSlots('pause-save-slots');
    slots.style.display = 'flex';
  } else {
    slots.style.display = 'none';
  }
});

document.getElementById('pause-quit-btn').addEventListener('click', () => {
  if (loopId) { cancelAnimationFrame(loopId); loopId = null; }
  state.isPaused = false;
  const cashChips = Math.floor(state.player.gold / 10);
  state.meta.soulChips += cashChips;
  state.runSoulChips = 0;
  saveData(state);
  clearAllRuns();
  hideAllScreens();
  buildCharCards({ onSelectChar: (id) => startGame(id) });
  refreshLounge({ onContinueSlot: continueSlot });
  document.getElementById('executive-lounge-screen').style.display = 'flex';
});

document.getElementById('game-over-btn').addEventListener('click', () => {
  if (loopId) { cancelAnimationFrame(loopId); loopId = null; }
  hideAllScreens();
  buildCharCards({ onSelectChar: (id) => startGame(id) });
  refreshLounge({ onContinueSlot: continueSlot });
  document.getElementById('executive-lounge-screen').style.display = 'flex';
});

document.getElementById('chest-take-btn').addEventListener('click', takeChestRelic);
document.getElementById('chest-respin-btn').addEventListener('click', respinChestRelic);

document.getElementById('victory-btn').addEventListener('click', () => {
  if (loopId) { cancelAnimationFrame(loopId); loopId = null; }
  hideAllScreens();
  buildCharCards({ onSelectChar: (id) => startGame(id) });
  refreshLounge({ onContinueSlot: continueSlot });
  document.getElementById('executive-lounge-screen').style.display = 'flex';
});

loadData(state);
buildCharCards({ onSelectChar: (id) => startGame(id) });
refreshLounge({ onContinueSlot: continueSlot });
document.getElementById('executive-lounge-screen').style.display = 'flex';
