import { state } from './state.js';
import { onNodeClick, renderMapUI } from './ui.js';
import { handleInteract } from './rooms.js';

const canvas = document.getElementById('gameCanvas');

export const keys = {};

export function setupInput() {
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    keys[e.code] = true;

    if (e.key === 'e' || e.key === 'E') handleInteract();

    if (e.key === 'Tab') {
      e.preventDefault();
      const mapScreen = document.getElementById('map-screen');
      if (mapScreen.style.display !== 'none') {
        mapScreen.style.display = 'none';
      } else {
        renderMapUI();
      }
    }

    if (e.key === 'Escape') {
      document.getElementById('map-screen').style.display = 'none';
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
      p.dashCooldown = 50;
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
    const angle = Math.atan2(state.mouse.worldY - p.y, state.mouse.worldX - p.x);
    const greenChance = p.relics.includes('seven_up') ? 12 : 5;
    const roll = Math.random() * 100;
    let roundType;
    if (roll < greenChance) roundType = 'green';
    else if (roll < 52) roundType = 'red';
    else roundType = 'black';
    if (roundType !== 'green' && Math.random() * 100 < p.stats.LCK * 5) {
      roundType = Math.random() < 0.5 ? 'black' : 'green';
    }
    if (roundType === 'green') {
      p.armor = 1;
      p.armorTimer = 120;
      return;
    }
    const projSpeed = p.relics.includes('bullet_time') ? 12 : 10;
    state.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(angle) * projSpeed, vy: Math.sin(angle) * projSpeed, radius: 4, lifetime: 0, roundType });
    if (p.relics.includes('split_hand')) {
      state.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(angle + 0.26) * projSpeed, vy: Math.sin(angle + 0.26) * projSpeed, radius: 4, lifetime: 0, roundType });
    }
  });

  const svg = document.getElementById('map-svg');
  svg.addEventListener('click', onNodeClick);

  document.getElementById('map-screen').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
  });
}
