# **Project Development Plan: Grave Bets**

**Document Type:** Master Game Design &amp; Architecture Plan  

**Project Genre:** 2D Grid-Based Roguelike / Strategy  

**Core Concept:** A synthesis of dark fantasy dungeon crawling and high-stakes casino gambling mechanics, where combat resolution, progression, and narrative are intrinsically tied to risk-reward probability systems.

---

## **1. Project Overview &amp; Core Gameplay Loop**

The project will operate on a 2D tile-based grid system. The core gameplay loop centers on strategic positioning and resource management, with combat resolved through a physical, on-screen dice-rolling mechanic.

*   **Combat Resolution (Dice Combat):** Standard attacks are executed via a six-sided die (D6) roll upon initiating contact with an enemy tile.

    *   **Success State (Roll 4, 5, or 6):** The enemy is defeated and yields currency.

    *   **Failure State (Roll 1, 2, or 3):** The enemy survives, and the player incurs health damage.

*   **Probability Manipulation (The "Nudge"):** To mitigate pure RNG, the system calculates the player's overarching "Luck" stat during a failure state. If triggered, the game physically nudges the on-screen die to flip a failing number into a winning number.

*   **The Sunk-Cost Chest System:** Loot distribution relies on an escalating risk model. Players pay a base fee to open a chest. If the output is undesirable, the player may re-spin the outcome; however, the currency cost doubles with each consecutive attempt.

---

## **2. Economic Architecture**

The game utilizes a dual-currency framework to separate in-run survival from long-term meta-progression.

| Currency Type | Acquisition Method | System Functionality | Retention Rules |

| :--- | :--- | :--- | :--- |

| **Gold** | Standard enemy drops. | Funds run-specific purchases (shops, chest spins, floor tolls). | Entirely purged from inventory upon player death. |

| **Soul Chips** | Elite enemy and Boss drops. | Funds meta-progression (character unlocks, global system upgrades like the "Re-Spin"). | Permanently retained across all game sessions. |

---

## **3. Statistical Framework**

Standard RPG statistics are translated into casino-themed metrics. These stats directly govern combat mathematics, ability triggers, and environmental interactions.

*   **Vitality (VIT):** Determines Maximum Health Points. It functions as a secondary, desperate currency for "Blood Bargain" events.

*   **Power (PWR):** Establishes base damage output and acts as the mathematical multiplier for successful rolls and jackpot mechanics.

*   **Armor (ARM):** Provides flat damage reduction. This is a critical metric for characters utilizing self-damaging abilities.

*   **Speed (SPD):** Governs grid turn order. High-speed values permit multiple grid movements per single enemy action.

*   **Juice (JCE):** Replaces standard mana. It does not regenerate passively; it is exclusively refilled by winning wagers, defeating enemies, or triggering jackpots.

*   **Luck (LCK):** The primary engine variable. It dictates global drop rates, critical strike probabilities, and the activation frequency of the "Nudge" mechanic.

---

## **4. Character Roster &amp; Ability Toolkits**

The project requires the development of five distinct player characters, each engineered with unique loadouts, passive traits, and active ("Juice") abilities.

### **"Lucky" Luciano Cross (The Gunslinger)**

*   **Weapon:** *The High Roller’s Handcannon* (Roulette-styled revolver featuring Red incendiary, Black armor-piercing, and Green shielding rounds).

*   **Passive (The House Edge):** Black rounds sequentially boost critical hit chance; Red rounds sequentially boost movement speed.

*   **Active (Russian Roulette):** Guarantees a defensive "Green 00" shield deployment and reloads the weapon entirely with explosive Red rounds.

### **Lady Valerie "Val" Fontaine (The Tactician)**

*   **Weapon:** *The Card Sharp’s Guillotine* (Monomolecular playing cards controlled via micro-filaments).

*   **Passive (Counting Cards):** Forces every 5th attack to draw a Joker, applying chaotic status effects. Executing enemies with a "Royal Flush" sequence refunds ability cooldowns.

