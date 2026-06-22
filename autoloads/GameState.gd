extends Node
## GameState autoload singleton.
## Central mutable state for the entire game.
## Full data port tracked in issue #4.

# Run-time world state
var world := { "width": 3000, "height": 3000 }

# Player state (mirrors src/state.js player block)
var player := {
	"x": 1500.0, "y": 1500.0,
	"radius": 16.0, "speed": 5.0,
	"vx": 0.0, "vy": 0.0,
	"emoji": "🧙‍♂️",
	"hp": 10, "maxHp": 10,
	"gold": 0,
	"invulnerable": 0,
	"armor": 0, "armorTimer": 0,
	"dashCooldown": 0, "dashTimer": 0,
	"dashVx": 0.0, "dashVy": 0.0,
	"dashGhosts": [],
	"characterId": "",
	"suit": "",
	"statusEffects": [],
	"activeCooldown": 0,
	"quirkState": {},
	"shotCount": 0,
	"stats": { "VIT": 10, "PWR": 2, "ARM": 0, "SPD": 5, "JCE": 0, "LCK": 1 },
	"relics": []
}

# Camera state
var camera := {
	"x": 1500.0, "y": 1500.0,
	"targetX": 1500.0, "targetY": 1500.0,
	"lerp": 0.08,
	"mouseLookFactor": 0.25
}

# Mouse state
var mouse := { "screenX": 0, "screenY": 0, "worldX": 1500.0, "worldY": 1500.0 }

# Collections
var rooms: Array[Dictionary] = []
var corridors: Array[Dictionary] = []
var enemies: Array[Dictionary] = []
var enemyProjectiles: Array[Dictionary] = []
var projectiles: Array[Dictionary] = []
var visualEffects: Array[Dictionary] = []
var obstacles: Array[Dictionary] = []

# Game flow
var log_messages: Array[Dictionary] = []
var isPaused := false
var isRoomCleared := false
var deferredMap := false
var roomType := ""
var gameState := "lounge"  # lounge, char_select, playing, paused, gameover, victory
var boss: Dictionary = {}
var bossState: Dictionary = {}
var elevator = null
var currentFloor := 0
var shopRelics: Array = []
var shopkeeper = null
var mapData: Dictionary = { "nodes": [], "rows": [], "visited": {}, "reachable": [] }
var currentNodeIndex := -1
var totalEncounters := 0
var currentNodeType := "Normal"
var runSoulChips := 0
var runFreeRespins := 0

# Meta-progression
var meta := {
	"soulChips": 0,
	"unlockedCharacters": ["luciano"],
	"upgrades": {
		"startingGold": 0,
		"extraHp": 0,
		"canRespinChest": 0,
		"startWithRelic": false
	}
}


func _ready() -> void:
	reset()


## Reset all run-time state for a new game.
func reset() -> void:
	player.x = 1500.0
	player.y = 1500.0
	player.vx = 0.0
	player.vy = 0.0
	player.hp = 10
	player.maxHp = 10
	player.gold = 0
	player.invulnerable = 0
	player.armor = 0
	player.armorTimer = 0
	player.dashCooldown = 0
	player.dashTimer = 0
	player.dashVx = 0.0
	player.dashVy = 0.0
	player.dashGhosts.clear()
	player.characterId = ""
	player.suit = ""
	player.statusEffects.clear()
	player.activeCooldown = 0
	player.quirkState.clear()
	player.shotCount = 0
	player.relics.clear()

	enemies.clear()
	enemyProjectiles.clear()
	projectiles.clear()
	visualEffects.clear()
	obstacles.clear()
	log_messages.clear()

	isPaused = false
	isRoomCleared = false
	deferredMap = false
	roomType = ""
	gameState = "lounge"
	boss = {}
	bossState = {}
	elevator = null
	currentFloor = 0
	shopRelics.clear()
	shopkeeper = null
	mapData = { "nodes": [], "rows": [], "visited": {}, "reachable": [] }
	currentNodeIndex = -1
	totalEncounters = 0
	currentNodeType = "Normal"
	runSoulChips = 0
	runFreeRespins = 0
