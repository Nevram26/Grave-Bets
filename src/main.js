import { state } from './state.js';
import { processProjectileHit } from './combat.js';

/* ------------------------------------------------------------------ */
/*  DOM References                                                     */
/* ------------------------------------------------------------------ */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const healthDisplay = document.getElementById('healthDisplay');
const goldDisplay = document.getElementById('goldDisplay');
const armorDisplay = document.getElementById('armorDisplay');
const actionLog = document.getElementById('actionLog');
const zoneLabel = document.getElementById('zoneLabel');
const mapScreen = document.getElementById('map-screen');

const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

document.querySelectorAll('.map-btn[data-room]').forEach(btn => {
  btn.addEventListener('click', () => {
    generateRoom(btn.dataset.room);
    mapScreen.style.display = 'none';
  });
});
document.querySelector('.map-stay').addEventListener('click', () => {
  mapScreen.style.display = 'none';
});

/* ------------------------------------------------------------------ */
/*  Canvas Resize                                                      */
/* ------------------------------------------------------------------ */

function resizeCanvas() {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function generateRoom(type) {
  state.enemies.length = 0;
  state.enemyProjectiles.length = 0;
  state.projectiles.length = 0;
  state.visualEffects.length = 0;
  state.corridors.length = 0;
  state.chest = null;
  state.isRoomCleared = false;
  mapScreen.style.display = 'none';

  state.player.x = 1500;
  state.player.y = 1500;
  state.camera.x = 1500;
  state.camera.y = 1500;
  state.camera.targetX = 1500;
  state.camera.targetY = 1500;

  if (type === 'combat') {
    state.roomType = 'Penny Slots';
    state.rooms = [{ name: 'Penny Slots', x: 1000, y: 1000, w: 1000, h: 1000, bgColor: '#080510', borderColor: '#8b5cf6', accentColor: '#7c3aed', features: [] }];

    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const isRanged = Math.random() < 0.5;
      state.enemies.push({
        x: 1200 + Math.random() * 600,
        y: 1200 + Math.random() * 600,
        emoji: isRanged ? '\u{1F574}\uFE0F' : '\u{1F480}',
        hp: isRanged ? 1 : 2,
        speed: isRanged ? 0 : 2,
        radius: 20,
        type: isRanged ? 'ranged' : 'melee',
        cooldown: 0,
      });
    }
  } else {
    state.roomType = 'The Vault';
    state.rooms = [{ name: 'The Vault', x: 1000, y: 1000, w: 1000, h: 1000, bgColor: '#020d11', borderColor: '#06b6d4', accentColor: '#0891b2', features: [] }];
    state.chest = { x: 1500, y: 1500, cost: 10, emoji: '\u{1F9F0}' };
    state.isRoomCleared = true;
  }

  updateUI();
}

function handleInteract() {
  if (!state.chest) return;
  const dist = Math.hypot(state.player.x - state.chest.x, state.player.y - state.chest.y);
  if (dist > 50) return;
  if (state.player.gold < state.chest.cost) {
    addLog('Not enough Gold!', 'lose');
    return;
  }
  state.player.gold -= state.chest.cost;

  const roll = Math.random();
  if (roll < 0.33) {
    state.player.stats.PWR += 1;
    addLog('+1 PWR!', 'win');
  } else if (roll < 0.66) {
    state.player.stats.LCK += 1;
    addLog('+1 LCK!', 'win');
  } else {
    state.player.maxHp += 2;
    state.player.hp += 2;
    addLog('+2 Max HP!', 'win');
  }

  state.chest.cost *= 2;
  updateUI();
}

/* ------------------------------------------------------------------ */
/*  Input: Keyboard                                                    */
/* ------------------------------------------------------------------ */

const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code.startsWith('Arrow') || e.code === 'Space') {
    e.preventDefault();
  }
  if (e.code === 'KeyE') {
    handleInteract();
  }
  if (e.code === 'KeyM' && state.isRoomCleared) {
    mapScreen.style.display = mapScreen.style.display === 'flex' ? 'none' : 'flex';
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

/* ------------------------------------------------------------------ */
/*  Input: Mouse                                                       */
/* ------------------------------------------------------------------ */

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse.screenX = e.clientX - rect.left;
  state.mouse.screenY = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
  const p = state.player;
  const angle = Math.atan2(
    state.mouse.worldY - p.y,
    state.mouse.worldX - p.x,
  );

  const roll = Math.random() * 100;
  let roundType;

  if (roll < 5) {
    roundType = 'green';
  } else if (roll < 52) {
    roundType = 'red';
  } else {
    roundType = 'black';
  }

  if (roundType !== 'green' && Math.random() * 100 < p.stats.LCK * 5) {
    roundType = Math.random() < 0.5 ? 'black' : 'green';
    addLog('NUDGED!', 'win');
  }

  if (roundType === 'green') {
    p.armor = 1;
    p.armorTimer = 120;
    addLog('\uD83C\uDFB0 Green 00: Shield Activated!', 'win');
    return;
  }

  state.projectiles.push({
    x: p.x,
    y: p.y,
    vx: Math.cos(angle) * 10,
    vy: Math.sin(angle) * 10,
    radius: 4,
    lifetime: 0,
    roundType,
  });
});

