// File: /server/src/tools/enhanced_tools.ts
import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool } from '../utils/types.js';

/**
 * Enhanced tools for more complex operations in Godot
 */
export const enhancedTools: MCPTool[] = [
  {
    name: 'get_editor_scene_structure',
    description: 'Get the current scene hierarchy with optional detail flags',
    parameters: z.object({
      include_properties: z.boolean().optional()
        .describe('Include common editor properties (position, rotation, etc.)'),
      include_scripts: z.boolean().optional()
        .describe('Include attached script information'),
      max_depth: z.number().int().min(0).optional()
        .describe('Limit traversal depth (0 = only root)')
    }),
    execute: async ({ include_properties, include_scripts, max_depth }): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const params: Record<string, unknown> = {};
        if (include_properties !== undefined) params.include_properties = include_properties;
        if (include_scripts !== undefined) params.include_scripts = include_scripts;
        if (max_depth !== undefined) params.max_depth = max_depth;

        const result = await godot.sendCommand('get_editor_scene_structure', params);

        if (result.error) {
          return `Scene structure unavailable: ${result.error}`;
        }

        if (!result.structure || Object.keys(result.structure).length === 0) {
          return 'No scene is currently open or the scene is empty.';
        }

        const formatNode = (node: any, depth = 0): string => {
          const indent = ' '.repeat(depth * 2);
          let output = `${indent}${node.name} (${node.type})`;

          if (node.children && node.children.length > 0) {
            output += '\n';
            output += node.children.map((child: any) => formatNode(child, depth + 1)).join('\n');
          }

          return output;
        };

        return `Current Scene: ${result.path}\nRoot Node: ${result.root_node_name} (${result.root_node_type})\n\nScene Tree:\n${formatNode(result.structure)}`;
      } catch (error) {
        throw new Error(`Failed to get scene structure: ${(error as Error).message}`);
      }
    },
  },
  
  {
    name: 'get_debug_output',
    description: 'Get the debug output from the Godot editor',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand('get_debug_output', {});
        
        if (!result.output || result.output.length === 0) {
          return 'No debug output available.';
        }
        
        return `Debug Output:\n${result.output}`;
      } catch (error) {
        throw new Error(`Failed to get debug output: ${(error as Error).message}`);
      }
    },
  },
];
