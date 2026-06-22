const META_KEY = 'graveBetsSave';
const RUN_PREFIX = 'graveBetsRun';

const META_DEFAULTS = {
  soulChips: 0,
  unlockedCharacters: ['luciano'],
  upgrades: {
    startingGold: 0,
    extraHp: 0,
    canRespinChest: 0,
    startWithRelic: false,
  },
};

export function saveData(state) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(state.meta));
  } catch (e) {
    console.warn('Failed to save meta data:', e);
  }
}

export function loadData(state) {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.meta.soulChips = saved.soulChips ?? META_DEFAULTS.soulChips;
      state.meta.unlockedCharacters = saved.unlockedCharacters ?? [...META_DEFAULTS.unlockedCharacters];
      state.meta.upgrades = {
        startingGold: saved.upgrades?.startingGold ?? META_DEFAULTS.upgrades.startingGold,
        extraHp: saved.upgrades?.extraHp ?? META_DEFAULTS.upgrades.extraHp,
        canRespinChest: saved.upgrades?.canRespinChest ?? META_DEFAULTS.upgrades.canRespinChest,
        startWithRelic: saved.upgrades?.startWithRelic ?? META_DEFAULTS.upgrades.startWithRelic,
      };
    } else {
      state.meta = { ...META_DEFAULTS, upgrades: { ...META_DEFAULTS.upgrades } };
    }
  } catch (e) {
    state.meta = { ...META_DEFAULTS, upgrades: { ...META_DEFAULTS.upgrades } };
  }
}

function snapshotKey(slot) {
  return `${RUN_PREFIX}${slot}`;
}

export function saveRun(state, slot) {
  const snap = {
    player: {
      x: state.player.x, y: state.player.y,
      hp: state.player.hp, maxHp: state.player.maxHp,
      gold: state.player.gold, armor: state.player.armor, armorTimer: state.player.armorTimer,
      characterId: state.player.characterId, suit: state.player.suit,
      emoji: state.player.emoji, radius: state.player.radius,
      speed: state.player.speed, stats: { ...state.player.stats },
      relics: [...state.player.relics],
      quirkState: { ...state.player.quirkState },
      activeCooldown: state.player.activeCooldown,
      shotCount: state.player.shotCount,
      statusEffects: state.player.statusEffects.map(s => ({ ...s })),
      invulnerable: state.player.invulnerable,
      dashCooldown: state.player.dashCooldown,
      dashTimer: state.player.dashTimer,
      dashGhosts: [],
    },
    boss: state.boss ? { ...state.boss, statusEffects: state.boss.statusEffects.map(s => ({ ...s })) } : null,
    enemies: state.enemies.map(e => ({ ...e, statusEffects: e.statusEffects.map(s => ({ ...s })) })),
    enemyProjectiles: state.enemyProjectiles.map(p => ({ ...p })),
    projectiles: state.projectiles.map(p => ({ ...p })),
    visualEffects: state.visualEffects.map(v => ({ ...v })),
    chest: state.chest ? { ...state.chest } : null,
    shopRelics: state.shopRelics.map(r => ({ ...r })),
    shopkeeper: state.shopkeeper ? { ...state.shopkeeper } : null,
    rooms: state.rooms.map(r => ({ ...r, features: r.features.map(f => ({ ...f })) })),
    corridors: state.corridors.map(c => ({ ...c })),
    mapData: {
      nodes: state.mapData.nodes.map(n => ({ ...n })),
      rows: state.mapData.rows.map(r => ({ ...r })),
      visited: { ...state.mapData.visited },
      reachable: [...state.mapData.reachable],
    },
    currentFloor: state.currentFloor,
    currentNodeIndex: state.currentNodeIndex,
    currentNodeType: state.currentNodeType,
    roomType: state.roomType,
    isRoomCleared: state.isRoomCleared,
    runSoulChips: state.runSoulChips,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(snapshotKey(slot), JSON.stringify(snap));
  } catch (e) {
    console.warn('Failed to save run:', e);
  }
}

export function loadRun(state, slot) {
  try {
    const raw = localStorage.getItem(snapshotKey(slot));
    if (!raw) return false;
    const snap = JSON.parse(raw);
    Object.assign(state.player, snap.player);
    state.boss = snap.boss;
    state.enemies.length = 0; snap.enemies.forEach(e => state.enemies.push(e));
    state.enemyProjectiles.length = 0; snap.enemyProjectiles.forEach(p => state.enemyProjectiles.push(p));
    state.projectiles.length = 0; snap.projectiles.forEach(p => state.projectiles.push(p));
    state.visualEffects.length = 0; snap.visualEffects.forEach(v => state.visualEffects.push(v));
    state.chest = snap.chest;
    state.shopRelics.length = 0; snap.shopRelics.forEach(r => state.shopRelics.push(r));
    state.shopkeeper = snap.shopkeeper;
    state.rooms.length = 0; snap.rooms.forEach(r => state.rooms.push(r));
    state.corridors.length = 0; snap.corridors.forEach(c => state.corridors.push(c));
    state.currentFloor = snap.currentFloor ?? 0;
    state.elevator = null;
    state.mapData = snap.mapData;
    state.currentNodeIndex = snap.currentNodeIndex;
    state.currentNodeType = snap.currentNodeType;
    state.roomType = snap.roomType;
    state.isRoomCleared = snap.isRoomCleared;
    state.runSoulChips = snap.runSoulChips;
    state.deferredMap = false;
    state.gameState = 'playing';
    return true;
  } catch (e) {
    console.warn('Failed to load run:', e);
    return false;
  }
}

export function hasSavedRun(slot) {
  try {
    return localStorage.getItem(snapshotKey(slot)) !== null;
  } catch { return false; }
}

export function getRunInfo(slot) {
  try {
    const raw = localStorage.getItem(snapshotKey(slot));
    if (!raw) return null;
    const snap = JSON.parse(raw);
    return {
      character: snap.player.characterId,
      zone: snap.roomType || 'Unknown',
      chips: snap.runSoulChips || 0,
      timestamp: snap.timestamp,
    };
  } catch { return null; }
}

export function clearRun(slot) {
  try {
    localStorage.removeItem(snapshotKey(slot));
  } catch { }
}

export function clearAllRuns() {
  for (let i = 0; i < 3; i++) clearRun(i);
}
