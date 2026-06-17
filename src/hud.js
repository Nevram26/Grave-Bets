import { state } from './state.js';
import { RELICS } from './relics.js';
import { SUIT_ICONS } from './suits.js';

export function updateUI() {
  const healthDisplay = document.getElementById('healthDisplay');
  const goldDisplay = document.getElementById('goldDisplay');
  const armorDisplay = document.getElementById('armorDisplay');
  const suitDisplay = document.getElementById('suitDisplay');
  const bossUI = document.getElementById('boss-ui');
  const bossHealthFill = document.getElementById('boss-health-fill');
  const relicDisplay = document.getElementById('relic-display');
  const charDisplay = document.getElementById('charDisplay');
  const cdContainer = document.getElementById('active-cd-container');
  const cdFill = document.getElementById('active-cd-fill');

  const p = state.player;

  if (p.characterId) {
    const charName = p.emoji + ' ' + ({
      luciano: '"Lucky" Luciano',
      valerie: 'Lady Val',
      buster: '"Buster" Malone',
      silas: 'Silas Vance',
      roxanne: 'Madam Roxanne',
    })[p.characterId] || '';
    charDisplay.textContent = charName;
  } else {
    charDisplay.textContent = '';
  }

  if (p.suit && SUIT_ICONS[p.suit]) {
    suitDisplay.textContent = `${SUIT_ICONS[p.suit]} ${p.suit.toUpperCase()}`;
    suitDisplay.style.display = '';
  } else {
    suitDisplay.style.display = 'none';
  }

  healthDisplay.textContent = `\u2764\uFE0F Health: ${p.hp}/${p.maxHp}`;
  goldDisplay.textContent = `\u{1F4B0} Gold: ${p.gold}`;
  document.getElementById('soulChipDisplay').textContent = `\u{1FADB} Chips: ${state.runSoulChips}`;
  if (p.armor > 0 && p.armorTimer > 0) {
    armorDisplay.textContent = `\uD83D\uDEE1\uFE0F Armor: ${p.armor}`;
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
  relicDisplay.textContent = p.relics.map(id => { const r = RELICS.find(x => x.id === id); return r ? r.emoji : ''; }).join('');

  if (p.activeCooldown > 0) {
    cdContainer.style.display = '';
    cdFill.style.width = `${(1 - p.activeCooldown / 600) * 100}%`;
  } else {
    cdContainer.style.display = 'none';
  }
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
