# Godot MCP Architecture

This document details the architecture of the Godot Model Context Protocol (MCP) integration, explaining the design decisions, component interactions, and communication protocols.

## Overview

The Godot MCP architecture enables bidirectional communication between Claude AI and the Godot game engine using the Model Context Protocol. This allows Claude to interact with Godot projects through natural language commands, performing operations like node creation, script editing, and resource management.

## Key Design Goals

1. **Bidirectional Communication**: Enable Claude to both receive information from and send commands to Godot
2. **Robust Error Handling**: Provide clear error messages and recovery mechanisms
3. **Modularity**: Separate concerns between Godot-specific logic and MCP protocol handling
4. **Extensibility**: Make it easy to add new commands and capabilities
5. **Performance**: Minimize impact on Godot editor performance

## System Components

### 1. Godot Addon

The Godot addon runs within the Godot editor and provides:

#### WebSocket Server
- Creates a WebSocket server within Godot
- Handles client connections and message routing
- Processes incoming JSON commands
- Formats and sends JSON responses

#### Command Execution Engine
- Routes commands to appropriate handlers
- Executes Godot API calls
- Manages command execution context
- Provides error handling and response formatting

#### Editor Integration
- Provides a dock panel UI for server control
- Displays connection status and logs
- Offers configuration options
- Ensures proper lifecycle management within Godot

#### Debugger Integration
- **MCPDebuggerBridge**: EditorDebuggerPlugin for debugging capabilities
- **MCPDebuggerCommands**: Command processor for debugger operations
- **RuntimeDebugger**: Runtime script injected into debugged projects
- **Event System**: Real-time notifications for breakpoint hits and execution changes
- **Session Management**: Handles multiple debug sessions and client ownership

### 2. MCP Server

The MCP server bridges Claude and Godot:

#### FastMCP Implementation
- Uses FastMCP to implement the Model Context Protocol
- Handles communication with Claude
- Manages tool registration and execution
- Provides authentication and session management

#### Godot Connection Manager
- Maintains WebSocket connection to Godot
- Sends commands and receives responses
- Handles reconnection and timeout logic
- Provides a promise-based API for commands

#### Tool Definitions
- Defines available operations for Claude
- Validates command parameters
- Formats responses for Claude's consumption
- Provides help text and examples

## Communication Protocol

### Command Flow

1. **Claude to MCP Server**: Claude generates a command request through the MCP protocol
2. **MCP Server to Godot**: MCP server sends a WebSocket command message to Godot
3. **Godot Execution**: Godot processes the command and executes relevant engine API calls
4. **Godot to MCP Server**: Godot sends a response message to the MCP server
5. **MCP Server to Claude**: MCP server formats the response for Claude

### Message Formats

#### Command Message (MCP Server to Godot)
```json
{
  "type": "command_type",
  "params": {
    "param1": "value1",
    "param2": "value2"
  },
  "commandId": "cmd_123"
}
```

#### Response Message (Godot to MCP Server)
```json
{
  "status": "success",
  "result": {
    "key1": "value1",
    "key2": "value2"
  },
  "commandId": "cmd_123"
}
```

#### Error Response (Godot to MCP Server)
```json
{
  "status": "error",
  "message": "Detailed error message",
  "commandId": "cmd_123"
}
```

## Key Design Patterns

### Command Pattern
Commands are encapsulated as objects with a type and parameters, enabling flexible execution and routing.

### Proxy Pattern
The MCP server acts as a proxy for Godot, providing Claude with a simplified interface to Godot functionality.

### Factory Pattern
Command handlers act as factories for creating and executing Godot operations.

### Observer Pattern
The WebSocket server uses events to notify the system about connections, disconnections, and messages.

### Promise Pattern
The Godot connection manager uses promises for async command execution and response handling.

## Error Handling

The architecture implements a comprehensive error handling strategy:

1. **Validation**: Commands are validated before execution
2. **Contextual Errors**: Error messages include context about what went wrong
3. **Error Propagation**: Errors are properly propagated through the system
4. **Recovery Mechanisms**: Connection failures trigger automatic reconnection attempts
5. **Timeout Handling**: Long-running commands have timeout protection

## Scalability and Performance

### Connection Management
- WebSocket connections are reused to reduce overhead
- Connection pool allows for multiple clients if needed
- Automatic reconnection on failure

