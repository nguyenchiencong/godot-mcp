extends RefCounted

# Runtime debugger helper that provides bridge functionality
# This is not a runtime script anymore, but a helper for the debugger bridge

const DEBUGGER_CAPTURE_NAME := "mcp_debugger"

class RuntimeBreakpointManager:
	var _breakpoints: Dictionary = {}
	var _engine_debugger = null

	func _init():
		_engine_debugger = Engine.get_singleton("EngineDebugger")
		if _engine_debugger:
			print("[MCP Runtime Debugger] EngineDebugger singleton available")

	# Add a breakpoint to be tracked
	func add_breakpoint(script_path: String, line: int) -> bool:
		var key = "%s:%d" % [script_path, line]
		if not _breakpoints.has(script_path):
			_breakpoints[script_path] = []

		if line not in _breakpoints[script_path]:
			_breakpoints[script_path].append(line)
			print("[MCP Runtime Debugger] Tracking breakpoint: %s" % key)
			return true
		return false

	# Remove a breakpoint from tracking
	func remove_breakpoint(script_path: String, line: int) -> bool:
		if _breakpoints.has(script_path):
			if line in _breakpoints[script_path]:
				_breakpoints[script_path].erase(line)
				print("[MCP Runtime Debugger] Removed breakpoint: %s:%d" % [script_path, line])
				if _breakpoints[script_path].is_empty():
					_breakpoints.erase(script_path)
				return true
		return false

	# Get all tracked breakpoints
	func get_breakpoints() -> Dictionary:
		return _breakpoints.duplicate(true)

	# Clear all breakpoints
	func clear_breakpoints() -> void:
		_breakpoints.clear()
		print("[MCP Runtime Debugger] All breakpoints cleared")

	# Check if a breakpoint exists at the given location
	func has_breakpoint(script_path: String, line: int) -> bool:
		return _breakpoints.has(script_path) and line in _breakpoints[script_path]

# Static instance for global access
static var _instance: RuntimeBreakpointManager = null

static func get_instance() -> RuntimeBreakpointManager:
	if _instance == null:
		_instance = RuntimeBreakpointManager.new()
	return _instance

# Helper functions for the debugger bridge
static func register_breakpoint(script_path: String, line: int) -> bool:
	var instance = get_instance()
	return instance.add_breakpoint(script_path, line)

static func unregister_breakpoint(script_path: String, line: int) -> bool:
	var instance = get_instance()
	return instance.remove_breakpoint(script_path, line)

static func get_all_breakpoints() -> Dictionary:
	var instance = get_instance()
	return instance.get_breakpoints()

static func clear_all_breakpoints() -> void:
	var instance = get_instance()
	instance.clear_breakpoints()

static func is_breakpoint_active(script_path: String, line: int) -> bool:
	var instance = get_instance()
	return instance.has_breakpoint(script_path, line)

