import { state } from './state.js';
import { tickStatusEffects, applyStatus } from './suits.js';
import { isBlockedByObstacle } from './collision.js';
import { procRoxanneBlackjack } from './combat.js';

export function updateEnemies(playerSpeedMult = 1.0) {
  const p = state.player;

  if (state.boss && state.gameState === 'playing') {
    const b = state.boss;
    const bossStatus = tickStatusEffects(b);
    const bSpeed = b.speed * bossStatus.speedMult;

    if (b.hp <= 50 && b.phase === 1) {
      b.phase = 2;
      b.speed = 2.5;
    }

    if (b.flashTimer > 0) b.flashTimer--;

    const angle = Math.atan2(p.y - b.y, p.x - b.x);
    const dist = Math.hypot(p.x - b.x, p.y - b.y);
    if (dist > 0 && bossStatus.canAttack) {
      b.x += Math.cos(angle) * bSpeed;
      b.y += Math.sin(angle) * bSpeed;
    }

    if (bossStatus.canAttack) {
      b.attackTimer++;
      if (b.phase === 1 && b.attackTimer >= 90) {
        b.attackTimer = 0;
        for (let i = -1; i <= 1; i++) {
          state.enemyProjectiles.push({
            x: b.x, y: b.y,
            vx: Math.cos(angle + i * 0.25) * 4 * playerSpeedMult,
            vy: Math.sin(angle + i * 0.25) * 4 * playerSpeedMult,
            radius: 5, lifetime: 0,
          });
        }
      } else if (b.phase === 2 && b.attackTimer >= 60) {
        b.attackTimer = 0;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          state.enemyProjectiles.push({
            x: b.x, y: b.y,
            vx: Math.cos(a) * 4 * playerSpeedMult,
            vy: Math.sin(a) * 4 * playerSpeedMult,
            radius: 5, lifetime: 0,
          });
        }
      }
    }
    return;
  }

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;

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
