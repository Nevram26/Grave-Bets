import { state } from './state.js';
import { onNodeClick, renderMapUI } from './ui.js';
import { handleInteract } from './rooms.js';
import { CHARACTERS } from './characters.js';
import { addLog } from './hud.js';
import { applyStatus, removeStatus, getSuitMultiplier, hasStatus } from './suits.js';
import { meleeKill } from './combat.js';

const canvas = document.getElementById('gameCanvas');

export const keys = {};

function useActiveAbility() {
  const p = state.player;
  const charId = p.characterId;
  const qs = p.quirkState;

  if (charId === 'luciano') {
    qs.lucianoNextGreen = true;
    qs.lucianoRedCount = 6;
    p.statusEffects = [];
    qs.ccImmune = 180;
    state.visualEffects.push({ x: p.x, y: p.y, radius: 15, alpha: 0.8, color: '#a855f7', shadowColor: '#7e22ce' });
    addLog('Russian Roulette! CC immunity + next GREEN, then 6 RED!', 'win');
  } else if (charId === 'valerie') {
    qs.valGravityTimer = 180;
    qs.valGravityX = state.mouse.worldX;
    qs.valGravityY = state.mouse.worldY;
    state.visualEffects.push({ x: qs.valGravityX, y: qs.valGravityY, radius: 20, alpha: 0.7, color: '#a855f7', shadowColor: '#7e22ce', shadowBlur: 30 });
    addLog('Ante Up! Gravity trap deployed!', 'win');
  } else if (charId === 'buster') {
    qs.busterBoostTimer = 360;
    state.visualEffects.push({ x: p.x, y: p.y, radius: 12, alpha: 0.8, color: '#a855f7', shadowColor: '#7e22ce' });
    addLog('MAX BET! Attack speed doubled!', 'win');
  } else if (charId === 'silas') {
    p.hp = Math.max(0, p.hp - 1);
    applyStatus(p, 'bleed', 300);
    removeStatus(p, 'slow');
    qs.silasSpeedTimer = 300;
    qs.snakeEyes = true;
    state.visualEffects.push({ x: p.x, y: p.y, radius: 10, alpha: 0.8, color: '#a855f7', shadowColor: '#7e22ce' });
    addLog('Loaded Dice! Self-Bleed, speed boosted!', 'win');
  } else if (charId === 'roxanne') {
    qs.roxanneDoubleDown = 240;
    let angle = Math.atan2(state.mouse.worldY - p.y, state.mouse.worldX - p.x);
    if (hasStatus(p, 'blind')) angle += (Math.random() - 0.5) * (Math.PI / 2);
    const coneSpeed = 8;
    for (let i = -2; i <= 2; i++) {
      state.projectiles.push({
        x: p.x, y: p.y,
        vx: Math.cos(angle + i * 0.15) * coneSpeed,
        vy: Math.sin(angle + i * 0.15) * coneSpeed,
        radius: 8, lifetime: 0, roundType: 'black',
        characterId: 'roxanne',
        suit: 'hearts',
        applyStatus: 'slow',
      });
    }
    state.visualEffects.push({
      x: p.x + Math.cos(angle) * 24,
      y: p.y + Math.sin(angle) * 24,
      radius: 8, alpha: 0.8, color: '#a855f7', shadowColor: '#7e22ce'
    });
    addLog('DOUBLE DOWN! Frontal slow cone!', 'win');
  }
  p.activeCooldown = 600;
}

