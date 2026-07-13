import fs from 'node:fs';
import path from 'node:path';

export class IgnoreManager {
  private ignores = new Set<string>(['node_modules', '.git', 'dist', 'build', 'coverage']);

  constructor(private workspaceRoot: string) {
    this.loadGitIgnore();
  }

  private loadGitIgnore() {
    const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          this.ignores.add(trimmed);
        }
      }
    }
  }

  isIgnored(filePath: string): boolean {
    const relativePath = path.relative(this.workspaceRoot, filePath);
    const parts = relativePath.split(path.sep);
    for (const part of parts) {
      if (this.ignores.has(part)) {
        return true;
      }
    }
    return false;
  }
}
