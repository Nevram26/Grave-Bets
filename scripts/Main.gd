extends Node2D
## Main game scene and loop.
## Manages screen state transitions and the core gameplay loop.

enum ScreenState {
	LOUNGE,
	CHAR_SELECT,
	PLAYING,
	PAUSED,
	GAME_OVER,
	VICTORY
}

var current_screen: ScreenState = ScreenState.LOUNGE

@onready var lounge: CanvasLayer = $Lounge
@onready var character_select: CanvasLayer = $CharacterSelect
@onready var hud: CanvasLayer = $HUD
@onready var pause_menu: CanvasLayer = $PauseMenu
@onready var game_over_screen: CanvasLayer = $GameOverScreen
@onready var victory_screen: CanvasLayer = $VictoryScreen
@onready var game_world: Node2D = $GameWorld


func _ready() -> void:
	change_screen(ScreenState.LOUNGE)


func _process(_delta: float) -> void:
	if current_screen != ScreenState.PLAYING or GameState.isPaused:
		return
	# Gameplay update logic will be wired here as systems are ported.
	# For now, this skeleton simply respects the pause/screen state.


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if current_screen == ScreenState.PLAYING:
			toggle_pause()
		elif current_screen == ScreenState.PAUSED:
			toggle_pause()
		get_viewport().set_input_as_handled()
		return

	if event.is_action_pressed("map"):
		if current_screen == ScreenState.PLAYING and not GameState.isPaused:
			# Map overlay toggle will be wired here in issue #19.
			pass
		get_viewport().set_input_as_handled()
		return


## Switch to the requested screen and update visibility of all screen nodes.
func change_screen(screen: ScreenState) -> void:
	current_screen = screen
	GameState.gameState = _screen_state_to_string(screen)

	lounge.visible = (screen == ScreenState.LOUNGE)
	character_select.visible = (screen == ScreenState.CHAR_SELECT)
	hud.visible = (screen == ScreenState.PLAYING or screen == ScreenState.PAUSED)
	pause_menu.visible = (screen == ScreenState.PAUSED)
	game_over_screen.visible = (screen == ScreenState.GAME_OVER)
	victory_screen.visible = (screen == ScreenState.VICTORY)
	game_world.visible = (screen == ScreenState.PLAYING or screen == ScreenState.PAUSED)

	if screen == ScreenState.PLAYING:
		GameState.isPaused = false
		pause_menu.visible = false
	elif screen == ScreenState.PAUSED:
		GameState.isPaused = true
		pause_menu.visible = true


## Toggle between PLAYING and PAUSED.
func toggle_pause() -> void:
	if current_screen == ScreenState.PLAYING:
		change_screen(ScreenState.PAUSED)
	elif current_screen == ScreenState.PAUSED:
		change_screen(ScreenState.PLAYING)


func _screen_state_to_string(screen: ScreenState) -> String:
	match screen:
		ScreenState.LOUNGE: return "lounge"
		ScreenState.CHAR_SELECT: return "char_select"
		ScreenState.PLAYING: return "playing"
		ScreenState.PAUSED: return "paused"
		ScreenState.GAME_OVER: return "gameover"
		ScreenState.VICTORY: return "victory"
	return "unknown"


## Start a new run from the character select screen.
func start_run(character_id: String) -> void:
	GameState.reset()
	GameState.player.characterId = character_id
	# TODO: load character resource, initialize stats, generate map, first room.
	change_screen(ScreenState.PLAYING)


## Return to the Executive Lounge after a run ends.
func return_to_lounge() -> void:
	change_screen(ScreenState.LOUNGE)


## Show the game over screen.
func show_game_over() -> void:
	change_screen(ScreenState.GAME_OVER)


## Show the victory screen.
func show_victory() -> void:
	change_screen(ScreenState.VICTORY)
