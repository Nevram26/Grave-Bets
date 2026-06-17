export function processProjectileHit(enemy, state, damage = 1) {
  if (state.player.relics.includes('hollow_point')) {
    damage += 1;
  }

  enemy.hp -= damage;

  if (enemy.hp <= 0) {
    let gold = Math.floor(Math.random() * 11) + 5;
    if (state.player.relics.includes('blood_money')) {
      gold = Math.floor(gold * 1.5);
    }
    state.player.gold += gold;

    const idx = state.enemies.indexOf(enemy);
    if (idx !== -1) state.enemies.splice(idx, 1);

    return {
      killed: true,
      message: `\uD83D\uDCA5 Enemy destroyed! +${gold} Gold!`,
    };
  }

  return {
    killed: false,
    message: `\uD83D\uDCA5 Hit! Enemy HP: ${enemy.hp}`,
  };
}
