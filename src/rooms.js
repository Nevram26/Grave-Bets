import { state } from './state.js';
import { RELICS } from './relics.js';
import { updateUI, addLog } from './hud.js';
import { FLOORS, ENEMY_TYPES, BOSS_REGISTRY, THEME_PALETTES } from './data.js';
import { generateMapData } from './map.js';
import { renderMapUI } from './ui.js';

export function applyRelicEffect(id) {
  const p = state.player;
  switch (id) {
    case 'lucky_coin': p.stats.LCK += 2; break;
    case 'kevlar_vest': p.stats.ARM += 1; break;
    case 'glass_cannon': p.stats.PWR += 2; p.maxHp = Math.max(1, p.maxHp - 1); p.hp = Math.min(p.hp, p.maxHp); break;
    case 'healing_pact': p.hp = Math.min(p.maxHp, p.hp + 3); break;
  }
}

export function pickRandomRelic() {
  return { ...RELICS[Math.floor(Math.random() * RELICS.length)] };
}

export function generateRoom(type, nodeType = 'Normal') {
  state.currentNodeType = nodeType;
  state.enemies.length = 0;
  state.enemyProjectiles.length = 0;
  state.projectiles.length = 0;
  state.visualEffects.length = 0;
  state.obstacles.length = 0;
  state.corridors.length = 0;
  state.chest = null;
  state.boss = null;
  state.bossState.mechanic = null;
  state.bossState.leverActive = false;
  state.bossState.leverTimer = 0;
  state.bossState.sisterElite = null;
  state.bossState.sisterSwapTimer = 0;
  state.bossState.lockdownWalls = [];
  state.bossState.beamTelegraph = null;
  state.bossState.clones = [];
  state.bossState.realGlow = 0;
  state.bossState.midasPhase = 1;
  state.elevator = null;
  state.shopRelics.length = 0;
  state.shopkeeper = null;
  state.isRoomCleared = false;
  state.player.quirkState = {};
  state.player.activeCooldown = 0;

  state.player.x = 1500;
  state.player.y = 1500;
  state.camera.x = 1500;
  state.camera.y = 1500;
  state.camera.targetX = 1500;
  state.camera.targetY = 1500;

  const floor = FLOORS[state.currentFloor] || FLOORS[0];
  const palette = THEME_PALETTES[floor.theme] || THEME_PALETTES.Industrial;

  if (type === 'combat') {
    state.roomType = floor.name;
    state.rooms = [{
      name: floor.name, x: 1000, y: 1000, w: 1000, h: 1000,
      bgColor: palette.bg, borderColor: palette.border,
      accentColor: palette.accent, features: [],
    }];

    if (nodeType === 'Boss') {
      const bossDef = BOSS_REGISTRY[floor.boss];
      state.rooms[0].name = `BOSS: ${floor.boss}`;
      state.boss = {
        x: 1500, y: 1500,
        emoji: bossDef.emoji,
        hp: bossDef.hp, maxHp: bossDef.maxHp,
        speed: bossDef.speed, phase2Speed: bossDef.phase2Speed,
        attackTimer: 0, phase: 1, radius: bossDef.radius,
        flashTimer: 0, suit: bossDef.suit, statusEffects: [],
        mechanic: bossDef.mechanic,
      };
      state.bossState.mechanic = bossDef.mechanic;

      if (floor.boss === 'The Card-Shark Sisters') {
        const blade = {
          x: 1400, y: 1400, emoji: '\u{1F5E1}\uFE0F',
          hp: 999, speed: 2.5, radius: 24, type: 'melee',
          cooldown: 0, attackCooldown: 0, suit: 'spades',
          statusEffects: [], isBossPart: true, bossPartKey: 'blade',
          attackReady: false,
        };
        const gun = {
          x: 1600, y: 1600, emoji: '\u{1F52B}',
          hp: 999, speed: 0, radius: 22, type: 'ranged',
          cooldown: 0, attackCooldown: 0, suit: 'spades',
          statusEffects: [], isBossPart: true, bossPartKey: 'gun',
          attackReady: false,
        };
        state.enemies.push(blade, gun);
        state.bossState.sisterElite = 'blade';
        state.bossState.sisterSwapTimer = 900;
      }
    } else {
      const count = nodeType === 'Elite' ? (5 + Math.floor(Math.random() * 2)) : (3 + Math.floor(Math.random() * 2));
      const pool = floor.enemyPool;
      for (let i = 0; i < count; i++) {
        const name = pool[Math.floor(Math.random() * pool.length)];
        const template = ENEMY_TYPES[name];
        if (!template) continue;
        const suitRoll = Math.random();
        const enemySuit = suitRoll < 0.35 ? 'clubs' : suitRoll < 0.65 ? 'diamonds' : suitRoll < 0.85 ? 'spades' : 'hearts';
        const hpMult = nodeType === 'Elite' ? 2 : 1;
        state.enemies.push({
          x: 1200 + Math.random() * 600,
          y: 1200 + Math.random() * 600,
          emoji: template.emoji,
          hp: template.hp * hpMult,
          speed: template.speed,
          radius: template.radius,
          type: template.type,
          cooldown: 0,
          attackCooldown: 0,
          suit: template.type === 'ranged' ? 'diamonds' : enemySuit,
          statusEffects: [],
        });
      }

      const obstacleCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < obstacleCount; i++) {
        let ox, oy, valid;
        let attempts = 0;
        do {
          ox = 1050 + Math.random() * 900;
          oy = 1050 + Math.random() * 900;
          valid = Math.hypot(ox - 1500, oy - 1500) > 150;
          if (valid) {
            for (const e of state.enemies) {
              if (Math.hypot(ox - e.x, oy - e.y) < 80) { valid = false; break; }
            }
          }
          if (valid) {
            for (const obs of state.obstacles) {
              if (Math.hypot(ox - obs.x, oy - obs.y) < 80) { valid = false; break; }
            }
          }
          attempts++;
        } while (!valid && attempts < 20);
        if (!valid) continue;
        if (Math.random() < 0.6) {
          const size = 30 + Math.floor(Math.random() * 21);
          state.obstacles.push({ type: 'crate', x: ox, y: oy, w: size, h: size });
        } else {
          state.obstacles.push({ type: 'pillar', x: ox, y: oy, r: 20 });
        }
      }
    }
  } else if (type === 'shop') {
    state.roomType = 'The Lounge';
    state.rooms = [{ name: 'The Lounge', x: 1000, y: 1000, w: 1000, h: 1000, bgColor: '#0a0a1a', borderColor: '#3b82f6', accentColor: '#2563eb', features: [] }];
    state.shopkeeper = { x: 1500, y: 1300, emoji: '\u{1F3A9}' };
    state.isRoomCleared = true;
    const shuffled = [...RELICS].sort(() => Math.random() - 0.5);
    state.shopRelics = shuffled.slice(0, 3).map((relic, i) => ({ ...relic, x: 1400 + i * 100, y: 1500 }));
  } else {
    state.roomType = 'The Vault';
    state.rooms = [{ name: 'The Vault', x: 1000, y: 1000, w: 1000, h: 1000, bgColor: '#020d11', borderColor: '#06b6d4', accentColor: '#0891b2', features: [] }];
    state.chest = { x: 1500, y: 1500, emoji: '\u{1F9F0}', used: false, offeredRelic: null };
    state.isRoomCleared = true;
  }

  updateUI();
}

