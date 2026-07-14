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
    
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const isDist = __dirname.includes('/dist/') || __dirname.includes('\\dist\\');
    const srcOrDistPath = path.resolve(__dirname, '..');
    
    // Built-in Platform & Foundation tools
    const toolsDir = path.join(srcOrDistPath, 'tools');
    await this.scanDirectoryForTools(toolsDir);

    // Plugin tools
    const pluginsDir = path.join(srcOrDistPath, 'plugin');
    await this.scanDirectoryForTools(pluginsDir);

    this.logger.info(`Loaded ${this.registry.getAll().length} tools in total`);
  }

  private async scanDirectoryForTools(baseDir: string): Promise<void> {
    try {
      const exists = await fs.stat(baseDir).then(() => true).catch(() => false);
      if (!exists) {
        this.logger.warn(`Directory not found for tool scan: ${baseDir}`);
        return;
      }

      const files = await this.readDirRecursive(baseDir);
      for (const file of files) {
        if (!file.endsWith('Tool.ts') && !file.endsWith('Tool.js')) {
          continue;
        }

        try {
          const importUrl = `file://${file}`;
          const module = await import(importUrl);
          if (typeof module.createTool !== 'function') {
            continue;
          }

          const tool = module.createTool(this.container) as Tool;
          this.registry.register(tool);
          this.logger.info(`Registered tool: ${tool.descriptor.name} (${tool.descriptor.category})`);
        } catch (err) {
          this.logger.error(`Failed to load tool ${file}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      this.logger.error(`Error scanning directory ${baseDir}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async readDirRecursive(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.readDirRecursive(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }
}
