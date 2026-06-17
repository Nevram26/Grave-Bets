# Grave Bets

**2D Grid-Based Roguelike / Strategy** — A dark fantasy dungeon crawler fused with high-stakes casino gambling mechanics.

> This document reflects the current design direction and is open to future revisions as development progresses.

## Overview

Grave Bets is a tile-based roguelike where combat, progression, and narrative are driven by risk-reward probability systems. Engage enemies via physical D6 dice rolls, manipulate luck with the "Nudge" mechanic, and escalate loot through the Sunk-Cost Chest system.

## Features

- **Dice Combat** — Roll a D6 on enemy contact: 4-6 wins, 1-3 punishes.
- **The Nudge** — The Luck stat can physically flip a failing die to a winning face.
- **Dual Currency** — Gold (run-specific) and Soul Chips (permanent meta-progression).
- **6 Stats** — Vitality, Power, Armor, Speed, Juice (mana), Luck (core engine).
- **5 Playable Characters** — Each with unique weapons, passives, and active abilities.
- **4-Tier Loot System** — From passive synergies to room-altering relics.
- **Dynamic Map Events** — Fountains, side-bets, and desperation slot machines.
- **Branching Node Progression** — Standard floors, elite tables, shops, rest lounges, and boss payoffs.
- **Meta-Progression Hub (The Executive Lounge)** — Unlock characters, global upgrades, and map expansions via Soul Chips.
- **3-Phase Final Boss** — Midas Vance, The Grand Dealer.
- **New Game+ (Let It Ride)** — A narrative binary choice triggers ascended difficulty.

## Characters

| Character | Role | Weapon |
|-----------|------|--------|
| "Lucky" Luciano Cross | Gunslinger | The High Roller's Handcannon |
| Lady Valerie "Val" Fontaine | Tactician | The Card Sharp's Guillotine |
| "Buster" Malone | Brawler | Jackpot (slot-machine gauntlet) |
| Silas "The Sinker" Vance | Berserker | The Snake-Eyes Flail |
| Madam Roxanne "The Dealer" Vance | Tank | The Double-Down Aegis |

## Tech Stack

Built with vanilla HTML5 Canvas, CSS, and JavaScript (ES Modules).

## Development

```bash
# No build step required — open index.html in a browser
```