*   **Active (Ante Up):** Deploys a kinetic singularity that clusters enemies, trapping them within a physical card barrier for area-of-effect damage.

### **"Buster" Malone (The Brawler)**

*   **Weapon:** *Jackpot* (An industrial slot-machine gauntlet that rolls outcomes—Cherries, Diamonds, 7-7-7, or a Bust—on impact).

*   **Passive (Comped Meals):** Converts specific jackpot outputs into temporary shielding. Sustaining self-inflicted damage from a "Bust" roll purges all negative status effects.

*   **Active (Max Bet):** Engages a hyper-spin state, doubling attack speed and escalating jackpot probabilities by 40%.

### **Silas "The Sinker" Vance (The Berserker)**

*   **Weapon:** *The Snake-Eyes Flail* (A heavy chain tethered to two massive, volatile dice).

*   **Passive (Gambler's Fallacy):** Rolling numerically low values generates a cumulative, stacking damage multiplier for the subsequent successful hit.

*   **Active (Loaded Dice):** Forces a self-inflicted "Snake Eyes" roll. The resulting self-damage activates a high-velocity movement charge.

### **Madam Roxanne "The Dealer" Vance (The Tank)**

*   **Weapon:** *The Double-Down Aegis* (A greatshield tracking absorbed kinetic energy on a digital 1 to 21 scale).

*   **Passive (Insurance Policy):** Intercepts fatal damage intended for allies, converting the absorbed kinetic force into +5 points on her shield counter.

*   **Active (Double Down):** Anchors the shield to double energy absorption rates. Reaching exactly 21 discharges a true-damage stun wave; exceeding 21 triggers an overheating smoke screen.

---

## **5. Relic &amp; Itemization Strategy**

Loot is categorized into four distinct tiers, designed to incentivize risk-taking and fundamentally alter the player's strategic approach during a run.

1.  **Tier 1: Passive Synergies (The Grinders):** Baseline modifiers. *Example: Card Counting (Every 13th attack triggers a localized explosion).*

2.  **Tier 2: Triggers &amp; Procs (The Table Games):** Probability-based combat alterations. *Example: Split Hand (Projectiles possess a 15% chance to duplicate; landing both refunds 1 Gold).*

3.  **Tier 3: Cursed Relics (The High Rollers):** Severe stat modifications with extreme detriments. *Example: Snake Eyes Aura (Significantly raises minimum damage output but severely caps maximum damage, removing combat RNG).*

4.  **Tier 4: Room Modifiers:** Meta-run alterations. *Example: Line of Credit (Permits purchasing items with 0 Gold, dropping the balance into the negative. Negative balances apply a global incoming damage multiplier).*

---

## **6. Dynamic Environmental Interactions**

The system incorporates interactive map elements designed to give the player actionable agency over the RNG framework, converting frustration into strategic decision-making.

*   **The Fountain of Misfortune:** A programmatic "pity timer." The system tracks sequential player failures (missed dodges, failed rolls). The player may purge this internal counter at a fountain to receive a permanent Luck buff, or gamble Gold for randomized outputs.

*   **The Neon Dealer’s Side-Bet:** A mid-run encounter that halts combat. The system issues a localized constraint (e.g., "Sustain zero damage during this encounter"). Success yields a high-value Luck increase; failure permanently buffs the enemy unit and penalizes the player.

*   **The Slot Machine Shakedown:** A desperation mechanic. A player may elect to permanently sacrifice 15% of their Maximum HP to forcefully dismantle an interactive slot machine asset, securing a guaranteed Luck stat increase.

---

## **7. Level Design &amp; Progression Path**

The world architecture utilizes a node-based, branching map layout, requiring players to chart their progression and calculate risks between floors.

*   **The Penny Slots:** Standard encounter nodes.

*   **The VIP Tables:** Elite encounter nodes featuring high-threat mini-bosses ("Bouncers") that guarantee Soul Chip drops.

*   **The Vault:** Vendor nodes for currency expenditure and Line of Credit generation.

*   **The Lounge:** Safe zone nodes designated for health regeneration and weapon upgrading.

*   **The Penthouse:** The mandatory floor terminus. Players must remit a substantial Gold toll to the "Pitboss" or face a high-difficulty punitive combat encounter.

---

## **8. Meta-Progression Architecture (The Executive Lounge)**

The system employs a permanent meta-progression hub, "The Executive Lounge" (Main Menu), where players spend accumulated Soul Chips. This structure mitigates the penalty of death by ensuring incremental global strengthening and mechanical unlocks over multiple runs. Progression is divided into three distinct skill trees:

### **Tree 1: The Roster (Character Unlocks)**

Players begin with a baseline character ("Lucky" Luciano Cross). Alternate characters with highly specialized mechanics are unlocked progressively via Soul Chip expenditure.

*   **Lady Val (The Tactician):** 50 Soul Chips

*   **"Buster" Malone (The Brawler):** 100 Soul Chips

*   **Silas Vance (The Berserker):** 150 Soul Chips

*   **Madam Roxanne (The Tank):** 250 Soul Chips

### **Tree 2: House Rules (Global Account Upgrades)**

Permanent passive modifiers applied globally to all characters. Costs scale exponentially per tier.

*   **Sleight of Hand:** Mechanically unlocks the ability to re-spin Slot Machine Chests during a run.

*   **Golden Parachute:** Grants a fixed starting pool of Gold at the inception of a run (Upgradable).

*   **Loaded Dice:** Permanently increases the baseline Luck (LCK) stat of all characters (High cost, strict cap).

*   **Loyalty Program:** Applies a permanent percentage discount to all items purchased within "The Vault" nodes.

*   **Thick Skin:** Grants a permanent flat bonus to base Armor (ARM).

### **Tree 3: Casino Expansion (Systemic Map Unlocks)**

To prevent initial mechanic overload, advanced map nodes and dynamic events are initially withheld from the generation pool. Players use Soul Chips to "construct" these additions, expanding the procedural generation matrix.

*   **Construct The Fountain:** Adds the *Fountain of Misfortune* nodes to the map generation pool.

*   **Hire Hologram Dealers:** Enables the *Neon Dealer Side-Bet* events to trigger prior to Boss encounters.

*   **Open the Back Alley:** Integrates text-based narrative mystery nodes into the map.

*   **VIP Access:** Unlocks extreme-threat *Bouncer* nodes, providing access to guaranteed Relic drops.

---

## **9. Endgame Sequence &amp; Narrative Loop**

The narrative design operates as a meta-commentary on the roguelike genre, culminating in a three-phase sequence that justifies the replayability loop.

### **The Final Encounter: Midas Vance, The Grand Dealer**

*   **Phase 1 (Table Stakes):** Bullet-hell parameters. The player must intentionally absorb specific projectile values to avoid mathematically hitting exactly 21 or exceeding it.

*   **Phase 2 (The Roulette Grid):** Environmental puzzle parameters. The system designates shifting Red and Black floor tiles, requiring continuous repositioning to avoid vertical laser strikes.

*   **Phase 3 (The All-In):** The boss entity merges with the systemic core, generating randomized status-effect barrages.

### **The True Core (The Chrono-Matrix)**

Upon defeating the final boss, the system reveals the "Chrono-Matrix," the underlying engine powering the game's economy by harvesting the probability energy of fallen players. The player is presented with a terminal binary choice:

1.  **The Safe Bet (Standard Victory):** The player permanently deactivates the matrix. This executes the standard game-ending sequence, returning the narrative to equilibrium.

2.  **Let It Ride (New Game+ Initialization):** The player interfaces with the matrix, expending all accumulated Luck variables to systematically re-roll the universe. This choice functions as the architectural trigger for Ascension/Covenant difficulties, increasing enemy scaling and reward outputs for all subsequent runs, positioning the player as the new overarching antagonist.