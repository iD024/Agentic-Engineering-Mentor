/**
 * Configuration for the SQLite database connection.
 *
 * Why this exists: Centralising SQLite connection parameters in one typed
 * interface prevents magic strings from scattering across the codebase and
 * makes the connection behaviour testable and auditable.
 */
export interface DatabaseConfig {
  /**
   * Absolute path to the SQLite file, or ':memory:' for an in-memory database.
   * In-memory databases are used exclusively in tests.
   */
  readonly path: string;

  /**
   * Enable WAL (Write-Ahead Logging) journal mode.
   * WAL dramatically improves concurrent read performance and is the
   * recommended journal mode for SQLite applications.
   */
  readonly walMode: boolean;

  /**
   * Busy timeout in milliseconds.
   * SQLite will retry locked operations for this many milliseconds
   * before throwing a SQLITE_BUSY error.
   */
  readonly timeout: number;

  /**
   * Enable verbose SQL logging.
   * Only enable in development; never in production.
   */
  readonly verbose: boolean;
}
