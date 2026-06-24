extends Camera2D
## Camera controller with lerp follow and mouse-look offset.
## Ported from src/camera.js.

@export var lerp_speed: float = 0.08
@export var mouse_look_factor: float = 0.25


func _ready() -> void:
	# Initialize camera state from GameState.
	position.x = GameState.camera.x
	position.y = GameState.camera.y
	GameState.camera.targetX = position.x
	GameState.camera.targetY = position.y


func _process(_delta: float) -> void:
	var player_pos := Vector2(GameState.player.x, GameState.player.y)
	var mouse_world := Vector2(GameState.mouse.worldX, GameState.mouse.worldY)

	# Mouse-look offset: shift camera 25% toward mouse.
	var offset_dir := mouse_world - player_pos
	var target := player_pos + offset_dir * mouse_look_factor

	GameState.camera.targetX = target.x
	GameState.camera.targetY = target.y

	position.x = lerp(position.x, GameState.camera.targetX, lerp_speed)
	position.y = lerp(position.y, GameState.camera.targetY, lerp_speed)

	GameState.camera.x = position.x
	GameState.camera.y = position.y
