import BetterSqlite3 from 'better-sqlite3';
import type { DatabaseConfig } from './DatabaseConfig.js';

/**
 * SQLite connection manager.
 *
 * Why this exists: Database.ts has exactly one job — manage the lifecycle of
 * a single SQLite connection. It does not run migrations, execute queries, or
 * know anything about the schema. Keeping it focused means every other layer
 * can trust that `.connection` is always a valid, open database handle.
 *
 * Who may use this:
 *   - MigrationRunner (to apply schema changes)
 *   - BaseRepository (to execute prepared statements)
 *   - DatabaseHealthCheck (to verify accessibility)
 *
 * Who must NEVER use this directly:
 *   - Services (must go through StateManager → repositories)
 *   - StateManager (must go through repositories)
 *   - Bootstrap (creates and registers it, but does not query)
 */
export class Database {
  private readonly config: DatabaseConfig;
  private _connection: BetterSqlite3.Database | null = null;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Opens the SQLite connection and applies pragma settings.
   *
   * @throws If the database is already open.
   */
  open(): void {
    if (this._connection !== null) {
      throw new Error('Database is already open');
    }

    const verboseLogger = this.config.verbose
      ? (msg: unknown) => process.stdout.write(`[SQL] ${String(msg)}\n`)
      : undefined;

    this._connection = new BetterSqlite3(this.config.path, {
      verbose: verboseLogger,
    });

    this._connection.pragma(`journal_mode = ${this.config.walMode ? 'WAL' : 'DELETE'}`);
    this._connection.pragma(`busy_timeout = ${this.config.timeout}`);
    this._connection.pragma('foreign_keys = ON');
    this._connection.pragma('synchronous = NORMAL');
  }

  /**
   * Returns the raw better-sqlite3 connection.
   *
   * @throws If the database has not been opened yet.
   */
  get connection(): BetterSqlite3.Database {
    if (this._connection === null) {
      throw new Error('Database is not open. Call open() first.');
    }
    return this._connection;
  }

  /**
   * Returns true if the connection is currently open.
   */
  isOpen(): boolean {
    return this._connection !== null && this._connection.open;
  }

  /**
   * Closes the SQLite connection.
   *
   * Idempotent — safe to call multiple times.
   */
  close(): void {
    if (this._connection !== null && this._connection.open) {
      this._connection.close();
    }
    this._connection = null;
  }
}
