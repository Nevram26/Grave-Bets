extends Node
## GameData autoload singleton.
## Static game data: floors, themes, enemy types, boss registry.
## Full data port tracked in issue #5.

const FLOORS: Array[Dictionary] = [
	{
		"name": "The Slots",
		"boss": "Pitboss Jenkins",
		"enemyPool": ["Gambler", "Slugger"],
		"theme": "Industrial",
		"bgColor": "#1a1a2e", "borderColor": "#8b5cf6", "accentColor": "#7c3aed"
	},
	{
		"name": "The Lounge",
		"boss": "The Card-Shark Sisters",
		"enemyPool": ["Security Drone", "Socialite"],
		"theme": "Neon",
		"bgColor": "#0a0a2e", "borderColor": "#ff1493", "accentColor": "#a855f7"
	},
	{
		"name": "The Vaults",
		"boss": "Centurion 9000",
		"enemyPool": ["Auto-Turret", "Riot Bot"],
		"theme": "Polished Gold",
		"bgColor": "#0d0d00", "borderColor": "#ffd700", "accentColor": "#b8860b"
	},
	{
		"name": "The VIP Suite",
		"boss": "Madam Aurelia",
		"enemyPool": ["Cyborg Noble", "Bodyguard"],
		"theme": "Decaying Green",
		"bgColor": "#0a1208", "borderColor": "#4a6741", "accentColor": "#5c4033"
	},
	{
		"name": "The Penthouse",
		"boss": "Midas Vance",
		"enemyPool": ["Vance Cultist"],
		"theme": "Stark White",
		"bgColor": "#f0f0f0", "borderColor": "#00ffff", "accentColor": "#00bfff"
	}
]

const THEME_PALETTES: Dictionary = {
	"Industrial": { "bg": "#1a1a2e", "border": "#8b5cf6", "accent": "#7c3aed" },
	"Neon": { "bg": "#0a0a2e", "border": "#ff1493", "accent": "#a855f7" },
	"Polished Gold": { "bg": "#0d0d00", "border": "#ffd700", "accent": "#b8860b" },
	"Decaying Green": { "bg": "#0a1208", "border": "#4a6741", "accent": "#5c4033" },
	"Stark White": { "bg": "#f0f0f0", "border": "#00ffff", "accent": "#00bfff" }
}

const ENEMY_TYPES: Dictionary = {
	"Gambler": { "emoji": "🎲", "hp": 1, "speed": 2.0, "radius": 20, "type": "melee" },
	"Slugger": { "emoji": "👊", "hp": 2, "speed": 1.5, "radius": 22, "type": "melee" },
	"Security Drone": { "emoji": "🤖", "hp": 1, "speed": 0.0, "radius": 18, "type": "ranged" },
	"Socialite": { "emoji": "💃", "hp": 2, "speed": 2.5, "radius": 20, "type": "melee" },
	"Auto-Turret": { "emoji": "📡", "hp": 2, "speed": 0.0, "radius": 18, "type": "ranged" },
	"Riot Bot": { "emoji": "🤖", "hp": 3, "speed": 1.8, "radius": 24, "type": "melee" },
	"Cyborg Noble": { "emoji": "🧜", "hp": 3, "speed": 2.0, "radius": 22, "type": "melee" },
	"Bodyguard": { "emoji": "💂", "hp": 4, "speed": 1.2, "radius": 26, "type": "melee" },
	"Vance Cultist": { "emoji": "🧝", "hp": 2, "speed": 1.5, "radius": 20, "type": "melee" }
}

const BOSS_REGISTRY: Dictionary = {
	"Pitboss Jenkins": {
		"hp": 100, "maxHp": 100, "speed": 1.5, "phase2Speed": 2.5,
		"emoji": "👹", "radius": 40, "suit": "clubs",
		"mechanic": "overtime",
		"description": "A desperate enforcer obsessed with overtime."
	},
	"The Card-Shark Sisters": {
		"hp": 120, "maxHp": 120, "speed": 2.0, "phase2Speed": 3.0,
		"emoji": "💁‍♀️", "radius": 36, "suit": "spades",
		"mechanic": "syncopated_bet",
		"description": "Twin assassins, one with the blade, one with the gun."
	},
	"Centurion 9000": {
		"hp": 200, "maxHp": 200, "speed": 0.8, "phase2Speed": 1.5,
		"emoji": "🤖", "radius": 44, "suit": "diamonds",
		"mechanic": "lockdown",
		"description": "A vault-guard AI that thinks it is a poker dealer."
	},
	"Madam Aurelia": {
		"hp": 250, "maxHp": 250, "speed": 1.2, "phase2Speed": 2.0,
		"emoji": "🧛‍♀️", "radius": 38, "suit": "hearts",
		"mechanic": "vanitys_mirror",
		"description": "A mutated husk of vanity and former partner to Vance."
	},
	"Midas Vance": {
		"hp": 500, "maxHp": 500, "speed": 1.8, "phase2Speed": 2.5,
		"emoji": "👑", "radius": 48, "suit": "clubs",
		"mechanic": "double_down",
		"description": "The owner of the Spire, and your final gamble."
	}
}
