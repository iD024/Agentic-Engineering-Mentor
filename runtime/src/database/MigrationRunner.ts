import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database } from './Database.js';

/**
 * Describes a single versioned migration.
 *
 * Each migration has a numeric version (used as the primary key in
 * schema_version), a human-readable description, and the SQL to execute.
 */
interface Migration {
  readonly version: number;
  readonly description: string;
  readonly sql: string;
}

/**
 * Runs versioned SQL migrations against a SQLite database.
 *
 * Why this exists: The MigrationRunner is the only place in the runtime that
 * reads .sql files and applies schema changes. It guarantees idempotency by
 * checking schema_version before executing each migration. No migration can
 * run twice, making the startup sequence safe to repeat.
 *
 * The migration system is append-only. New migrations are added as new .sql
 * files with incrementing version numbers. Existing migrations are NEVER
 * modified — if a change is needed, a new migration corrects it.
 *
 * Who may use this:
 *   - Bootstrap (called once during startup before StateManager initialises)
 *
 * Who must NEVER use this:
 *   - Repositories (they never touch the schema)
 *   - StateManager (schema changes are a startup concern, not a runtime one)
 */
export class MigrationRunner {
  private readonly migrationsDir: string;

  constructor(migrationsDir?: string) {
    // Default: the migrations/ folder co-located with this file.
    // Can be overridden in tests.
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.migrationsDir = migrationsDir ?? resolve(__dirname, 'migrations');
  }

  /**
   * Executes all pending migrations in version order.
   *
   * Each migration runs inside a transaction to ensure atomicity.
   * If a migration fails, the transaction rolls back and the error propagates.
   * Applied migrations are recorded in the `schema_version` table.
   *
   * @param db - An open Database connection.
   */
  run(db: Database): void {
    this.ensureSchemaVersionTable(db);
    const applied = this.getAppliedVersions(db);
    const pending = this.loadMigrations().filter(m => !applied.has(m.version));

    for (const migration of pending) {
      this.applyMigration(db, migration);
    }
  }

  // ---------- private ----------

  private ensureSchemaVersionTable(db: Database): void {
    db.connection.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version     INTEGER PRIMARY KEY,
        description TEXT    NOT NULL,
        applied_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `);
  }

  private getAppliedVersions(db: Database): Set<number> {
    const rows = db.connection
      .prepare('SELECT version FROM schema_version')
      .all() as { version: number }[];
    return new Set(rows.map(r => r.version));
  }

  private applyMigration(db: Database, migration: Migration): void {
    const tx = db.connection.transaction(() => {
      db.connection.exec(migration.sql);
      db.connection
        .prepare('INSERT INTO schema_version (version, description) VALUES (?, ?)')
        .run(migration.version, migration.description);
    });
    tx();
  }

  private loadMigrations(): Migration[] {
    const files: Array<{ version: number; filename: string; description: string }> = [
      { version: 1, filename: '001_initial_schema.sql', description: 'Initial schema' },
      { version: 2, filename: '002_indexes.sql', description: 'Performance indexes' },
      { version: 3, filename: '003_constraints.sql', description: 'Constraints and triggers' },
      { version: 4, filename: '004_seed_settings.sql', description: 'Seed default settings' },
    ];

    return files.map(f => ({
      version: f.version,
      description: f.description,
      sql: readFileSync(resolve(this.migrationsDir, f.filename), 'utf-8'),
    }));
  }
}
