import { state } from './state.js';
import { tickStatusEffects, applyStatus } from './suits.js';
import { isBlockedByObstacle } from './collision.js';
import { procRoxanneBlackjack } from './combat.js';

function updatePitboss(p, b, speedMult, bossStatus) {
  const bSpeed = b.speed * bossStatus.speedMult;
  const angle = Math.atan2(p.y - b.y, p.x - b.x);
  const dist = Math.hypot(p.x - b.x, p.y - b.y);
  if (dist > 0 && bossStatus.canAttack) {
    b.x += Math.cos(angle) * bSpeed;
    b.y += Math.sin(angle) * bSpeed;
  }
  if (!bossStatus.canAttack) return;
  if (b.hp <= 50 && b.phase === 1) {
    b.phase = 2;
    b.speed = b.phase2Speed ?? 2.5;
  }
  const bs = state.bossState;
  bs.leverTimer--;
  if (bs.leverTimer <= 0) {
    bs.leverActive = true;
    bs.leverTimer = b.phase === 2 ? 400 : 600;
    state.visualEffects.push({ x: b.x, y: b.y, radius: 18, alpha: 0.9, color: '#fbbf24', shadowColor: '#f59e0b' });
  }
  if (bs.leverActive) {
    const elapsed = b.phase === 2 ? 400 - bs.leverTimer : 600 - bs.leverTimer;
    if (elapsed > 120) bs.leverActive = false;
  }
  b.attackTimer++;
  const fireRate = b.phase === 2 ? 50 : 90;
  if (b.attackTimer >= fireRate) {
    b.attackTimer = 0;
    const spread = b.phase === 2 ? 5 : 3;
    for (let i = 0; i < spread; i++) {
      const off = (i - (spread - 1) / 2) * 0.2;
      state.enemyProjectiles.push({
        x: b.x, y: b.y,
        vx: Math.cos(angle + off) * 4 * speedMult * (bs.leverActive ? 1.2 : 1),
        vy: Math.sin(angle + off) * 4 * speedMult * (bs.leverActive ? 1.2 : 1),
        radius: 5, lifetime: 0,
      });
    }
  }
}

function updateSisters(p, b, speedMult, bossStatus) {
  const bs = state.bossState;
  if (b.hp <= 60 && b.phase === 1) {
    b.phase = 2;
    bs.sisterSwapTimer = 600;
    state.visualEffects.push({ x: b.x, y: b.y, radius: 16, alpha: 0.9, color: '#a855f7', shadowColor: '#7e22ce' });
  }
  bs.sisterSwapTimer--;
  if (bs.sisterSwapTimer <= 0) {
    bs.sisterElite = bs.sisterElite === 'blade' ? 'gun' : 'blade';
    bs.sisterSwapTimer = b.phase === 2 ? 600 : 900;
    state.visualEffects.push({ x: p.x, y: p.y, radius: 14, alpha: 0.8, color: '#ec4899', shadowColor: '#db2777' });
  }
  for (const enemy of state.enemies) {
    if (!enemy.isBossPart || enemy.hp <= 0) continue;
    if (enemy.bossPartKey === 'blade') {
      const isActive = bs.sisterElite === 'blade';
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      if (isActive) {
        const spd = dist < 100 ? 5 : 2.5;
        const mx = Math.cos(a) * spd;
        const my = Math.sin(a) * spd;
        const enx = enemy.x + mx;
        const eny = enemy.y + my;
        if (!isBlockedByObstacle(enx, eny, enemy.radius) && state.rooms.some(r => enx >= r.x + enemy.radius && enx <= r.x + r.w - enemy.radius && eny >= r.y + enemy.radius && eny <= r.y + r.h - enemy.radius)) {
          enemy.x = enx; enemy.y = eny;
        }
        if (dist < p.radius + enemy.radius + 10 && p.invulnerable === 0 && bossStatus.canAttack) {
          const dmg = p.armor > 0 ? 0 : 1;
          if (p.armor > 0) { p.armor = 0; p.armorTimer = 0; }
          if (p.characterId === 'roxanne' && dmg > 0) {
            procRoxanneBlackjack(state);
            if (Math.random() < 0.2) applyStatus(p, 'bleed', 300);
          }
          p.hp -= dmg; p.hp = Math.max(0, p.hp);
          p.invulnerable = 60;
          state.visualEffects.push({ x: p.x, y: p.y, radius: 7, alpha: 0.8, color: '#ef4444', shadowColor: '#dc2626' });
          if (p.hp <= 0) document.getElementById('game-over-screen').style.display = 'flex';
        }
      } else {
        const retreatX = enemy.x - Math.cos(a) * 1.5;
        const retreatY = enemy.y - Math.sin(a) * 1.5;
        if (!isBlockedByObstacle(retreatX, retreatY, enemy.radius)) { enemy.x = retreatX; enemy.y = retreatY; }
      }
    } else if (enemy.bossPartKey === 'gun') {
      const isActive = bs.sisterElite === 'gun';
      if (isActive) {
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        const a = Math.atan2(dy, dx);
        const spd = 3;
        const mx = Math.cos(a) * spd;
        const my = Math.sin(a) * spd;
        const enx = enemy.x + mx;
        const eny = enemy.y + my;
        if (!isBlockedByObstacle(enx, eny, enemy.radius) && state.rooms.some(r => enx >= r.x + enemy.radius && enx <= r.x + r.w - enemy.radius && eny >= r.y + enemy.radius && eny <= r.y + r.h - enemy.radius)) {
          enemy.x = enx; enemy.y = eny;
        }
        if (dist < p.radius + enemy.radius + 10 && p.invulnerable === 0 && bossStatus.canAttack) {
          const dmg = p.armor > 0 ? 0 : 1;
          if (p.armor > 0) { p.armor = 0; p.armorTimer = 0; }
          p.hp -= dmg; p.hp = Math.max(0, p.hp);
          p.invulnerable = 60;
          state.visualEffects.push({ x: p.x, y: p.y, radius: 7, alpha: 0.8, color: '#ef4444', shadowColor: '#dc2626' });
          if (p.hp <= 0) document.getElementById('game-over-screen').style.display = 'flex';
        }
      } else {
        if (enemy.cooldown > 0) { enemy.cooldown--; continue; }
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        if (Math.hypot(dx, dy) > 500) continue;
        const a = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          state.enemyProjectiles.push({
            x: enemy.x, y: enemy.y,
            vx: Math.cos(a + i * 0.2) * 3.5 * speedMult,
            vy: Math.sin(a + i * 0.2) * 3.5 * speedMult,
            radius: 4, lifetime: 0,
          });
        }
        if (Math.random() < 0.3) {
          const sx = enemy.x + (Math.random() - 0.5) * 200;
          const sy = enemy.y + (Math.random() - 0.5) * 200;
          state.obstacles.push({ type: 'pillar', x: sx, y: sy, r: 30, isSmoke: true });
          state.visualEffects.push({ x: sx, y: sy, radius: 20, alpha: 0.4, color: '#9ca3af', shadowColor: '#6b7280' });
        }
        enemy.cooldown = 90;
      }
    }
  }
}