/* ------------------------------------------------------------------ */
/*  Collision: World Bounds                                            */
/* ------------------------------------------------------------------ */

function isValidPosition(x, y, radius) {
  if (radius === undefined) radius = state.player.radius;

  for (const room of state.rooms) {
    if (x >= room.x + radius && x <= room.x + room.w - radius &&
        y >= room.y + radius && y <= room.y + room.h - radius) {
      return true;
    }
  }

  for (const corridor of state.corridors) {
    if (x >= corridor.x + radius && x <= corridor.x + corridor.w - radius &&
        y >= corridor.y + radius && y <= corridor.y + corridor.h - radius) {
      return true;
    }
  }

  return false;
}

/* ------------------------------------------------------------------ */
/*  Update                                                             */
/* ------------------------------------------------------------------ */

function update() {
  const p = state.player;

  /* --- Timers --- */
  if (p.invulnerable > 0) p.invulnerable--;
  if (p.armorTimer > 0) {
    p.armorTimer--;
    if (p.armorTimer === 0) p.armor = 0;
  }

  /* --- Player Movement --- */
  p.vx = 0;
  p.vy = 0;

  if (keys['KeyW'] || keys['ArrowUp'])    p.vy = -p.speed;
  if (keys['KeyS'] || keys['ArrowDown'])   p.vy =  p.speed;
  if (keys['KeyA'] || keys['ArrowLeft'])   p.vx = -p.speed;
  if (keys['KeyD'] || keys['ArrowRight'])  p.vx =  p.speed;

  if (p.vx !== 0 && p.vy !== 0) {
    p.vx *= 0.7071;
    p.vy *= 0.7071;
  }

  const nx = p.x + p.vx;
  const ny = p.y + p.vy;

  if (isValidPosition(nx, ny, p.radius)) {
    p.x = nx;
    p.y = ny;
  } else if (isValidPosition(p.x, ny, p.radius)) {
    p.y = ny;
  } else if (isValidPosition(nx, p.y, p.radius)) {
    p.x = nx;
  }

  /* --- Mouse → World --- */
  state.mouse.worldX = state.mouse.screenX + state.camera.x - canvas.width / 2;
  state.mouse.worldY = state.mouse.screenY + state.camera.y - canvas.height / 2;

  /* --- Camera --- */
  const vecX = state.mouse.worldX - p.x;
  const vecY = state.mouse.worldY - p.y;
  state.camera.targetX = p.x + vecX * state.camera.mouseLookFactor;
  state.camera.targetY = p.y + vecY * state.camera.mouseLookFactor;
  state.camera.x += (state.camera.targetX - state.camera.x) * state.camera.lerp;
  state.camera.y += (state.camera.targetY - state.camera.y) * state.camera.lerp;

  /* --- Player Projectiles --- */
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.lifetime++;

    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const enemy = state.enemies[j];
      if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < 28) {
        const impactX = enemy.x;
        const impactY = enemy.y;
        const damage = proj.roundType === 'black' ? 2 : 1;
        const result = processProjectileHit(enemy, state, damage);
        addLog(result.message, result.killed ? 'win' : 'info');

        if (proj.roundType === 'red') {
          state.visualEffects.push({
            x: impactX,
            y: impactY,
            radius: 5,
            alpha: 0.8,
          });
        }

        if (result.killed && state.enemies.length === 0) {
          addLog('\u2728 All enemies vanquished! The dungeon is clear!', 'win');
        }
        state.projectiles.splice(i, 1);
        hit = true;
        break;
      }
    }

    if (hit) continue;

    if (proj.lifetime > 120 ||
        proj.x < 0 || proj.x > state.world.width ||
        proj.y < 0 || proj.y > state.world.height) {
      state.projectiles.splice(i, 1);
    }
  }

  /* --- Enemy Projectiles --- */
  for (let i = state.enemyProjectiles.length - 1; i >= 0; i--) {
    const proj = state.enemyProjectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.lifetime++;

    const dx = proj.x - p.x;
    const dy = proj.y - p.y;
    if (Math.hypot(dx, dy) < p.radius + proj.radius) {
      if (p.invulnerable === 0) {
        if (p.armor > 0 && p.armorTimer > 0) {
          p.armor = 0;
        } else {
          p.hp -= 1;
        }
        p.invulnerable = 60;
        addLog('Took 1 Damage!', 'lose');
        updateUI();
      }
      state.enemyProjectiles.splice(i, 1);
      continue;
    }

    if (proj.lifetime > 120 ||
        proj.x < 0 || proj.x > state.world.width ||
        proj.y < 0 || proj.y > state.world.height) {
      state.enemyProjectiles.splice(i, 1);
    }
  }

  /* --- Visual Effects --- */
  for (let i = state.visualEffects.length - 1; i >= 0; i--) {
    const eff = state.visualEffects[i];
    eff.radius += 2;
    eff.alpha -= 0.06;
    if (eff.alpha <= 0 || eff.radius > 60) {
      state.visualEffects.splice(i, 1);
    }
  }

  /* --- Melee Enemy AI --- */
  for (const enemy of state.enemies) {
    if (enemy.type !== 'melee') continue;

    const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
    const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
    const eRadius = enemy.radius || 20;

    const moveX = Math.cos(angle) * enemy.speed;
    const moveY = Math.sin(angle) * enemy.speed;

    const enx = enemy.x + moveX;
    const eny = enemy.y + moveY;

    if (isValidPosition(enx, eny, eRadius)) {
      enemy.x = enx;
      enemy.y = eny;
    } else if (isValidPosition(enx, enemy.y, eRadius)) {
      enemy.x = enx;
    } else if (isValidPosition(enemy.x, eny, eRadius)) {
      enemy.y = eny;
    }

    if (dist < p.radius + eRadius && p.invulnerable === 0) {
      if (p.armor > 0 && p.armorTimer > 0) {
        p.armor = 0;
      } else {
        p.hp -= 1;
      }
      p.invulnerable = 60;
      addLog('Took 1 Damage!', 'lose');
      updateUI();

      const kbForce = 25;
      const kbx = p.x + Math.cos(angle) * kbForce;
      const kby = p.y + Math.sin(angle) * kbForce;

      if (isValidPosition(kbx, kby, p.radius)) {
        p.x = kbx;
        p.y = kby;
      } else if (isValidPosition(kbx, p.y, p.radius)) {
        p.x = kbx;
      } else if (isValidPosition(p.x, kby, p.radius)) {
        p.y = kby;
      } else {
        const halfKbx = p.x + Math.cos(angle) * 12;
        const halfKby = p.y + Math.sin(angle) * 12;
        if (isValidPosition(halfKbx, halfKby, p.radius)) {
          p.x = halfKbx;
          p.y = halfKby;
        }
      }
    }
  }

  /* --- Ranged Enemy AI --- */
  for (const enemy of state.enemies) {
    if (enemy.type !== 'ranged') continue;

    if (enemy.cooldown > 0) {
      enemy.cooldown--;
    } else {
      const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
      state.enemyProjectiles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        radius: 4,
        lifetime: 0,
      });
      enemy.cooldown = 120;
    }
  }

  /* --- Room Clear Check --- */
  if (!state.isRoomCleared && state.enemies.length === 0 && !state.chest) {
    state.isRoomCleared = true;
    addLog('ROOM CLEARED! Press [M] to leave.', 'win');
    mapScreen.style.display = 'flex';
  }

  /* --- Zone Indicator --- */
  let zone = 'Between Zones';
  for (const room of state.rooms) {
    if (p.x >= room.x && p.x <= room.x + room.w &&
        p.y >= room.y && p.y <= room.y + room.h) {
      zone = room.name;
      break;
    }
  }
  zoneLabel.textContent = `CURRENT ZONE: ${zone.toUpperCase()}`;

  /* --- UI --- */
  updateUI();
}

