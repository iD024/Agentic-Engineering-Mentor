import fs from 'node:fs/promises';
import path from 'node:path';
import type { IgnoreManager } from './IgnoreManager.js';

export class FileScanner {
  constructor(private ignoreManager: IgnoreManager) {}

  async scan(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (this.ignoreManager.isIgnored(fullPath)) continue;

      if (entry.isDirectory()) {
        files.push(...(await this.scan(fullPath)));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }
}
