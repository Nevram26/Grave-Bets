class_name CharacterResource
extends Resource
## Defines a playable character in Grave Bets.
## Ported from src/characters.js.

@export var id: String = ""
@export var char_name: String = ""
@export var emoji: String = ""
@export var description: String = ""
@export var attack_type: String = "ranged"  # "ranged" or "melee"
@export var radius: float = 16.0
@export var speed: float = 5.0
@export var hp: int = 10
@export var max_hp: int = 10
@export var stats: Dictionary = {
	"VIT": 10,
	"PWR": 2,
	"ARM": 0,
	"SPD": 5,
	"JCE": 0,
	"LCK": 1
}
@export var suit: String = ""
@export var active_name: String = ""
@export var active_description: String = ""
@export var passive_description: String = ""
@export var melee_range: float = 60.0