function fireRanged(p, angle) {
  const cid = p.characterId;
  const qs = p.quirkState;
  let roundType;

  if (cid === 'luciano' && qs.lucianoNextGreen) {
    qs.lucianoNextGreen = false;
    roundType = 'green';
  } else if (cid === 'luciano' && qs.lucianoRedCount > 0) {
    qs.lucianoRedCount--;
    roundType = 'red';
  } else {
    const roll = Math.random() * 100;
    const greenChance = p.relics.includes('seven_up') ? 12 : 5;
    if (roll < greenChance) roundType = 'green';
    else if (roll < 52) roundType = 'red';
    else roundType = 'black';
    if (roundType !== 'green' && Math.random() * 100 < p.stats.LCK * 5) {
      roundType = Math.random() < 0.5 ? 'black' : 'green';
    }
  }

  if (roundType === 'green') {
    p.armor = 1;
    p.armorTimer = 120;
    return;
  }

  const projSpeed = p.relics.includes('bullet_time') ? 12 : 10;
  const piercesLeft = cid === 'valerie' ? 3 : undefined;

  let suit = 'diamonds';
  let applyStatusEffect;

  if (cid === 'luciano') {
    suit = 'diamonds';
    if (!qs.lucianoSuitCount) qs.lucianoSuitCount = 0;
    qs.lucianoSuitCount++;
    if (qs.lucianoSuitCount % 3 === 0) {
      suit = 'hearts';
      applyStatusEffect = 'burn';
    }
  } else if (cid === 'valerie') {
    const cycle = ['spades', 'hearts', 'diamonds', 'clubs'];
    if (!qs.valSuitIndex) qs.valSuitIndex = 0;
    suit = cycle[qs.valSuitIndex % cycle.length];
    qs.valSuitIndex++;

    if (suit === 'spades' && Math.random() < 0.35) {
      applyStatusEffect = 'bleed';
    }

    const isJoker = (p.shotCount || 0) % 5 === 0;
    if (isJoker) {
      applyStatusEffect = 'blind';
    }
  }

  if (hasStatus(p, 'blind')) {
    angle += (Math.random() - 0.5) * (Math.PI / 2);
  }

  state.projectiles.push({
    x: p.x, y: p.y,
    vx: Math.cos(angle) * projSpeed,
    vy: Math.sin(angle) * projSpeed,
    radius: 4, lifetime: 0, roundType,
    characterId: cid,
    piercesLeft,
    suit,
    applyStatus: applyStatusEffect,
  });

  if (p.relics.includes('split_hand')) {
    state.projectiles.push({
      x: p.x, y: p.y,
      vx: Math.cos(angle + 0.26) * projSpeed,
      vy: Math.sin(angle + 0.26) * projSpeed,
      radius: 4, lifetime: 0, roundType,
      characterId: cid,
      piercesLeft,
      suit,
      applyStatus: applyStatusEffect,
    });
  }

  state.visualEffects.push({
    x: p.x + Math.cos(angle) * 24,
    y: p.y + Math.sin(angle) * 24,
    radius: 5, alpha: 0.8, color: '#fbbf24', shadowColor: '#f59e0b'
  });
}

function fireMelee(p, range) {
  const qs = p.quirkState;
  if (qs.bustTimer > 0) { addLog('BUST! Cannot attack.', 'lose'); return; }

  let target = null;
  let targetDist = range;
  for (const enemy of state.enemies) {
    const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
    if (dist < targetDist) {
      targetDist = dist;
      target = enemy;
    }
  }

  if (!target && state.boss && Math.hypot(state.boss.x - p.x, state.boss.y - p.y) < range) {
    target = state.boss;
  }

  if (!target) return;

  const charId = p.characterId;

  if (charId === 'buster') {
    let bonusRoll = 0;
    if (qs.busterBoostTimer > 0) bonusRoll = 15;
    const slot = Math.random() * 100;
    let msg, dmg = 0;

    const mult = getSuitMultiplier(p.suit || 'clubs', target.suit);

    if (slot < 30 + bonusRoll) {
      dmg = Math.ceil((1 + (p.stats.PWR || 0)) * mult);
      msg = 'Cherries! Fire hit!';
      state.visualEffects.push({ x: target.x, y: target.y, radius: 6, alpha: 0.8 });
    } else if (slot < 55 + bonusRoll) {
      p.armor = Math.ceil(1 * mult);
      p.armorTimer = 120;
      msg = 'Diamonds! Armor gained!';
    } else if (slot < 75 + bonusRoll) {
      dmg = Math.ceil(1 * mult);
      msg = 'Bar hit.';
    } else if (slot < 90 + bonusRoll) {
      dmg = Math.ceil(3 * mult);
      p.gold += 10 + Math.floor(Math.random() * 15);
      state.visualEffects.push({ x: target.x, y: target.y, radius: 12, alpha: 0.9 });
      msg = '777! Gold blast + Bleed!';
      applyStatus(target, 'bleed', 180);
    } else {
      p.hp = Math.max(0, p.hp - 1);
      msg = 'BUST! Took 1 damage!';
    }

    if (dmg > 0) {
      meleeKill(target, state, dmg, msg);
    } else {
      addLog(msg, 'info');
    }
  } else if (charId === 'silas') {
    let d1, d2;
    if (qs.snakeEyes) {
      d1 = 1; d2 = 1;
      qs.snakeEyes = false;
    } else {
      d1 = Math.ceil(Math.random() * 6);
      d2 = Math.ceil(Math.random() * 6);
    }

    const swingSuit = (d1 + d2) % 2 === 0 ? 'clubs' : 'spades';
    const mult = getSuitMultiplier(swingSuit, target.suit);

    const total = d1 + d2;
    let dmg = Math.ceil(total * mult);
    let msg = `${d1}+${d2}=${total}. `;

    if (total === 2) {
      p.hp = Math.max(0, p.hp - 1);
      qs.silasSpeedTimer = Math.max(qs.silasSpeedTimer || 0, 300);
      state.visualEffects.push({ x: p.x, y: p.y, radius: 6, alpha: 0.8, color: '#22c55e', shadowColor: '#16a34a' });
      msg += 'Snake Eyes! Speed boosted, took 1 HP!';
    } else if (total === 7 || total === 11) {
      dmg += Math.ceil((p.stats.PWR || 0) * mult);
      const kbDir = Math.atan2(target.y - p.y, target.x - p.x);
      target.x += Math.cos(kbDir) * 40;
      target.y += Math.sin(kbDir) * 40;
      applyStatus(target, 'slow', 180);
      state.visualEffects.push({ x: target.x, y: target.y, radius: 10, alpha: 0.8, color: '#eab308', shadowColor: '#ca8a04' });
      msg += 'Lucky! Knockback + Slow!';
    } else if (total >= 3 && total <= 6) {
      if (!qs.silasDmgBuff) qs.silasDmgBuff = 0;
      qs.silasDmgBuff += 0.2;
      dmg = Math.ceil(dmg * (1 + qs.silasDmgBuff));
      state.visualEffects.push({ x: p.x, y: p.y, radius: 5, alpha: 0.7, color: '#60a5fa', shadowColor: '#3b82f6' });
      msg += 'Stacking buff! +20% damage!';
    } else {
      dmg += Math.ceil((p.stats.PWR || 0) * mult);
      state.visualEffects.push({ x: target.x, y: target.y, radius: 6, alpha: 0.7, color: '#60a5fa', shadowColor: '#3b82f6' });
      msg += 'Solid hit!';
    }

    meleeKill(target, state, dmg, msg);
  } else if (charId === 'roxanne') {
    const mult = getSuitMultiplier(p.suit || 'hearts', target.suit);
    let dmg = Math.ceil((1 + (p.stats.PWR || 0) + (p.stats.ARM || 0)) * mult);
    if (qs.roxanneDoubleDown > 0) dmg = Math.ceil(dmg * 1.5);
    state.visualEffects.push({ x: target.x, y: target.y, radius: 8, alpha: 0.8 });
    let msg = `Shield bash! ${dmg} damage`;
    if (mult > 1) msg += ' (ADVANTAGE!)';
    else if (mult < 1) msg += ' (DISADVANTAGE!)';

    meleeKill(target, state, dmg, msg);
  }
}

