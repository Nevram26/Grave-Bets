import { state } from './state.js';
import { RELICS } from './relics.js';
import { updateUI, addLog } from './hud.js';

function applyRelicEffect(id) {
  const p = state.player;
  switch (id) {
    case 'lucky_coin': p.stats.LCK += 2; break;
    case 'kevlar_vest': p.stats.ARM += 1; break;
    case 'glass_cannon': p.stats.PWR += 2; p.maxHp = Math.max(1, p.maxHp - 1); p.hp = Math.min(p.hp, p.maxHp); break;
    case 'healing_pact': p.hp = Math.min(p.maxHp, p.hp + 3); break;
  }
}

export function generateRoom(type, nodeType = 'Normal') {
  state.enemies.length = 0;
  state.enemyProjectiles.length = 0;
  state.projectiles.length = 0;
  state.visualEffects.length = 0;
  state.corridors.length = 0;
  state.chest = null;
  state.boss = null;
  state.shopRelics.length = 0;
  state.shopkeeper = null;
  state.isRoomCleared = false;

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
      state.boss = { x: 1500, y: 1500, emoji: '\u{1F479}', hp: 100, maxHp: 100, speed: 1.5, attackTimer: 0, phase: 1, radius: 40, flashTimer: 0 };
    } else {
      const count = nodeType === 'Elite' ? (5 + Math.floor(Math.random() * 2)) : (3 + Math.floor(Math.random() * 2));
      for (let i = 0; i < count; i++) {
        const isRanged = Math.random() < 0.5;
        state.enemies.push({
          x: 1200 + Math.random() * 600,
          y: 1200 + Math.random() * 600,
          emoji: isRanged ? '\u{1F574}\uFE0F' : '\u{1F480}',
          hp: isRanged ? (nodeType === 'Elite' ? 2 : 1) : (nodeType === 'Elite' ? 4 : 2),
          speed: isRanged ? 0 : 2,
          radius: 20,
          type: isRanged ? 'ranged' : 'melee',
          cooldown: 0,
        });
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
    state.chest = { x: 1500, y: 1500, cost: 10, emoji: '\u{1F9F0}' };
    state.isRoomCleared = true;
  }

  updateUI();
}

export function handleInteract() {
  for (let i = state.shopRelics.length - 1; i >= 0; i--) {
    const relic = state.shopRelics[i];
    const dist = Math.hypot(state.player.x - relic.x, state.player.y - relic.y);
    if (dist > 50) continue;
    if (state.player.gold < relic.cost) { addLog('Not enough Gold!', 'lose'); return; }
    state.player.gold -= relic.cost;
    state.player.relics.push(relic.id);
    applyRelicEffect(relic.id);
    addLog(`Purchased ${relic.emoji} ${relic.name}!`, 'win');
    state.shopRelics.splice(i, 1);
    updateUI();
    return;
  }

  if (!state.chest) return;
  const dist = Math.hypot(state.player.x - state.chest.x, state.player.y - state.chest.y);
  if (dist > 50) return;
  if (state.player.gold < state.chest.cost) { addLog('Not enough Gold!', 'lose'); return; }
  state.player.gold -= state.chest.cost;
  const roll = Math.random();
  if (roll < 0.33) { state.player.stats.PWR += 1; addLog('+1 PWR!', 'win'); }
  else if (roll < 0.66) { state.player.stats.LCK += 1; addLog('+1 LCK!', 'win'); }
  else { state.player.maxHp += 2; state.player.hp += 2; addLog('+2 Max HP!', 'win'); }
  state.chest.cost *= 2;
  updateUI();
}
