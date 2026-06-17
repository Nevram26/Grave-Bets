import { state } from './state.js';

export function updateProjectiles() {
  const p = state.player;

  for (let i = state.enemyProjectiles.length - 1; i >= 0; i--) {
    const proj = state.enemyProjectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.lifetime++;

    const dx = p.x - proj.x;
    const dy = p.y - proj.y;
    if (Math.hypot(dx, dy) < p.radius + proj.radius) {
      if (p.invulnerable === 0) {
        const dmg = p.armor > 0 ? 0 : 1;
        if (p.armor > 0) { p.armor = 0; p.armorTimer = 0; }
        p.hp -= dmg;
        p.hp = Math.max(0, p.hp);
        p.invulnerable = 60;
        if (p.hp <= 0) document.getElementById('game-over-screen').style.display = 'flex';
      }
      state.enemyProjectiles.splice(i, 1);
      continue;
    }

    if (proj.lifetime > 120 || proj.x < 0 || proj.x > state.world.width || proj.y < 0 || proj.y > state.world.height) {
      state.enemyProjectiles.splice(i, 1);
    }
  }

  for (let i = state.visualEffects.length - 1; i >= 0; i--) {
    const ef = state.visualEffects[i];
    ef.radius += 2;
    ef.alpha -= 0.06;
    if (ef.alpha <= 0 || ef.radius > 60) state.visualEffects.splice(i, 1);
  }
}
