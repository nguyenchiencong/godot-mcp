import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool, CommandResult } from '../utils/types.js';

interface RunSpecificSceneParams {
  scene_path: string;
}

/**
 * Tools for running and stopping the project or specific scenes from the editor.
 */
export const projectTools: MCPTool[] = [
  {
    name: 'run_project',
    description: 'Run the project using the configured main scene',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('run_project');
        const scenePath = result?.scene_path ?? ProjectRunMessages.unknownScene;
        return `Running project using main scene: ${scenePath}`;
      } catch (error) {
        throw new Error(`Failed to run project: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'stop_running_project',
    description: 'Stop any scene currently running in the editor',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('stop_running_project');
        const status = result?.status ?? 'unknown';
        if (status === 'idle') {
          return 'Editor is not currently running a scene.';
        }
        return 'Stopped the running scene.';
      } catch (error) {
        throw new Error(`Failed to stop running project: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'run_current_scene',
    description: 'Run the scene currently open in the editor',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('run_current_scene');
        const scenePath = result?.scene_path ?? ProjectRunMessages.unknownScene;
        return `Running current scene: ${scenePath}`;
      } catch (error) {
        throw new Error(`Failed to run current scene: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'run_specific_scene',
    description: 'Run a specific scene by providing its resource path',
    parameters: z.object({
      scene_path: z.string()
        .describe('Absolute resource path to the scene (e.g. "res://scenes/main.tscn")'),
    }),
    execute: async ({ scene_path }: RunSpecificSceneParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('run_specific_scene', { scene_path });
        const scenePath = result?.scene_path ?? scene_path;
        return `Running scene: ${scenePath}`;
      } catch (error) {
        throw new Error(`Failed to run scene "${scene_path}": ${(error as Error).message}`);
      }
    },
  },
];

const ProjectRunMessages = {
  unknownScene: 'unknown scene',
} as const;