export function showChestPanel() {
  const panel = document.getElementById('chest-panel');
  const display = document.getElementById('chest-relic-display');
  const respinBtn = document.getElementById('chest-respin-btn');
  const costLabel = document.getElementById('chest-respin-cost');
  const relic = state.chest.offeredRelic;
  display.innerHTML = `
    <span class="relic-emoji">${relic.emoji}</span>
    <span class="relic-name">${relic.name}</span>
    <span class="relic-desc">${relic.desc}</span>
  `;
  const freeLeft = state.runFreeRespins;
  if (freeLeft > 0) {
    respinBtn.disabled = false;
    costLabel.textContent = `Free re-spins left: ${freeLeft}`;
  } else if (state.player.gold >= 10) {
    respinBtn.disabled = false;
    costLabel.textContent = 'Re-spin costs 10 Gold';
  } else {
    respinBtn.disabled = true;
    costLabel.textContent = 'Not enough Gold to re-spin';
  }
  panel.style.display = 'flex';
}

export function takeChestRelic() {
  const chest = state.chest;
  if (!chest || !chest.offeredRelic) return;
  const relic = chest.offeredRelic;
  state.player.relics.push(relic.id);
  applyRelicEffect(relic.id);
  addLog(`Took ${relic.emoji} ${relic.name}!`, 'win');
  chest.used = true;
  document.getElementById('chest-panel').style.display = 'none';
  updateUI();
}

export function respinChestRelic() {
  const chest = state.chest;
  if (!chest || chest.used) return;
  const freeLeft = state.runFreeRespins;
  if (freeLeft > 0) {
    state.runFreeRespins = freeLeft - 1;
  } else if (state.player.gold >= 10) {
    state.player.gold -= 10;
  } else {
    return;
  }
  chest.offeredRelic = pickRandomRelic();
  const relic = chest.offeredRelic;
  state.player.relics.push(relic.id);
  applyRelicEffect(relic.id);
  addLog(`Re-spun! Got ${relic.emoji} ${relic.name}!`, 'win');
  chest.used = true;
  document.getElementById('chest-panel').style.display = 'none';
  updateUI();
}

export function transitionFloor() {
  if (state.currentFloor >= 4) return;
  state.currentFloor++;
  const floor = FLOORS[state.currentFloor];
  addLog(`\u{1F4C8} Ascending to ${floor.name}!`, 'win');
  state.mapData = generateMapData(state.currentFloor);
  state.currentNodeIndex = -1;
  state.isPaused = true;
  renderMapUI();
}

export function handleInteract() {
  for (const relic of state.shopRelics) {
    if (Math.hypot(state.player.x - relic.x, state.player.y - relic.y) < 50) {
      if (state.player.gold < relic.cost) { addLog('Not enough Gold!', 'lose'); return true; }
      state.player.gold -= relic.cost;
      state.player.relics.push(relic.id);
      applyRelicEffect(relic.id);
      addLog(`Purchased ${relic.emoji} ${relic.name}!`, 'win');
      const idx = state.shopRelics.indexOf(relic);
      if (idx !== -1) state.shopRelics.splice(idx, 1);
      updateUI();
      return true;
    }
  }

  if (state.chest && Math.hypot(state.player.x - state.chest.x, state.player.y - state.chest.y) < 50) {
    const chest = state.chest;
    if (chest.used) { addLog('The vault is sealed.', 'info'); return true; }
    if (!chest.offeredRelic) {
      chest.offeredRelic = pickRandomRelic();
    }
    showChestPanel();
    return true;
  }

  if (state.elevator && Math.hypot(state.player.x - state.elevator.x, state.player.y - state.elevator.y) < 50) {
    if (state.currentFloor < 4) {
      transitionFloor();
    } else {
      addLog('\u{1F451} Midas Vance awaits... this is the final floor!', 'win');
    }
    return true;
  }

  return false;
}