/* ------------------------------------------------------------------ */
/*  Draw                                                               */
/* ------------------------------------------------------------------ */

function draw() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 - state.camera.x,
                canvas.height / 2 - state.camera.y);

  /* -- Grid -- */
  const gs = 80;
  const sx = Math.floor((state.camera.x - canvas.width / 2) / gs) * gs;
  const ex = Math.ceil((state.camera.x + canvas.width / 2) / gs) * gs;
  const sy = Math.floor((state.camera.y - canvas.height / 2) / gs) * gs;
  const ey = Math.ceil((state.camera.y + canvas.height / 2) / gs) * gs;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  for (let x = sx; x < ex; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, ey); ctx.stroke();
  }
  for (let y = sy; y < ey; y += gs) {
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(ex, y); ctx.stroke();
  }

  /* -- Corridors -- */
  for (const c of state.corridors) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }

  /* -- Rooms -- */
  for (const room of state.rooms) {
    ctx.fillStyle = room.bgColor;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    ctx.strokeStyle = room.borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(room.x, room.y, room.w, room.h);

    ctx.shadowColor = room.borderColor;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(room.x + 2, room.y + 2, room.w - 4, room.h - 4);
    ctx.shadowBlur = 0;

    for (const item of room.features) {
      if (item.type === 'table') {
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (item.type === 'pillar') {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      } else if (item.type === 'slot_row') {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(item.x, item.y, item.w, item.h);
        ctx.strokeStyle = room.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x, item.y, item.w, item.h);
        ctx.fillStyle = '#a78bfa';
        for (let sy = item.y + 10; sy < item.y + item.h; sy += 40) {
          ctx.fillRect(item.x + 5, sy, item.w - 10, 15);
        }
      } else if (item.type === 'vault_safe') {
        ctx.fillStyle = '#111827';
        ctx.fillRect(item.x, item.y, item.w, item.h);
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 3;
        ctx.strokeRect(item.x, item.y, item.w, item.h);
        ctx.beginPath();
        ctx.arc(item.x + item.w / 2, item.y + item.h / 2, 18, 0, Math.PI * 2);
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (item.type === 'laser_grid') {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(item.x1, item.y1);
        ctx.lineTo(item.x2, item.y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }

  /* -- Enemies -- */
  ctx.font = `48px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const enemy of state.enemies) {
    ctx.fillText(enemy.emoji, enemy.x, enemy.y);
  }

  /* -- Chest -- */
  if (state.chest) {
    ctx.font = `48px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.chest.emoji, state.chest.x, state.chest.y);

    ctx.font = '24px Courier New';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.fillText(`${state.chest.cost}G`, state.chest.x, state.chest.y - 50);
    ctx.shadowBlur = 0;

    const dist = Math.hypot(state.player.x - state.chest.x, state.player.y - state.chest.y);
    if (dist < 80) {
      ctx.font = '18px Courier New';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
      ctx.fillText('[E] Open', state.chest.x, state.chest.y + 50);
      ctx.shadowBlur = 0;
    }
  }

  /* -- Player Projectiles -- */
  for (const proj of state.projectiles) {
    if (proj.roundType === 'red') {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.shadowColor = '#334155';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /* -- Enemy Projectiles -- */
  ctx.font = '16px Segoe UI Emoji';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const proj of state.enemyProjectiles) {
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.fillText('\uD83C\uDFB2', proj.x, proj.y);
    ctx.shadowBlur = 0;
  }

  /* -- Visual Effects (Red explosions) -- */
  for (const eff of state.visualEffects) {
    ctx.globalAlpha = eff.alpha;
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(eff.x, eff.y, eff.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  /* -- Player -- */
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 12;
  ctx.font = `36px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.player.emoji, state.player.x, state.player.y);
  ctx.shadowBlur = 0;

  if (state.player.invulnerable > 0) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (state.player.armorTimer > 0) {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const angle = Math.atan2(
    state.mouse.worldY - state.player.y,
    state.mouse.worldX - state.player.x,
  );
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(state.player.x, state.player.y);
  ctx.lineTo(
    state.player.x + Math.cos(angle) * (state.player.radius - 2),
    state.player.y + Math.sin(angle) * (state.player.radius - 2),
  );
  ctx.stroke();

  /* -- Crosshair -- */
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.mouse.worldX, state.mouse.worldY, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(state.mouse.worldX - 12, state.mouse.worldY);
  ctx.lineTo(state.mouse.worldX + 12, state.mouse.worldY);
  ctx.moveTo(state.mouse.worldX, state.mouse.worldY - 12);
  ctx.lineTo(state.mouse.worldX, state.mouse.worldY + 12);
  ctx.stroke();

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  UI                                                                 */
/* ------------------------------------------------------------------ */

function updateUI() {
  healthDisplay.textContent = `\u2764\uFE0F Health: ${state.player.hp}/${state.player.maxHp}`;
  goldDisplay.textContent = `\u{1F4B0} Gold: ${state.player.gold}`;
  if (state.player.armor > 0 && state.player.armorTimer > 0) {
    armorDisplay.textContent = `\uD83D\uDEE1\uFE0F Armor: ${state.player.armor}`;
    armorDisplay.style.display = '';
  } else {
    armorDisplay.style.display = 'none';
  }
}

function addLog(message, className = 'info') {
  state.log.push(message);
  const entry = document.createElement('div');
  entry.className = `log-entry ${className}`;
  entry.textContent = message;
  actionLog.appendChild(entry);
  actionLog.scrollTop = actionLog.scrollHeight;
}

/* ------------------------------------------------------------------ */
/*  Game Loop                                                          */
/* ------------------------------------------------------------------ */

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

addLog('\uD83C\uDFB0 Welcome to Grave Bets \u2014 Luciano\'s Roulette Gun loaded.', 'info');
addLog('\uD83D\uDDB1\uFE0F Click to fire. Red=1dmg, Black=2dmg, Green=Shield!', 'info');
addLog('\uD83D\uDEB6 Move with WASD / Arrow keys. Watch for enemy projectiles!', 'info');
updateUI();
loop();
