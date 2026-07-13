import type { Database } from '../database/Database.js';
import type { ASTNode } from './ASTNode.js';
import { ASTSerializer } from './ASTSerializer.js';

export class ASTCache {
  constructor(private db: Database) {
    this.init();
  }

  private init() {
    this.db.connection.exec(`
      CREATE TABLE IF NOT EXISTS ast_cache (
        file_path TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        ast_data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  }

  get(filePath: string, currentHash: string): ASTNode | null {
    const row = this.db.connection.prepare('SELECT hash, ast_data FROM ast_cache WHERE file_path = ?').get(filePath) as any;
    if (row && row.hash === currentHash) {
      return ASTSerializer.deserialize(row.ast_data);
    }
    return null;
  }

  set(filePath: string, hash: string, ast: ASTNode): void {
    const data = ASTSerializer.serialize(ast);
    this.db.connection.prepare(`
      INSERT INTO ast_cache (file_path, hash, ast_data, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET hash = excluded.hash, ast_data = excluded.ast_data, updated_at = excluded.updated_at
    `).run(filePath, hash, data, Date.now());
  }
}
