import { state } from './state.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

export function resizeCanvas() {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
}

export function draw() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 - state.camera.x, canvas.height / 2 - state.camera.y);

  const gs = 80;
  const sx = Math.floor((state.camera.x - canvas.width / 2) / gs) * gs;
  const ex = Math.ceil((state.camera.x + canvas.width / 2) / gs) * gs;
  const sy = Math.floor((state.camera.y - canvas.height / 2) / gs) * gs;
  const ey = Math.ceil((state.camera.y + canvas.height / 2) / gs) * gs;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  for (let x = sx; x < ex; x += gs) { ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, ey); ctx.stroke(); }
  for (let y = sy; y < ey; y += gs) { ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(ex, y); ctx.stroke(); }

  for (const c of state.corridors) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }

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

  ctx.font = `48px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const enemy of state.enemies) {
    ctx.fillText(enemy.emoji, enemy.x, enemy.y);
  }

  if (state.boss) {
    ctx.globalAlpha = state.boss.flashTimer > 0 ? 0.5 + Math.random() * 0.5 : 1;
    ctx.font = `72px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.boss.emoji, state.boss.x, state.boss.y);
    ctx.globalAlpha = 1;
  }

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

  if (state.shopkeeper) {
    ctx.font = `48px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.shopkeeper.emoji, state.shopkeeper.x, state.shopkeeper.y);
    ctx.font = '18px Courier New';
    ctx.fillStyle = '#60a5fa';
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 6;
    ctx.fillText('\uD83C\uDFA9 The Shopkeeper', state.shopkeeper.x, state.shopkeeper.y - 60);
    ctx.shadowBlur = 0;
  }

  for (const relic of state.shopRelics) {
    ctx.font = `48px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(relic.emoji, relic.x, relic.y);
    const dist = Math.hypot(state.player.x - relic.x, state.player.y - relic.y);
    if (dist < 80) {
      ctx.font = '16px Courier New';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 4;
      ctx.fillText(relic.name, relic.x, relic.y - 50);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px Courier New';
      ctx.fillText(relic.desc, relic.x, relic.y - 30);
      ctx.fillStyle = '#ffd700';
      ctx.font = '15px Courier New';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 4;
      ctx.fillText(`${relic.cost}G`, relic.x, relic.y + 55);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#60a5fa';
      ctx.font = '14px Courier New';
      ctx.fillText('[E] Buy', relic.x, relic.y + 75);
    }
  }

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

  for (const eff of state.visualEffects) {
    ctx.globalAlpha = eff.alpha ?? 1;
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(eff.x, eff.y, eff.radius ?? 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  if (state.player.dashGhosts && state.player.dashGhosts.length > 0) {
    for (const ghost of state.player.dashGhosts) {
      ctx.globalAlpha = ghost.alpha;
      ctx.font = `36px ${EMOJI_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.player.emoji, ghost.x, ghost.y);
      ghost.alpha -= 0.04;
    }
    ctx.globalAlpha = 1;
    state.player.dashGhosts = state.player.dashGhosts.filter(g => g.alpha > 0);
  }

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

  const angle = Math.atan2(state.mouse.worldY - state.player.y, state.mouse.worldX - state.player.x);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(state.player.x, state.player.y);
  ctx.lineTo(state.player.x + Math.cos(angle) * (state.player.radius - 2), state.player.y + Math.sin(angle) * (state.player.radius - 2));
  ctx.stroke();

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
