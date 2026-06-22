class_name MovementController
extends CharacterBody2D
## Handles player movement, dash, and movement-related input.
## Ported from src/input.js movement logic.

@export var mouse_look := true

var _input_vector := Vector2.ZERO


func _ready() -> void:
	GameState.player.x = global_position.x
	GameState.player.y = global_position.y


func _process(_delta: float) -> void:
	_update_mouse_world_position()


func _physics_process(_delta: float) -> void:
	if GameState.gameState != "playing" or GameState.isPaused:
		return

	_update_input_vector()
	_update_dash()
	_apply_movement()


func _update_input_vector() -> void:
	_input_vector = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if _input_vector.length() > 1.0:
		_input_vector = _input_vector.normalized()


func _update_dash() -> void:
	if Input.is_action_just_pressed("dash") and GameState.player.dashCooldown <= 0 and GameState.player.dashTimer <= 0:
		var dash_dir := _input_vector
		if dash_dir.length() < 0.01:
			# Dash toward mouse if not moving
			var mouse_pos := Vector2(GameState.mouse.worldX, GameState.mouse.worldY)
			dash_dir = (mouse_pos - global_position).normalized()
		if dash_dir.length() < 0.01:
			dash_dir = Vector2.RIGHT

		var dash_speed := GameState.player.speed * 4.0
		GameState.player.dashVx = dash_dir.x * dash_speed
		GameState.player.dashVy = dash_dir.y * dash_speed
		GameState.player.dashTimer = 12  # frames at 60fps ~ 0.2s
		GameState.player.dashCooldown = 90  # 1.5s cooldown
		GameState.player.invulnerable = 12


func _apply_movement() -> void:
	var p := GameState.player

	if p.dashTimer > 0:
		velocity = Vector2(p.dashVx, p.dashVy)
		# Ghost trail is handled by visual effects later
		p.dashTimer -= 1
		if p.dashTimer <= 0:
			p.dashVx = 0.0
			p.dashVy = 0.0
	else:
		var speed_mult := _get_speed_multiplier()
		p.speed = _get_base_speed() * speed_mult
		velocity = _input_vector * p.speed

		# Decrement cooldowns
		if p.dashCooldown > 0:
			p.dashCooldown -= 1
		if p.invulnerable > 0:
			p.invulnerable -= 1
		if p.armorTimer > 0:
			p.armorTimer -= 1
			if p.armorTimer <= 0:
				p.armor = 0

	move_and_slide()

	p.x = global_position.x
	p.y = global_position.y
	p.vx = velocity.x
	p.vy = velocity.y


func _get_base_speed() -> float:
	var char_id := GameState.player.characterId
	if char_id.is_empty():
		return GameState.player.speed
	# Character-specific speed quirks will be applied here as characters are ported.
	# For now, return the base speed from the character resource if available.
	var char_res: CharacterResource = load("res://resources/characters/" + char_id + ".tres") as CharacterResource
	if char_res:
		return char_res.speed
	return GameState.player.speed


func _get_speed_multiplier() -> float:
	# Status effects will modify this once suits/status are ported.
	return 1.0


func _update_mouse_world_position() -> void:
	var cam := get_viewport().get_camera_2d()
	if cam:
		var mouse_pos := get_global_mouse_position()
		GameState.mouse.worldX = mouse_pos.x
		GameState.mouse.worldY = mouse_pos.y
	else:
		GameState.mouse.worldX = GameState.mouse.screenX + GameState.camera.x - get_viewport().size.x / 2.0
		GameState.mouse.worldY = GameState.mouse.screenY + GameState.camera.y - get_viewport().size.y / 2.0