### Command Execution
- Commands are executed asynchronously
- Long-running operations report progress
- Resource cleanup ensures efficient memory usage

### Editor Performance
- WebSocket server runs in a separate thread
- UI updates are throttled to prevent editor slowdown
- Command execution is optimized to minimize impact

## Debugger Architecture

### Debugger Component Overview

The debugger integration introduces several new components that work together with the existing architecture:

#### MCPDebuggerBridge (EditorDebuggerPlugin)
- **Purpose**: Interfaces with Godot's built-in debugging system
- **Integration**: Registered as an EditorDebuggerPlugin in the main plugin
- **Responsibilities**:
  - Manages debug session lifecycle
  - Handles breakpoint registration and management
  - Provides execution control (pause/resume/step)
  - Emits real-time events for breakpoint hits and state changes
  - Throttles events to prevent client overwhelming

#### MCPDebuggerCommands (Command Processor)
- **Purpose**: Processes debugger-related MCP commands
- **Integration**: Registered with the main command handler
- **Responsibilities**:
  - Routes 13 debugger commands to appropriate operations
  - Manages client event subscription ownership
  - Handles parameter validation and error responses
  - Forwards debugger events to subscribed clients

#### RuntimeDebugger (Runtime Script)
- **Purpose**: Runtime script injected into debugged projects
- **Integration**: Communicates through Godot's EngineDebugger system
- **Responsibilities**:
  - Handles debug message capture from runtime
  - Manages breakpoint execution in running code
  - Provides runtime expression evaluation
  - Reports execution state changes

### Debugger Communication Flow

```
Claude Client
    ↓ (MCP Protocol)
TypeScript Server (debugger_tools.ts)
    ↓ (WebSocket)
Godot WebSocket Server
    ↓ (Command Routing)
MCPDebuggerCommands
    ↓ (Bridge Access)
MCPDebuggerBridge (EditorDebuggerPlugin)
    ↓ (EngineDebugger)
RuntimeDebugger (in running project)
```

### Debugger Event System

The debugger uses an event-driven architecture for real-time notifications:

1. **Event Registration**: Clients call `debugger_enable_events()` to subscribe
2. **Event Generation**: Debugger bridge emits signals on state changes
3. **Event Throttling**: Events are throttled (100ms minimum) to prevent flooding
4. **Event Forwarding**: Events are forwarded to subscribed clients only
5. **Event Types**:
   - `breakpoint_hit`: When execution hits a breakpoint
   - `execution_paused`: When execution is paused
   - `execution_resumed`: When execution resumes
   - `stack_frame_changed`: When current stack frame changes

### Debugger Session Management

- **Session Lifecycle**: Sessions are created when projects run with F5 (Debug)
- **Multiple Sessions**: Supports multiple concurrent debug sessions
- **Client Ownership**: Only one client can receive events at a time
- **Session State**: Tracks pause status, current script/line, breakpoints
- **Cleanup**: Automatic cleanup when sessions end or clients disconnect

### Debugger Resources

The debugger provides MCP resources for state access:

- **godot://debugger/state**: Current debugger state and sessions
- **godot://debugger/breakpoints**: Active breakpoints across all scripts
- **godot://debugger/call-stack/{sessionId}**: Call stack for specific session
- **godot://debugger/session/{sessionId}**: Session-specific information

## Security Considerations

1. **Local-Only Communication**: By default, the WebSocket server only accepts connections from localhost
2. **Authentication Options**: Optional authentication can be implemented
3. **Command Validation**: All commands are validated before execution
4. **Error Isolation**: Errors in command execution don't crash the Godot editor
5. **Debugger Isolation**: Debugger operations are isolated from normal project operations

## Extensibility

The architecture is designed for extensibility:

1. **Command Registry**: New commands can be added by registering them with the command handler
2. **Tool Registration**: New tools can be added to the MCP server
3. **Modular Design**: Components can be extended or replaced independently
4. **Event System**: Events allow for hooking into system operations

## Future Considerations

1. **Multiple Sessions**: Support for multiple simultaneous Claude sessions
2. **Remote Connections**: Secure connections from remote MCP servers
3. **Command Queueing**: Queue for complex multi-step operations
4. **Advanced Authentication**: More robust authentication mechanisms
5. **Performance Optimizations**: Further reduce overhead for large projects