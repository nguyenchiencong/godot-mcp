import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool } from '../utils/types.js';

interface DebuggerBreakpointParams {
  script_path: string;
  line: number;
}

interface DebuggerSessionParams {
  session_id?: number;
}

interface DebuggerEventParams {
  enable_events?: boolean;
}

export const debuggerTools: MCPTool[] = [
  {
    name: 'debugger_set_breakpoint',
    description: 'Sets a breakpoint at a specific line in a script',
    parameters: z.object({
      script_path: z.string()
        .describe('The path to the script file (absolute or relative to res://)'),
      line: z.number()
        .int()
        .min(0)
        .describe('The line number where to set the breakpoint'),
    }),
    execute: async ({ script_path, line }: DebuggerBreakpointParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_set_breakpoint', { script_path, line });

        if (result.success) {
          return `Breakpoint set successfully at ${script_path}:${line}`;
        } else {
          throw new Error(result.message || 'Failed to set breakpoint');
        }
      } catch (error) {
        throw new Error(`Failed to set breakpoint: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_remove_breakpoint',
    description: 'Removes a breakpoint at a specific line in a script',
    parameters: z.object({
      script_path: z.string()
        .describe('The path to the script file (absolute or relative to res://)'),
      line: z.number()
        .int()
        .min(0)
        .describe('The line number where to remove the breakpoint'),
    }),
    execute: async ({ script_path, line }: DebuggerBreakpointParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_remove_breakpoint', { script_path, line });

        if (result.success) {
          return `Breakpoint removed successfully from ${script_path}:${line}`;
        } else {
          throw new Error(result.message || 'Failed to remove breakpoint');
        }
      } catch (error) {
        throw new Error(`Failed to remove breakpoint: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_get_breakpoints',
    description: 'Gets all currently set breakpoints',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_get_breakpoints', {});

        if (result.breakpoints) {
          let output = 'Current breakpoints:\n';

          for (const [scriptPath, lines] of Object.entries(result.breakpoints)) {
            if (Array.isArray(lines) && lines.length > 0) {
              output += `- ${scriptPath}: `;
              output += lines.map((line: number) => `line ${line}`).join(', ');
              output += '\n';
            }
          }

          if (output === 'Current breakpoints:\n') {
            output += 'No breakpoints set\n';
          }

          return output.trim();
        } else {
          return 'No breakpoints information available';
        }
      } catch (error) {
        throw new Error(`Failed to get breakpoints: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_clear_all_breakpoints',
    description: 'Clears all breakpoints',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_clear_all_breakpoints', {});

        if (result.success) {
          return `All breakpoints cleared successfully`;
        } else {
          throw new Error(result.message || 'Failed to clear breakpoints');
        }
      } catch (error) {
        throw new Error(`Failed to clear breakpoints: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_pause_execution',
    description: 'Pauses the execution of the running project',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_pause_execution', {});

        if (result.success) {
          return `Execution paused successfully`;
        } else {
          throw new Error(result.message || 'Failed to pause execution');
        }
      } catch (error) {
        throw new Error(`Failed to pause execution: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_resume_execution',
    description: 'Resumes the execution of the paused project',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_resume_execution', {});

        if (result.success) {
          return `Execution resumed successfully`;
        } else {
          throw new Error(result.message || 'Failed to resume execution');
        }
      } catch (error) {
        throw new Error(`Failed to resume execution: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_step_over',
    description: 'Steps over the current line of code',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_step_over', {});

        if (result.success) {
          return `Step over executed successfully`;
        } else {
          throw new Error(result.message || 'Failed to step over');
        }
      } catch (error) {
        throw new Error(`Failed to step over: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_step_into',
    description: 'Steps into the current function call',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_step_into', {});

        if (result.success) {
          return `Step into executed successfully`;
        } else {
          throw new Error(result.message || 'Failed to step into');
        }
      } catch (error) {
        throw new Error(`Failed to step into: ${(error as Error).message}`);
      }
    },
  },

  
  {
    name: 'debugger_get_call_stack',
    description: 'Gets the current call stack',
    parameters: z.object({
      session_id: z.number()
        .int()
        .optional()
        .describe('Optional debug session ID (will use active session if not provided)'),
    }),
    execute: async ({ session_id }: DebuggerSessionParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const params = session_id !== undefined ? { session_id } : {};
        const result = await godot.sendCommand('debugger_get_call_stack', params);

        if (result.request_sent) {
          return `Call stack request sent for session ${result.session_id}`;
        } else if (result.error) {
          throw new Error(result.error);
        } else {
          return 'Call stack request sent';
        }
      } catch (error) {
        throw new Error(`Failed to get call stack: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_get_current_state',
    description: 'Gets the current state of the debugger',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_get_current_state', {});

        let output = 'Debugger State:\n';
        output += `- Active: ${result.debugger_active ? 'Yes' : 'No'}\n`;

        if (result.active_sessions && result.active_sessions.length > 0) {
          output += `- Active Sessions: ${result.active_sessions.join(', ')}\n`;
          output += `- Current Session: ${result.current_session_id || 'None'}\n`;
          output += `- Paused: ${result.paused ? 'Yes' : 'No'}\n`;
          output += `- Total Breakpoints: ${result.total_breakpoints}\n`;

          if (result.current_script && result.current_line >= 0) {
            output += `- Current Location: ${result.current_script}:${result.current_line}\n`;
          }
        } else {
          output += '- No active debug sessions\n';
        }

        return output.trim();
      } catch (error) {
        throw new Error(`Failed to get debugger state: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_enable_events',
    description: 'Enables debugger events for this client (required for breakpoint notifications)',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_enable_events', {});

        return `Debugger events enabled for client ${result.client_id}. You will now receive notifications for breakpoints and execution changes.`;
      } catch (error) {
        throw new Error(`Failed to enable debugger events: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'debugger_disable_events',
    description: 'Disables debugger events for this client',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand('debugger_disable_events', {});

        return `Debugger events disabled for client ${result.client_id}`;
      } catch (error) {
        throw new Error(`Failed to disable debugger events: ${(error as Error).message}`);
      }
    },
  },
];