@tool
class_name MCPDebuggerCommands
extends MCPBaseCommandProcessor

# Reference to the debugger bridge
var _debugger_bridge = null

func _ready():
	# Get reference to the debugger bridge from the plugin
	_debugger_bridge = _get_debugger_bridge()

	if _debugger_bridge:
		# Connect debugger signals to forward events
		_debugger_bridge.breakpoint_hit.connect(_on_breakpoint_hit)
		_debugger_bridge.execution_paused.connect(_on_execution_paused)
		_debugger_bridge.execution_resumed.connect(_on_execution_resumed)
		_debugger_bridge.stack_frame_changed.connect(_on_stack_frame_changed)
		_debugger_bridge.breakpoint_set.connect(_on_breakpoint_set)
		_debugger_bridge.breakpoint_removed.connect(_on_breakpoint_removed)
	else:
		print("[MCPDebuggerCommands] Warning: Could not get debugger bridge reference")

func _get_debugger_bridge():
	# Get the debugger bridge from the plugin's metadata
	if Engine.has_meta("MCPDebuggerBridge"):
		return Engine.get_meta("MCPDebuggerBridge")

	# Alternative: try to get it from the plugin
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if plugin and plugin.has_method("get_debugger_bridge"):
		return plugin.get_debugger_bridge()

	return null

func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	match command_type:
		"debugger_set_breakpoint":
			_set_breakpoint(client_id, params, command_id)
			return true
		"debugger_remove_breakpoint":
			_remove_breakpoint(client_id, params, command_id)
			return true
		"debugger_get_breakpoints":
			_get_breakpoints(client_id, params, command_id)
			return true
		"debugger_clear_all_breakpoints":
			_clear_all_breakpoints(client_id, params, command_id)
			return true
		"debugger_pause_execution":
			_pause_execution(client_id, params, command_id)
			return true
		"debugger_resume_execution":
			_resume_execution(client_id, params, command_id)
			return true
		"debugger_step_over":
			_step_over(client_id, params, command_id)
			return true
		"debugger_step_into":
			_step_into(client_id, params, command_id)
			return true
		"debugger_get_call_stack":
			_get_call_stack(client_id, params, command_id)
			return true
		"debugger_get_current_state":
			_get_current_state(client_id, params, command_id)
			return true
		"debugger_enable_events":
			_enable_debugger_events(client_id, params, command_id)
			return true
		"debugger_disable_events":
			_disable_debugger_events(client_id, params, command_id)
			return true
	return false

func _set_breakpoint(client_id: int, params: Dictionary, command_id: String) -> void:
	var script_path = params.get("script_path", "")
	var line = params.get("line", -1)

	if script_path.is_empty():
		return _send_error(client_id, "script_path parameter is required", command_id)

	if line < 0:
		return _send_error(client_id, "line parameter must be >= 0", command_id)

	# Ensure we have an absolute path
	if not script_path.begins_with("res://"):
		if not script_path.begins_with("/"):
			script_path = "res://" + script_path
		else:
			script_path = "res://" + script_path.substr(1)

	if not _debugger_bridge:
		_send_error(client_id, "Debugger bridge not available", command_id)
		return

	var result = _debugger_bridge.set_breakpoint(script_path, line)

	if result.get("success", false):
		_send_success(client_id, result, command_id)
	else:
		_send_error(client_id, result.get("message", "Failed to set breakpoint"), command_id)

func _remove_breakpoint(client_id: int, params: Dictionary, command_id: String) -> void:
	if not _debugger_bridge:
		return _send_error(client_id, "Debugger bridge not available", command_id)

	var script_path = params.get("script_path", "")
	var line = params.get("line", -1)

	if script_path.is_empty():
		return _send_error(client_id, "script_path parameter is required", command_id)

	if line < 0:
		return _send_error(client_id, "line parameter must be >= 0", command_id)

	# Ensure we have an absolute path
	if not script_path.begins_with("res://"):
		if not script_path.begins_with("/"):
			script_path = "res://" + script_path
		else:
			script_path = "res://" + script_path.substr(1)

	var result = _debugger_bridge.remove_breakpoint(script_path, line)

	if result.get("success", false):
		_send_success(client_id, result, command_id)
	else:
		_send_error(client_id, result.get("message", "Failed to remove breakpoint"), command_id)

