# Godot MCP Installation Guide

This guide walks you through installing and setting up the Godot MCP integration to use Claude with your Godot projects.

## Prerequisites

- Godot 4.x installed
- Node.js 18+ and npm installed
- Claude desktop application with MCP enabled

## Installation Steps

### 1. Install the Godot Addon

1. Copy the `godot_mcp` folder from the `addons` directory to your Godot project's `addons` folder
2. In your Godot project, go to "Project > Project Settings > Plugins"
3. Find the "Godot MCP" plugin and enable it
4. You should now see a "Godot MCP Server" panel in your editor's right dock

### 2. Set up the MCP Server

1. Navigate to the `server` directory in your terminal
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Usage

### 1. Start the Godot WebSocket Server

1. Open your Godot project
2. In the "Godot MCP Server" panel, set the port (default: 9080)
3. Click "Start Server"
4. You should see a message confirming the server is running

### 2. Start the MCP Server

1. In the `server` directory, run:
   ```bash
   npm start
   ```
2. The server will automatically connect to the Godot WebSocket server

### 3. Connect Claude

1. In Claude desktop app, go to Settings > Developer
2. Enable Model Context Protocol
3. Add a new MCP tool with the following configuration:
   - Name: Godot MCP
   - Command: `node /path/to/godot-mcp/server/dist/index.js`
   - Working directory: `/path/to/your/project`
4. Save the configuration
5. When chatting with Claude, you can now access Godot tools

## Debugger Setup

The debugger integration is included automatically with the Godot MCP addon, but requires specific setup to function properly.

### Debugger Prerequisites

- **Godot Editor 4.5+**: Required for EditorDebuggerPlugin support
- **Debug Mode**: Projects must be run with F5 (Debug), not F6 (Run)
- **Active Scene**: A scene must be loaded and running for debugging to work

### Enabling Debugger Features

The debugger features are automatically available when:
1. The Godot MCP plugin is enabled
2. The MCP server is connected to Godot
3. A project is running in debug mode

### Testing the Debugger

To verify debugger functionality:

1. **Open the Test Scene**:
   - In Godot, open `res://test_main_scene.tscn`
   - This scene includes `test_debugger.gd` with breakpoints for testing

2. **Start Debugger Events**:
   ```
   @mcp godot-mcp run debugger_enable_events
   ```

3. **Set a Test Breakpoint**:
   ```
   @mcp godot-mcp run debugger_set_breakpoint --script_path "res://test_debugger.gd" --line 42
   ```

4. **Run with Debugging**:
   - Press **F5** in Godot Editor
   - Wait for automatic breakpoint triggers (every ~60 frames)
   - Or press **SPACE** for manual pause points

5. **Verify Functionality**:
   - Check for breakpoint hit notifications
   - Test pause/resume/step operations
   - Verify call stack access

For comprehensive testing instructions, see [TESTING_DEBUGGER.md](../TESTING_DEBUGGER.md).

### Debugger Limitations

- **Editor Only**: Only works when running projects from Godot Editor with F5
- **No Export Support**: Debugger doesn't work in exported builds
- **Single Client**: Only one MCP client can receive debugger events at a time
- **Basic Stepping**: Step functionality limited by Godot's debugging API

## Troubleshooting

### Connection Issues

If the MCP Server can't connect to Godot:
1. Make sure the Godot WebSocket server is running (check the panel)
2. Verify that the port numbers match in both the Godot panel and `godot_connection.ts`
3. Check for any firewall issues blocking localhost connections

### Command Errors

If commands are failing:
1. Check the logs in both the Godot panel and terminal running the MCP server
2. Make sure your Godot project is properly set up and has an active scene
3. Verify that paths used in commands follow the correct format (usually starting with "res://")

### Debugger Issues

**"No active debugger session"**
- Ensure project is running with **F5** (Debug) from Godot Editor
- Check that WebSocket server is running on port 9080
- Verify the MCP server is connected to Godot

**"Failed to set breakpoint"**
- Verify script path exists and is correct (use absolute `res://` paths)
- Check that line number is valid for the target script
- Ensure the project is running in debug mode

**Missing debugger events**
- Call `debugger_enable_events()` first to receive event notifications
- Check WebSocket connection status in server console
- Verify that only one client has events enabled at a time

**Breakpoint not hitting**
- Make sure the code execution actually reaches the breakpoint line
- Check console output for any debugger errors
- Test with the provided `test_debugger.gd` script to verify functionality

### Getting Help

If you encounter issues:
1. Check the detailed [DEBUGGER_INTEGRATION.md](../DEBUGGER_INTEGRATION.md) documentation
2. Review the [TESTING_DEBUGGER.md](../TESTING_DEBUGGER.md) troubleshooting section
3. Check the Godot console and MCP server logs for error messages
4. Try the basic test scene to isolate the issue