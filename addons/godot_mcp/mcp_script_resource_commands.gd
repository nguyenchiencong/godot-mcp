@tool
class_name MCPScriptResourceCommands
extends MCPBaseCommandProcessor

func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
	match command_type:
		"get_script":
			_handle_get_script(client_id, params, command_id)
			return true
		"edit_script":
			_handle_edit_script(client_id, params, command_id)
			return true
	return false  # Command not handled

func _handle_get_script(client_id: int, params: Dictionary, command_id: String) -> void:
	var path = params.get("path", "")
	var node_path = params.get("node_path", "")
	
	# Handle based on which parameter is provided
	var script_path = ""
	var result = {}
	
	if not path.is_empty():
		# Direct script path provided
		result = _get_script_by_path(path)
	elif not node_path.is_empty():
		# Node path provided, get attached script
		result = _get_script_by_node(node_path)
	else:
		result = {
			"error": "Either script_path or node_path must be provided",
			"script_found": false
		}
	
	_send_success(client_id, result, command_id)

func _get_script_by_path(script_path: String) -> Dictionary:
	var normalized_path = _normalize_script_path(script_path)

	if normalized_path.is_empty():
		return {
			"error": "Script path is required",
			"script_found": false
		}

	if not FileAccess.file_exists(normalized_path):
		return {
			"error": "Script file not found",
			"script_found": false
		}
	
	var file = FileAccess.open(normalized_path, FileAccess.READ)
	if not file:
		return {
			"error": "Failed to open script file",
			"script_found": false
		}
	
	var content = file.get_as_text()
	return {
		"script_found": true,
		"script_path": normalized_path,
		"content": content
	}

func _get_script_by_node(node_path: String) -> Dictionary:
	# Get editor plugin and interfaces
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if not plugin:
		return {
			"error": "GodotMCPPlugin not found in Engine metadata",
			"script_found": false
		}
	
	var editor_interface = plugin.get_editor_interface()
	var edited_scene_root = editor_interface.get_edited_scene_root()
	
	if not edited_scene_root:
		return {
			"error": "No scene is currently being edited",
			"script_found": false
		}
	
	var node = edited_scene_root.get_node_or_null(node_path)
	if not node:
		return {
			"error": "Node not found",
			"script_found": false
		}
	
	var script = node.get_script()
	if not script:
		return {
			"error": "Node has no script attached",
			"script_found": false
		}
	
	var script_path = script.resource_path
	return _get_script_by_path(script_path)

func _handle_edit_script(client_id: int, params: Dictionary, command_id: String) -> void:
	var script_path = params.get("script_path", "")
	
	var result = {}
	
	if script_path.is_empty():
		result = {
			"error": "Script path is required",
			"success": false
		}
	elif not params.has("content"):
		result = {
			"error": "Content is required",
			"success": false
		}
	else:
		var content = params.get("content")
		if content == null:
			result = {
				"error": "Content is required",
				"success": false
			}
		else:
			result = _edit_script_content(script_path, str(content))
	
	_send_success(client_id, result, command_id)

func _edit_script_content(script_path: String, content: String) -> Dictionary:
	var normalized_path = _normalize_script_path(script_path)
	
	var file = FileAccess.open(normalized_path, FileAccess.WRITE)
	if not file:
		return {
			"error": "Failed to open script file for writing",
			"success": false
		}
	
	file.store_string(content)
	
	# Open the script in the editor if possible
	var plugin = Engine.get_meta("GodotMCPPlugin")
	if plugin:
		var editor_interface = plugin.get_editor_interface()
		var script = load(normalized_path)
		if script:
			editor_interface.edit_resource(script)
	
	return {
		"success": true,
		"script_path": normalized_path
	}

func _normalize_script_path(script_path: String) -> String:
	var normalized_path = script_path

	if normalized_path.is_empty():
		return normalized_path

	if not normalized_path.begins_with("res://"):
		normalized_path = "res://" + normalized_path

	if normalized_path.get_extension().is_empty():
		normalized_path += ".gd"

	return normalized_path