func _get_breakpoints(client_id: int, params: Dictionary, command_id: String) -> void:
	if not _debugger_bridge:
		_send_error(client_id, "Debugger bridge not available", command_id)
		return

	var result = _debugger_bridge.get_breakpoints()
	_send_success(client_id, result, command_id)

func _clear_all_breakpoints(client_id: int, params: Dictionary, command_id: String) -> void:
	var result = _debugger_bridge.clear_all_breakpoints()
	_send_success(client_id, result, command_id)

func _pause_execution(client_id: int, params: Dictionary, command_id: String) -> void:
	var result = _debugger_bridge.pause_execution()

	if result.get("success", false):
		_send_success(client_id, result, command_id)
	else:
		_send_error(client_id, result.get("message", "Failed to pause execution"), command_id)

func _resume_execution(client_id: int, params: Dictionary, command_id: String) -> void:
	var result = _debugger_bridge.resume_execution()

	if result.get("success", false):
		_send_success(client_id, result, command_id)
	else:
		_send_error(client_id, result.get("message", "Failed to resume execution"), command_id)

func _step_over(client_id: int, params: Dictionary, command_id: String) -> void:
	var result = _debugger_bridge.step_over()

	if result.get("success", false):
		_send_success(client_id, result, command_id)
	else:
		_send_error(client_id, result.get("message", "Failed to step over"), command_id)

func _step_into(client_id: int, params: Dictionary, command_id: String) -> void:
	var result = _debugger_bridge.step_into()

	if result.get("success", false):
		_send_success(client_id, result, command_id)
	else:
		_send_error(client_id, result.get("message", "Failed to step into"), command_id)


func _get_call_stack(client_id: int, params: Dictionary, command_id: String) -> void:
	var session_id = params.get("session_id", -1)

	if session_id < 0:
		# Try to get active session
		var current_state = _debugger_bridge.get_current_state()
		var active_sessions = current_state.get("active_sessions", [])
		if not active_sessions.is_empty():
			session_id = active_sessions[0]
		else:
			return _send_error(client_id, "No active debugger session found", command_id)

	var result = _debugger_bridge.get_call_stack(session_id)
	_send_success(client_id, result, command_id)

func _get_current_state(client_id: int, params: Dictionary, command_id: String) -> void:
	var result = _debugger_bridge.get_current_state()
	_send_success(client_id, result, command_id)

func _enable_debugger_events(client_id: int, params: Dictionary, command_id: String) -> void:
	# Set the client ID for event forwarding
	_debugger_bridge.set_client_id(client_id)

	# Set websocket server reference if not already set
	if not _debugger_bridge._websocket_server:
		_debugger_bridge.set_websocket_server(_websocket_server)

	_send_success(client_id, {
		"message": "Debugger events enabled for this client",
		"client_id": client_id
	}, command_id)

func _disable_debugger_events(client_id: int, params: Dictionary, command_id: String) -> void:
	# Clear the client ID to stop event forwarding
	if _debugger_bridge._current_client_id == client_id:
		_debugger_bridge.set_client_id(-1)

	_send_success(client_id, {
		"message": "Debugger events disabled for this client",
		"client_id": client_id
	}, command_id)

# Signal handlers to forward debugger events
func _on_breakpoint_hit(session_id: int, script_path: String, line: int, stack_info: Dictionary) -> void:
	# Events are handled by the bridge itself, but we can add additional logging
	print("Breakpoint hit in session %s at %s:%d" % [session_id, script_path, line])

func _on_execution_paused(session_id: int, reason: String) -> void:
	print("Execution paused in session %s: %s" % [session_id, reason])

func _on_execution_resumed(session_id: int) -> void:
	print("Execution resumed in session %s" % session_id)

func _on_stack_frame_changed(session_id: int, frame_info: Dictionary) -> void:
	print("Stack frame changed in session %s" % session_id)

func _on_breakpoint_set(session_id: int, script_path: String, line: int, success: bool) -> void:
	if success:
		print("Breakpoint set successfully at %s:%d" % [script_path, line])
	else:
		print("Failed to set breakpoint at %s:%d" % [script_path, line])

func _on_breakpoint_removed(session_id: int, script_path: String, line: int, success: bool) -> void:
	if success:
		print("Breakpoint removed successfully at %s:%d" % [script_path, line])
	else:
		print("Failed to remove breakpoint at %s:%d" % [script_path, line])
