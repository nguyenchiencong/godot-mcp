import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool, CommandResult } from '../utils/types.js';

/**
 * Type definitions for script tool parameters
 */
interface CreateScriptParams {
  script_path: string;
  content: string;
  node_path?: string;
}

interface EditScriptParams {
  script_path: string;
  content: string;
}

interface GetScriptParams {
  script_path?: string;
  node_path?: string;
}

/**
 * Definition for script tools - operations that manipulate GDScript files
 */
export const scriptTools: MCPTool[] = [
  {
    name: 'create_script',
    description: 'Create a new GDScript file in the project',
    parameters: z.object({
      script_path: z.string()
        .describe('Path where the script will be saved (e.g. "res://scripts/player.gd")'),
      content: z.string()
        .describe('Content of the script'),
      node_path: z.string().optional()
        .describe('Path to a node to attach the script to (optional)'),
    }),
    execute: async ({ script_path, content, node_path }: CreateScriptParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('create_script', {
          script_path,
          content,
          node_path,
        });
        
        const attachMessage = node_path 
          ? ` and attached to node at ${node_path}` 
          : '';
        
        return `Created script at ${result.script_path}${attachMessage}`;
      } catch (error) {
        throw new Error(`Failed to create script: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'edit_script',
    description: 'Edit an existing GDScript file',
    parameters: z.object({
      script_path: z.string()
        .describe('Path to the script file to edit (e.g. "res://scripts/player.gd")'),
      content: z.string()
        .describe('New content of the script'),
    }),
    execute: async ({ script_path, content }: EditScriptParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        await godot.sendCommand('edit_script', {
          script_path,
          content,
        });
        
        return `Updated script at ${script_path}`;
      } catch (error) {
        throw new Error(`Failed to edit script: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'get_script',
    description: 'Get the content of a GDScript file',
    parameters: z.object({
      script_path: z.string().optional()
        .describe('Path to the script file (e.g. "res://scripts/player.gd")'),
      node_path: z.string().optional()
        .describe('Path to a node with a script attached'),
    }).refine(data => data.script_path !== undefined || data.node_path !== undefined, {
      message: "Either script_path or node_path must be provided",
    }),
    execute: async ({ script_path, node_path }: GetScriptParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('get_script', {
          script_path,
          node_path,
        });
        
        return `Script at ${result.script_path}:\n\n\`\`\`gdscript\n${result.content}\n\`\`\``;
      } catch (error) {
        throw new Error(`Failed to get script: ${(error as Error).message}`);
      }
    },
  },
];