export function setupInput() {
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    keys[e.code] = true;

    if (e.key === 'e' || e.key === 'E') {
      const handled = handleInteract();
      if (!handled && state.player.activeCooldown <= 0 && state.player.characterId) {
        useActiveAbility();
      }
    }

    if (e.key === 'Escape') {
      const pauseScreen = document.getElementById('pause-screen');
      if (pauseScreen.style.display !== 'none') {
        state.isPaused = false;
        pauseScreen.style.display = 'none';
        document.getElementById('pause-save-slots').style.display = 'none';
      } else {
        state.isPaused = true;
        document.getElementById('map-screen').style.display = 'none';
        pauseScreen.style.display = 'flex';
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const mapScreen = document.getElementById('map-screen');
      if (mapScreen.style.display !== 'none') {
        state.isPaused = false;
        mapScreen.style.display = 'none';
      } else {
        state.isPaused = true;
        document.getElementById('pause-screen').style.display = 'none';
        document.getElementById('pause-save-slots').style.display = 'none';
        renderMapUI();
      }
    }

    if (e.key === ' ') {
      e.preventDefault();
      const p = state.player;
      if (p.dashCooldown > 0 || p.dashTimer > 0 || p.hp <= 0) return;
      let dirX = p.vx;
      let dirY = p.vy;
      if (dirX === 0 && dirY === 0) {
        const angle = Math.atan2(state.mouse.worldY - p.y, state.mouse.worldX - p.x);
        dirX = Math.cos(angle);
        dirY = Math.sin(angle);
      }
      const len = Math.hypot(dirX, dirY) || 1;
      p.dashVx = (dirX / len) * 15;
      p.dashVy = (dirY / len) * 15;
      p.dashTimer = 12;
      p.dashCooldown = 150;
      p.invulnerable = Math.max(p.invulnerable, 15);
      p.dashGhosts = [];
    }

    if (e.key === 'r' || e.key === 'R') {
      location.reload();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.screenX = e.clientX - rect.left;
    state.mouse.screenY = e.clientY - rect.top;
  });

  canvas.addEventListener('click', () => {
    if (state.player.hp <= 0) {
      document.getElementById('game-over-screen').style.display = 'flex';
      return;
    }
    const p = state.player;
    const charId = p.characterId;
    if (!charId) return;

    const char = CHARACTERS[charId];
    if (!char) return;

    const angle = Math.atan2(state.mouse.worldY - p.y, state.mouse.worldX - p.x);

    if (char.attackType === 'ranged') {
      fireRanged(p, angle);
    } else if (char.attackType === 'melee') {
      fireMelee(p, char.meleeRange);
    }
  });

  const svg = document.getElementById('map-svg');
  svg.addEventListener('click', onNodeClick);

  document.getElementById('map-screen').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      state.isPaused = false;
      e.currentTarget.style.display = 'none';
    }
  });
}