function updateCenturion(p, b, speedMult, bossStatus) {
  const bSpeed = b.speed * bossStatus.speedMult;
  const angle = Math.atan2(p.y - b.y, p.x - b.x);
  const dist = Math.hypot(p.x - b.x, p.y - b.y);
  if (dist > 0 && bossStatus.canAttack) {
    b.x += Math.cos(angle) * bSpeed;
    b.y += Math.sin(angle) * bSpeed;
  }
  if (!bossStatus.canAttack) return;
  if (b.hp <= 100 && b.phase === 1) {
    b.phase = 2;
    b.speed = b.phase2Speed ?? 1.5;
    state.visualEffects.push({ x: b.x, y: b.y, radius: 20, alpha: 0.9, color: '#ef4444', shadowColor: '#dc2626' });
    const bs = state.bossState;
    const positions = [
      { x: 1200, y: 1200, w: 40, h: 600 },
      { x: 1760, y: 1200, w: 40, h: 600 },
      { x: 1200, y: 1200, w: 600, h: 40 },
      { x: 1200, y: 1760, w: 600, h: 40 },
    ];
    for (const pos of positions) {
      const wall = { ...pos, type: 'crate', isLockdown: true };
      state.obstacles.push(wall);
      bs.lockdownWalls.push(wall);
    }
  }
  const bs = state.bossState;
  if (b.phase === 2) {
    if (bs.beamTelegraph) {
      bs.beamTelegraph.timer--;
      if (bs.beamTelegraph.timer <= 0) {
        const dir = bs.beamTelegraph.angle;
        for (let i = -1; i <= 1; i++) {
          const off = i * 30;
          const perpAngle = dir + Math.PI / 2;
          state.enemyProjectiles.push({
            x: b.x + Math.cos(perpAngle) * off,
            y: b.y + Math.sin(perpAngle) * off,
            vx: Math.cos(dir) * 6 * speedMult,
            vy: Math.sin(dir) * 6 * speedMult,
            radius: 6, lifetime: 0,
          });
        }
        bs.beamTelegraph = null;
      }
    }
  }
  b.attackTimer++;
  const fireRate = b.phase === 2 ? 80 : 120;
  if (b.attackTimer >= fireRate) {
    b.attackTimer = 0;
    if (b.phase === 2) {
      const beamAngle = angle;
      bs.beamTelegraph = { angle: beamAngle, timer: 60 };
      state.visualEffects.push({ x: b.x, y: b.y, radius: 8, alpha: 0.9, color: '#ef4444', shadowColor: '#dc2626' });
    } else {
      state.enemyProjectiles.push({
        x: b.x, y: b.y,
        vx: Math.cos(angle) * 4 * speedMult,
        vy: Math.sin(angle) * 4 * speedMult,
        radius: 5, lifetime: 0,
      });
    }
  }
}

