import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import type { DatabaseConfig } from '../../src/database/DatabaseConfig.js';

const config: DatabaseConfig = { path: ':memory:', walMode: true, timeout: 5000, verbose: false };

describe('MigrationRunner', () => {
  let db: Database;
  let runner: MigrationRunner;

  beforeEach(() => {
    db = new Database(config);
    db.open();
    runner = new MigrationRunner();
  });

  afterEach(() => {
    db.close();
  });

  it('creates schema_version table', () => {
    runner.run(db);
    const row = db.connection.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
    ).get();
    expect(row).toBeDefined();
  });

  it('creates all domain tables', () => {
    runner.run(db);
    const tables = ['workspaces', 'sessions', 'learning_progress', 'milestones',
                    'dependency_metrics', 'settings'];
    for (const table of tables) {
      const row = db.connection.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
      ).get();
      expect(row).toBeDefined();
    }
  });

  it('is idempotent — running twice does not throw', () => {
    runner.run(db);
    expect(() => runner.run(db)).not.toThrow();
  });

  it('records applied migrations in schema_version', () => {
    runner.run(db);
    const rows = db.connection.prepare('SELECT version FROM schema_version ORDER BY version').all() as { version: number }[];
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows[0]!.version).toBe(1);
  });

  it('does not re-apply already-applied migrations', () => {
    runner.run(db);
    const countBefore = (db.connection.prepare('SELECT COUNT(*) as c FROM schema_version').get() as { c: number }).c;
    runner.run(db);
    const countAfter = (db.connection.prepare('SELECT COUNT(*) as c FROM schema_version').get() as { c: number }).c;
    expect(countAfter).toBe(countBefore);
  });
});
