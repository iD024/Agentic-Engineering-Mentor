import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import type { ToolRegistry } from './ToolRegistry.js';
import type { Tool } from './Tool.js';
import type { ILogger } from '../interfaces/ILogger.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export class ToolLoader {
  private readonly logger: ILogger;

  constructor(
    private readonly container: IServiceContainer,
    private readonly registry: ToolRegistry
  ) {
    this.logger = this.container.resolve(TOKENS.LoggerFactory).createLogger('ToolLoader');
  }

  async discoverAndLoad(): Promise<void> {
    this.logger.info('Starting automatic tool discovery and registration');
    
    // Load built-in tools
    await this.loadManifest(
      path.join(process.cwd(), '.ai', 'runtime', 'dist', 'tools', 'tools.json'),
      'builtInTools',
      path.join(process.cwd(), '.ai', 'runtime', 'dist', 'tools')
    );

    // Load plugin tools
    await this.loadManifest(
      path.join(process.cwd(), '.ai', 'runtime', 'dist', 'plugin', 'plugins.json'),
      'pluginTools',
      path.join(process.cwd(), '.ai', 'runtime', 'dist', 'plugin')
    );

    this.logger.info(`Loaded ${this.registry.getAll().length} tools in total`);
  }

  private async loadManifest(manifestPath: string, key: string, baseDir: string): Promise<void> {
    try {
      const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
      if (!exists) {
        this.logger.warn(`Manifest not found: ${manifestPath}`);
        return;
      }

      const content = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(content);
      const tools = manifest[key];

      if (!Array.isArray(tools)) {
        this.logger.warn(`Invalid manifest format in ${manifestPath}, expected array for key ${key}`);
        return;
      }

      for (const toolPath of tools) {
        try {
          // Resolve full path and convert to file:// URL for ES module dynamic import
          const fullPath = path.resolve(baseDir, toolPath);
          const importUrl = `file://${fullPath}`;
          
          const module = await import(importUrl);
          if (typeof module.createTool !== 'function') {
            this.logger.warn(`Tool module ${toolPath} does not export a createTool function`);
            continue;
          }

          const tool = module.createTool(this.container) as Tool;
          this.registry.register(tool);
          this.logger.info(`Registered tool: ${tool.descriptor.name}`);
        } catch (err) {
          this.logger.error(`Failed to load tool ${toolPath}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      this.logger.error(`Error processing manifest ${manifestPath}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
