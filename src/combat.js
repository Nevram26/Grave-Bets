import { getSuitMultiplier, applyStatus } from './suits.js';
import { updateUI, addLog } from './hud.js';
import { saveData, clearAllRuns } from './storage.js';

export function procRoxanneBlackjack(state, logBust = true) {
  const p = state.player;
  const qs = p.quirkState;
  if (!qs.blackjack) qs.blackjack = 0;
  let gain = Math.ceil(Math.random() * 10);
  if (qs.roxanneDoubleDown > 0) gain *= 2;
  qs.blackjack += gain;
  if (qs.blackjack >= 21) {
    qs.blackjack = 0;
    for (const ex of state.enemies) {
      if (Math.hypot(ex.x - p.x, ex.y - p.y) < 200) {
        ex.hp -= 3;
        state.visualEffects.push({ x: ex.x, y: ex.y, radius: 10, alpha: 0.9 });
        if (ex.hp <= 0) {
          state.player.gold += Math.floor(Math.random() * 11) + 5;
          const eidx = state.enemies.indexOf(ex);
          if (eidx !== -1) state.enemies.splice(eidx, 1);
        }
      }
    }
    updateUI();
  } else if (qs.blackjack > 21) {
    qs.blackjack = 0;
    qs.bustTimer = 180;
    if (logBust) addLog('BLACKJACK BUST! Silenced for 3s.', 'lose');
  }
}

export function meleeKill(target, state, dmg, msg) {
  if (target === state.boss) { defeatBoss(state); return; }
  target.hp -= dmg;
  if (target.hp <= 0) {
    state.player.gold += Math.floor(Math.random() * 11) + 5;
    const idx = state.enemies.indexOf(target);
    if (idx !== -1) state.enemies.splice(idx, 1);
    addLog(`\uD83D\uDCA5 ${msg} Enemy destroyed!`, 'win');
  } else {
    addLog(`\uD83D\uDCA5 ${msg} Enemy HP: ${target.hp}`, 'info');
  }
}

export function defeatBoss(state) {
  const boss = state.boss;
  if (!boss) return;
  const goldReward = 50 + Math.floor(Math.random() * 51);
  state.player.gold += goldReward;
  const cashChips = Math.floor(state.player.gold / 10);
  state.runSoulChips += cashChips;
  state.meta.soulChips += state.runSoulChips;
  addLog('\u{1F451} BOSS DEFEATED!', 'win');
  state.visualEffects.push({ x: boss.x, y: boss.y, radius: 20, alpha: 0.9 });
  state.boss = null;
  state.gameState = 'victory';
  const display = document.getElementById('victory-cash-out-display');
  if (cashChips > 0 || state.runSoulChips > 0) {
    display.textContent = `Cashed out ${state.player.gold} Gold for ${cashChips} Chips! Total this run: ${state.runSoulChips} \u{1FADB}`;
  } else {
    display.textContent = `\u{1FADB} ${state.runSoulChips} Soul Chips this run`;
  }
  saveData(state);
  clearAllRuns();
  document.getElementById('victory-screen').style.display = 'flex';
}

export function processProjectileHit(enemy, state, damage = 1, projectile) {
  const p = state.player;

  if (p.relics.includes('hollow_point')) {
    damage += 1;
  }

  const suit = projectile?.suit || p.suit;
  const mult = getSuitMultiplier(suit, enemy.suit);
  damage = Math.ceil(damage * mult);

  if (mult !== 1.0) {
    const msg = mult > 1 ? 'ADVANTAGE!' : 'DISADVANTAGE!';
  }

  if (p.characterId === 'valerie') {
    p.shotCount = (p.shotCount || 0) + 1;
    if (p.shotCount % 5 === 0) {
      damage += 2;
    }
  }

  if (projectile?.applyStatus) {
    applyStatus(enemy, projectile.applyStatus, 180);
  }

  enemy.hp -= damage;

  if (enemy.hp <= 0) {
    let gold = Math.floor(Math.random() * 11) + 5;
    if (p.relics.includes('blood_money')) {
      gold = Math.floor(gold * 1.5);
    }
    p.gold += gold;

    const idx = state.enemies.indexOf(enemy);
    if (idx !== -1) state.enemies.splice(idx, 1);

    return {
      killed: true,
      message: `\uD83D\uDCA5 Enemy destroyed! +${gold} Gold!`,
      multiplier: mult,
    };
  }

  return {
    killed: false,
    message: `\uD83D\uDCA5 Hit! Enemy HP: ${enemy.hp}`,
    multiplier: mult,
  };
}
