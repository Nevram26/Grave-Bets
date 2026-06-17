import { state } from './state.js';
import { RELICS } from './relics.js';

export function updateUI() {
  const healthDisplay = document.getElementById('healthDisplay');
  const goldDisplay = document.getElementById('goldDisplay');
  const armorDisplay = document.getElementById('armorDisplay');
  const bossUI = document.getElementById('boss-ui');
  const bossHealthFill = document.getElementById('boss-health-fill');
  const relicDisplay = document.getElementById('relic-display');

  healthDisplay.textContent = `\u2764\uFE0F Health: ${state.player.hp}/${state.player.maxHp}`;
  goldDisplay.textContent = `\u{1F4B0} Gold: ${state.player.gold}`;
  if (state.player.armor > 0 && state.player.armorTimer > 0) {
    armorDisplay.textContent = `\uD83D\uDEE1\uFE0F Armor: ${state.player.armor}`;
    armorDisplay.style.display = '';
  } else {
    armorDisplay.style.display = 'none';
  }
  if (state.boss) {
    bossUI.style.display = '';
    bossHealthFill.style.width = `${Math.max(0, (state.boss.hp / state.boss.maxHp) * 100)}%`;
  } else {
    bossUI.style.display = 'none';
  }
  relicDisplay.textContent = state.player.relics.map(id => { const r = RELICS.find(x => x.id === id); return r ? r.emoji : ''; }).join('');
}

export function addLog(message, className = 'info') {
  state.log.push(message);
  const actionLog = document.getElementById('actionLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${className}`;
  entry.textContent = message;
  actionLog.appendChild(entry);
  actionLog.scrollTop = actionLog.scrollHeight;
}