function updateAurelia(p, b, speedMult, bossStatus) {
  const bSpeed = b.speed * bossStatus.speedMult;
  const angle = Math.atan2(p.y - b.y, p.x - b.x);
  const dist = Math.hypot(p.x - b.x, p.y - b.y);
  if (dist > 0 && bossStatus.canAttack) {
    b.x += Math.cos(angle) * bSpeed;
    b.y += Math.sin(angle) * bSpeed;
  }
  if (!bossStatus.canAttack) return;
  if (b.hp <= 125 && b.phase === 1) {
    b.phase = 2;
    b.speed = b.phase2Speed ?? 2.0;
  }
  const bs = state.bossState;
  const cloneInterval = b.phase === 2 ? 360 : 480;
  b.attackTimer++;
  if (b.attackTimer >= cloneInterval) {
    b.attackTimer = 0;
    const count = b.phase === 2 ? 3 : 2;
    bs.clones = [];
    for (let i = 0; i < count; i++) {
      const cx = 1200 + Math.random() * 600;
      const cy = 1200 + Math.random() * 600;
      bs.clones.push({ x: cx, y: cy, hp: 1, radius: 20 });
    }
    bs.realGlow = 120;
    state.visualEffects.push({ x: b.x, y: b.y, radius: 16, alpha: 0.8, color: '#a855f7', shadowColor: '#7e22ce' });
  }
  if (bs.realGlow > 0) bs.realGlow--;
  for (let i = bs.clones.length - 1; i >= 0; i--) {
    const clone = bs.clones[i];
    const dx = p.x - clone.x;
    const dy = p.y - clone.y;
    const d = Math.hypot(dx, dy);
    if (d > 0) {
      clone.x += (dx / d) * 1.2;
      clone.y += (dy / d) * 1.2;
    }
    const hits = state.projectiles.filter(proj => Math.hypot(proj.x - clone.x, proj.y - clone.y) < 28);
    if (hits.length > 0) {
      clone.hp -= hits.length;
    }
    if (clone.hp <= 0) {
      bs.clones.splice(i, 1);
      state.visualEffects.push({ x: clone.x, y: clone.y, radius: 10, alpha: 0.7, color: '#a855f7', shadowColor: '#7e22ce' });
    }
  }
}

function updateMidas(p, b, speedMult, bossStatus) {
  const bSpeed = b.speed * bossStatus.speedMult;
  const angle = Math.atan2(p.y - b.y, p.x - b.x);
  const dist = Math.hypot(p.x - b.x, p.y - b.y);
  if (dist > 0 && bossStatus.canAttack) {
    b.x += Math.cos(angle) * bSpeed;
    b.y += Math.sin(angle) * bSpeed;
  }
  if (!bossStatus.canAttack) return;
  if (b.hp <= 250 && b.phase === 1) {
    b.phase = 2;
    b.speed = b.phase2Speed ?? 2.5;
    state.bossState.midasPhase = 2;
    state.visualEffects.push({ x: b.x, y: b.y, radius: 24, alpha: 1, color: '#a855f7', shadowColor: '#7e22ce' });
  }
  b.attackTimer++;
  if (b.phase === 1 && b.attackTimer >= 60) {
    b.attackTimer = 0;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + angle * 0.3;
      state.enemyProjectiles.push({
        x: b.x, y: b.y,
        vx: Math.cos(a) * 5 * speedMult,
        vy: Math.sin(a) * 5 * speedMult,
        radius: 4, lifetime: 0,
      });
    }
  } else if (b.phase === 2 && b.attackTimer >= 90) {
    b.attackTimer = 0;
    const statuses = ['burn', 'slow', 'blind', 'bleed'];
    for (let i = -1; i <= 1; i++) {
      const pAngle = angle + i * 0.25;
      const proj = {
        x: b.x, y: b.y,
        vx: Math.cos(pAngle) * 4 * speedMult,
        vy: Math.sin(pAngle) * 4 * speedMult,
        radius: 5, lifetime: 0,
        applyStatusOnHit: statuses[Math.floor(Math.random() * statuses.length)],
      };
      state.enemyProjectiles.push(proj);
    }
  }
}

