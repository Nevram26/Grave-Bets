import { state } from './state.js';
import { RELICS } from './relics.js';
import { updateUI, addLog } from './hud.js';

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

  if (type === 'combat') {
    state.roomType = 'Penny Slots';
    state.rooms = [{ name: 'Penny Slots', x: 1000, y: 1000, w: 1000, h: 1000, bgColor: '#080510', borderColor: '#8b5cf6', accentColor: '#7c3aed', features: [] }];

    if (nodeType === 'Boss') {
      state.roomType = 'The Penthouse';
      state.rooms[0].name = 'The Penthouse';
      state.rooms[0].bgColor = '#0a0015';
      state.rooms[0].borderColor = '#a855f7';
      state.rooms[0].accentColor = '#7e22ce';
      state.boss = { x: 1500, y: 1500, emoji: '\u{1F479}', hp: 100, maxHp: 100, speed: 1.5, attackTimer: 0, phase: 1, radius: 40, flashTimer: 0, suit: 'clubs', statusEffects: [] };
    } else {
      const count = nodeType === 'Elite' ? (5 + Math.floor(Math.random() * 2)) : (3 + Math.floor(Math.random() * 2));
      for (let i = 0; i < count; i++) {
        const isRanged = Math.random() < 0.5;
        const suitRoll = Math.random();
        const enemySuit = suitRoll < 0.35 ? 'clubs' : suitRoll < 0.65 ? 'diamonds' : suitRoll < 0.85 ? 'spades' : 'hearts';
        state.enemies.push({
          x: 1200 + Math.random() * 600,
          y: 1200 + Math.random() * 600,
          emoji: isRanged ? '\u{1F574}\uFE0F' : '\u{1F480}',
          hp: isRanged ? (nodeType === 'Elite' ? 2 : 1) : (nodeType === 'Elite' ? 4 : 2),
          speed: isRanged ? 0 : 2,
          radius: 20,
          type: isRanged ? 'ranged' : 'melee',
          cooldown: 0,
          attackCooldown: 0,
          suit: isRanged ? 'diamonds' : enemySuit,
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

  return false;
}
