import { state } from './state.js';
import { CHARACTERS } from './characters.js';
import { clearRun, getRunInfo } from './storage.js';


export function buildCharCards({ onSelectChar }) {
  const container = document.getElementById('char-cards');
  container.innerHTML = '';
  for (const char of Object.values(CHARACTERS)) {
    const card = document.createElement('div');
    const unlocked = state.meta.unlockedCharacters.includes(char.id);
    card.className = unlocked ? 'char-card' : 'char-card locked';
    card.dataset.character = char.id;
    card.innerHTML = `
      <div class="char-emoji">${unlocked ? '' : '\uD83D\uDD12 '}${char.emoji}</div>
      <div class="char-name">${char.name}</div>
      <div class="char-desc">${char.desc}</div>
      <div class="char-stats">
        <span>\u2764\uFE0F ${char.maxHp}</span>
        <span>\u2694\uFE0F ${char.stats.PWR}</span>
        <span>\uD83D\uDEE1\uFE0F ${char.stats.ARM}</span>
        <span>\uD83D\uDCA8 ${char.stats.SPD}</span>
        <span>\uD83C\uDF40 ${char.stats.LCK}</span>
      </div>
      <div class="char-ability">[E] ${char.activeName}</div>`;
    if (unlocked) card.addEventListener('click', () => onSelectChar(char.id));
    container.appendChild(card);
  }
}

export function refreshLounge(opts = {}) {
  const { onContinueSlot } = opts;
  document.getElementById('lounge-chip-count').textContent = state.meta.soulChips;
  const btns = document.querySelectorAll('#lounge-upgrades .lounge-btn');
  btns.forEach(btn => {
    const upgrade = btn.dataset.upgrade;
    btn.disabled = false;
    btn.classList.remove('owned');
    switch (upgrade) {
      case 'unlock_val': {
        if (state.meta.unlockedCharacters.includes('val')) { btn.disabled = true; btn.classList.add('owned'); btn.textContent = '\u2713 Lady Val — OWNED'; }
        else btn.disabled = state.meta.soulChips < 50;
        break;
      }
      case 'starting_gold': {
        btn.textContent = `\u{1F4B0} Bribe the Dealer: +20 Gold [15 Chips] (x${state.meta.upgrades.startingGold / 20})`;
        btn.disabled = state.meta.soulChips < 15;
        break;
      }
      case 'extra_hp': {
        btn.textContent = `\u2764\uFE0F High Roller's Health: +10 HP [25 Chips] (x${state.meta.upgrades.extraHp / 10})`;
        btn.disabled = state.meta.soulChips < 25;
        break;
      }
      case 'respin_chest': {
        const level = state.meta.upgrades.canRespinChest;
        if (level >= 3) { btn.disabled = true; btn.classList.add('owned'); btn.textContent = '\u2713 Sunk-Cost MAX (3 free re-spins)'; }
        else {
          const costs = [40, 60, 80];
          btn.textContent = `\u{1F3B2} Sunk-Cost Insurance L${level + 1}: Free Re-spins [${costs[level]} Chips]`;
          btn.disabled = state.meta.soulChips < costs[level];
        }
        break;
      }
      case 'start_relic': {
        if (state.meta.upgrades.startWithRelic) { btn.disabled = true; btn.classList.add('owned'); btn.textContent = '\u2713 Loaded Die — OWNED'; }
        else btn.disabled = state.meta.soulChips < 60;
        break;
      }
    }
  });

  const slotsContainer = document.getElementById('lounge-run-slots');
  slotsContainer.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'run-slot-card';
    const info = getRunInfo(i);
    if (info) {
      const charName = ({ luciano: 'Luciano', valerie: 'Lady Val', buster: 'Buster', silas: 'Silas', roxanne: 'Roxanne' })[info.character] || 'Unknown';
      slotDiv.classList.add('has-save');
      slotDiv.innerHTML = `
        <div class="slot-label">SLOT ${i + 1}</div>
        <div class="slot-info">${charName} \u2022 ${info.zone} \u2022 ${info.chips} \u{1FADB}</div>
        <div class="slot-actions">
          <button class="slot-continue" data-slot="${i}">Continue</button>
          <button class="slot-delete" data-slot="${i}">Delete</button>
        </div>`;
      slotDiv.querySelector('.slot-continue').addEventListener('click', () => {
        hideAllScreens();
        if (onContinueSlot) onContinueSlot(i);
      });
      slotDiv.querySelector('.slot-delete').addEventListener('click', () => {
        if (confirm(`Delete save in Slot ${i + 1}?`)) {
          clearRun(i);
          refreshLounge(opts);
        }
      });
    } else {
      slotDiv.innerHTML = `<div class="slot-label">SLOT ${i + 1}</div><div class="slot-empty">Empty</div>`;
    }
    slotsContainer.appendChild(slotDiv);
  }
}

export function hideAllScreens() {
  document.getElementById('character-select-screen').style.display = 'none';
  document.getElementById('executive-lounge-screen').style.display = 'none';
  document.getElementById('game-over-screen').style.display = 'none';
  document.getElementById('victory-screen').style.display = 'none';
  document.getElementById('pause-screen').style.display = 'none';
  document.getElementById('map-screen').style.display = 'none';
  document.getElementById('chest-panel').style.display = 'none';
}
