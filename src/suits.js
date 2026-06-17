import { addLog } from './hud.js';

export const SUIT_WHEEL = {
  clubs: 'diamonds',
  diamonds: 'spades',
  spades: 'hearts',
  hearts: 'clubs',
};

export const SUIT_ICONS = {
  clubs: '\u2663\uFE0F',
  diamonds: '\u2666\uFE0F',
  spades: '\u2660\uFE0F',
  hearts: '\u2665\uFE0F',
};

export function getSuitMultiplier(atkSuit, defSuit) {
  if (!atkSuit || !defSuit) return 1.0;
  if (SUIT_WHEEL[atkSuit] === defSuit) return 1.5;
  if (SUIT_WHEEL[defSuit] === atkSuit) return 0.5;
  return 1.0;
}

export function applyStatus(entity, type, duration = 180) {
  if (!entity.statusEffects) entity.statusEffects = [];
  const existing = entity.statusEffects.find(s => s.type === type);
  if (existing) {
    existing.duration = Math.max(existing.duration, duration);
    return;
  }
  entity.statusEffects.push({ type, duration, tickTimer: 30 });
}

export function removeStatus(entity, type) {
  if (!entity.statusEffects) return;
  entity.statusEffects = entity.statusEffects.filter(s => s.type !== type);
}

export function hasStatus(entity, type) {
  if (!entity.statusEffects) return false;
  return entity.statusEffects.some(s => s.type === type);
}

export function tickStatusEffects(entity, isMoving = false, onBurnTick, onBleedTick) {
  if (!entity.statusEffects || entity.statusEffects.length === 0) {
    return { speedMult: 1.0, canAttack: true };
  }

  let speedMult = 1.0;
  let canAttack = true;

  for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
    const s = entity.statusEffects[i];
    s.duration--;

    if (s.duration <= 0) {
      entity.statusEffects.splice(i, 1);
      continue;
    }

    switch (s.type) {
      case 'slow':
        speedMult = Math.min(speedMult, 0.5);
        break;
      case 'stun':
        speedMult = 0;
        canAttack = false;
        break;
    }

    if (s.type === 'burn' || s.type === 'bleed') {
      const tickRate = s.type === 'bleed' && isMoving ? 15 : 30;
      s.tickTimer--;
      if (s.tickTimer <= 0) {
        s.tickTimer = tickRate;
        if (s.type === 'burn' && onBurnTick) onBurnTick(entity);
        else if (s.type === 'bleed' && onBleedTick) onBleedTick(entity);
      }
    }
  }

  return { speedMult, canAttack };
}
