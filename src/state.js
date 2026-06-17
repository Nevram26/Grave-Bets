export const state = {
  world: {
    width: 3000,
    height: 3000,
  },

  player: {
    x: 1500,
    y: 1500,
    radius: 16,
    speed: 5,
    vx: 0,
    vy: 0,
    emoji: '\u{1F9D9}\u200D\u2642\uFE0F',
    hp: 10, maxHp: 10,
    gold: 0,
    invulnerable: 0,
    armor: 0,
    armorTimer: 0,
    stats: {
      VIT: 10,
      PWR: 2,
      ARM: 0,
      SPD: 5,
      JCE: 0,
      LCK: 1,
    },
  },

  camera: {
    x: 1500,
    y: 1500,
    targetX: 1500,
    targetY: 1500,
    lerp: 0.08,
    mouseLookFactor: 0.25,
  },

  mouse: {
    screenX: 0,
    screenY: 0,
    worldX: 1500,
    worldY: 1500,
  },

  rooms: [
    {
      name: 'VIP Lounge',
      x: 1000, y: 1000, w: 1000, h: 1000,
      bgColor: '#0f050b', borderColor: '#ec4899', accentColor: '#db2777',
      features: [
        { type: 'table', x: 1300, y: 1300, r: 50 },
        { type: 'table', x: 1700, y: 1300, r: 50 },
        { type: 'table', x: 1500, y: 1700, r: 60 },
        { type: 'pillar', x: 1100, y: 1100, r: 20 },
        { type: 'pillar', x: 1900, y: 1100, r: 20 },
        { type: 'pillar', x: 1100, y: 1900, r: 20 },
        { type: 'pillar', x: 1900, y: 1900, r: 20 },
      ],
    },
    {
      name: 'Slot Machine Alley',
      x: 1150, y: 200, w: 700, h: 800,
      bgColor: '#080510', borderColor: '#8b5cf6', accentColor: '#7c3aed',
      features: [
        { type: 'slot_row', x: 1250, y: 300, w: 60, h: 300 },
        { type: 'slot_row', x: 1450, y: 300, w: 60, h: 300 },
        { type: 'slot_row', x: 1650, y: 300, w: 60, h: 300 },
        { type: 'slot_row', x: 1250, y: 650, w: 60, h: 250 },
        { type: 'slot_row', x: 1650, y: 650, w: 60, h: 250 },
      ],
    },
    {
      name: 'The Gold Vault',
      x: 150, y: 1100, w: 850, h: 800,
      bgColor: '#020d11', borderColor: '#06b6d4', accentColor: '#0891b2',
      features: [
        { type: 'vault_safe', x: 300, y: 1300, w: 80, h: 80 },
        { type: 'vault_safe', x: 300, y: 1600, w: 80, h: 80 },
        { type: 'laser_grid', x1: 500, y1: 1100, x2: 500, y2: 1900 },
        { type: 'laser_grid', x1: 700, y1: 1100, x2: 700, y2: 1900 },
      ],
    },
  ],

  corridors: [
    { x: 1450, y: 1000, w: 100, h: 100, name: 'VIP Lounge - Alley Connector' },
    { x: 1000, y: 1450, w: 100, h: 100, name: 'VIP Lounge - Vault Connector' },
  ],

  enemies: [
    { x: 1400, y: 1300, emoji: '\u{1F480}', hp: 2, speed: 2, radius: 20, type: 'melee', cooldown: 0 },
    { x: 1650, y: 1500, emoji: '\u{1F574}\uFE0F', hp: 1, speed: 0, radius: 20, type: 'ranged', cooldown: 0 },
  ],

  enemyProjectiles: [],

  projectiles: [],

  visualEffects: [],

  log: [],
  isRoomCleared: false,
  roomType: '',
  chest: null,
};
