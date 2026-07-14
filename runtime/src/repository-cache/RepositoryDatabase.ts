import type { Database } from '../database/Database.js';

export class RepositoryDatabase {
  constructor(private db: Database) {}

  initTables() {
    this.db.connection.exec(`
      CREATE TABLE IF NOT EXISTS repo_metadata (
        id TEXT PRIMARY KEY,
        parser_version TEXT NOT NULL,
        scan_version TEXT NOT NULL,
        workspace_version TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS repo_symbols (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        data TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS repo_dependencies (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);
  }

  clear() {
    this.db.connection.exec(`
      DELETE FROM repo_metadata;
      DELETE FROM repo_symbols;
      DELETE FROM repo_dependencies;
    `);
  }
}
