import { Resource, ResourceTemplate } from 'fastmcp';
import { getGodotConnection } from '../utils/godot_connection.js';

interface ScriptContent {
  text: string;
  metadata?: {
    path: string;
    language: string;
    [key: string]: any;
  };
}

/**
 * Resource that provides script content
 */
export const scriptResource: Resource = {
  uri: 'godot/script',
  name: 'Script Content',
  mimeType: 'text/plain',
  async load() {
    const godot = getGodotConnection();
    try {
      const scriptPath = 'res://default_script.gd';
      const result = await godot.sendCommand('get_script', {
        path: scriptPath
      });
      
      return {
        text: result.content,
        metadata: {
          path: result.script_path,
          language: scriptPath.endsWith('.gd') ? 'gdscript' : 
                  scriptPath.endsWith('.cs') ? 'csharp' : 'unknown'
        }
      };
    } catch (error) {
      console.error('Error fetching script content:', error);
      throw error;
    }
  }
};

/**
 * Resource for script list
 */
export const scriptListResource: Resource = {
  uri: 'godot/scripts',
  name: 'Script List',
  mimeType: 'application/json',
  async load() {
    const godot = getGodotConnection();
    try {
      const result = await godot.sendCommand('list_project_files', {
        extensions: ['.gd', '.cs']
      });
      
      if (result && result.files) {
        return {
          text: JSON.stringify({
            scripts: result.files,
            count: result.files.length,
            gdscripts: result.files.filter((f: string) => f.endsWith('.gd')),
            csharp_scripts: result.files.filter((f: string) => f.endsWith('.cs'))
          })
        };
      } else {
        return {
          text: JSON.stringify({
            scripts: [],
            count: 0,
            gdscripts: [],
            csharp_scripts: []
          })
        };
      }
    } catch (error) {
      console.error('Error fetching script list:', error);
      throw error;
    }
  }
};

/**
 * Resource for script metadata
 */
export const scriptMetadataResource: Resource = {
  uri: 'godot/script/metadata',
  name: 'Script Metadata',
  mimeType: 'application/json',
  async load() {
    const godot = getGodotConnection();
    try {
      const scriptPath = 'res://default_script.gd';
      const result = await godot.sendCommand('get_script_metadata', {
        path: scriptPath
      });
      
      return {
        text: JSON.stringify(result)
      };
    } catch (error) {
      console.error('Error fetching script metadata:', error);
      throw error;
    }
  }
};

/**
 * Template resource for retrieving script content by path.
 */
export const scriptByPathResourceTemplate: ResourceTemplate = {
  uriTemplate: 'godot/script/{path}',
  name: 'Script Content By Path',
  mimeType: 'text/plain',
  arguments: [
    {
      name: 'path',
      description: 'Path to the script (e.g. res://scripts/player.gd)'
    }
  ],
  async load({ path }) {
    const godot = getGodotConnection();
    try {
      if (!path || path.trim() === '') {
        throw new Error('Script path must be provided.');
      }

      let normalizedPath = path.trim();
      if (!normalizedPath.startsWith('res://')) {
        normalizedPath = `res://${normalizedPath}`;
      }

      const result = await godot.sendCommand('get_script', { path: normalizedPath });

      if (!result || result.script_found === false) {
        const message = result?.error ?? `Script not found at ${normalizedPath}`;
        throw new Error(message);
      }

      return {
        text: result.content ?? '',
        metadata: {
          path: result.script_path ?? normalizedPath,
          language: normalizedPath.endsWith('.gd') ? 'gdscript' :
                    normalizedPath.endsWith('.cs') ? 'csharp' : 'unknown'
        }
      };
    } catch (error) {
      console.error('Error fetching script content by path:', error);
      throw error;
    }
  }
};