export function updateEnemies(playerSpeedMult = 1.0) {
  const p = state.player;

  if (state.boss && state.gameState === 'playing') {
    const b = state.boss;
    const bossStatus = tickStatusEffects(b);
    if (b.flashTimer > 0) b.flashTimer--;

    switch (b.mechanic) {
      case 'overtime':       updatePitboss(p, b, playerSpeedMult, bossStatus); break;
      case 'syncopated_bet': updateSisters(p, b, playerSpeedMult, bossStatus); break;
      case 'lockdown':       updateCenturion(p, b, playerSpeedMult, bossStatus); break;
      case 'vanitys_mirror': updateAurelia(p, b, playerSpeedMult, bossStatus); break;
      case 'double_down':    updateMidas(p, b, playerSpeedMult, bossStatus); break;
      default: break;
    }

    for (const proj of state.enemyProjectiles) {
      if (proj.applyStatusOnHit && Math.hypot(proj.x - p.x, proj.y - p.y) < p.radius + 5) {
        applyStatus(p, proj.applyStatusOnHit, 120);
      }
    }

    return;
  }

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.isBossPart) continue;

    const isMoving = enemy.vx !== 0 || enemy.vy !== 0;
    const statusResult = tickStatusEffects(enemy, isMoving);
    const eSpeed = enemy.speed * statusResult.speedMult;
    const canAct = statusResult.canAttack;

    if (enemy.type === 'melee') {
      if (enemy.attackCooldown > 0) enemy.attackCooldown--;

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const moveX = Math.cos(angle) * eSpeed;
      const moveY = Math.sin(angle) * eSpeed;

      const enx = enemy.x + moveX;
      const eny = enemy.y + moveY;
      const eRadius = enemy.radius || 20;

      const isValid = (x, y) => !isBlockedByObstacle(x, y, eRadius) && state.rooms.some(r => x >= r.x + eRadius && x <= r.x + r.w - eRadius && y >= r.y + eRadius && y <= r.y + r.h - eRadius);

      if (isValid(enx, eny)) { enemy.x = enx; enemy.y = eny; }
      else if (isValid(enx, enemy.y)) { enemy.x = enx; }
      else if (isValid(enemy.x, eny)) { enemy.y = eny; }

      enemy.attackReady = enemy.attackCooldown === 0 && dist < p.radius + eRadius + 10;

      if (dist < p.radius + eRadius && p.invulnerable === 0 && canAct && enemy.attackCooldown === 0) {
        const dmg = p.armor > 0 ? 0 : 1;
        if (p.armor > 0) { p.armor = 0; p.armorTimer = 0; }

        if (p.characterId === 'roxanne' && dmg > 0) {
          procRoxanneBlackjack(state);
          if (Math.random() < 0.2) {
            applyStatus(p, 'bleed', 300);
          }
        }

        p.hp -= dmg;
        p.hp = Math.max(0, p.hp);
        p.invulnerable = 60;
        enemy.attackCooldown = 45 + Math.floor(Math.random() * 30);
        state.visualEffects.push({ x: p.x, y: p.y, radius: 7, alpha: 0.8, color: '#ef4444', shadowColor: '#dc2626' });
        if (p.hp <= 0) document.getElementById('game-over-screen').style.display = 'flex';

        const kbForce = 25;
        const kbx = p.x + Math.cos(angle) * kbForce;
        const kby = p.y + Math.sin(angle) * kbForce;
        const isValidP = (x, y) => state.rooms.some(r => x >= r.x + p.radius && x <= r.x + r.w - p.radius && y >= r.y + p.radius && y <= r.y + r.h - p.radius);
        if (isValidP(kbx, kby)) { p.x = kbx; p.y = kby; }
        else if (isValidP(kbx, p.y)) { p.x = kbx; }
        else if (isValidP(p.x, kby)) { p.y = kby; }
        else {
          const hx = p.x + Math.cos(angle) * 12;
          const hy = p.y + Math.sin(angle) * 12;
          if (isValidP(hx, hy)) { p.x = hx; p.y = hy; }
        }
      }
    } else if (enemy.type === 'ranged' && canAct) {
      if (enemy.cooldown > 0) { enemy.cooldown--; continue; }
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      if (Math.hypot(dx, dy) < 500) {
        const angle = Math.atan2(dy, dx);
        state.enemyProjectiles.push({
          x: enemy.x, y: enemy.y,
          vx: Math.cos(angle) * 4 * playerSpeedMult,
          vy: Math.sin(angle) * 4 * playerSpeedMult,
          radius: 4, lifetime: 0,
        });
        state.visualEffects.push({
          x: enemy.x + Math.cos(angle) * 20,
          y: enemy.y + Math.sin(angle) * 20,
          radius: 4, alpha: 0.7, color: '#f43f5e', shadowColor: '#e11d48'
        });
        enemy.cooldown = 120;
      }
    }
  }
}
