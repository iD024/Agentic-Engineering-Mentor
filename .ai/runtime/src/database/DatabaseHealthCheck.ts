import type { IHealthCheck, HealthStatus } from '../interfaces/IHealthCheck.js';
import type { Database } from './Database.js';

/**
 * Health check for the SQLite database connection.
 *
 * Why this exists: The HealthMonitor (Stage 1) uses an open/closed plugin
 * model. Any subsystem that can fail registers an IHealthCheck without
 * modifying the monitor. DatabaseHealthCheck integrates the database into
 * the standard health report, giving operators a single /health endpoint
 * that covers all infrastructure concerns.
 *
 * Who may use this:
 *   - Bootstrap (registers it with HealthMonitor)
 *
 * Who must NEVER use this:
 *   - Repositories, Services, StateManager (they have no health concern)
 */
export class DatabaseHealthCheck implements IHealthCheck {
  readonly name = 'database';
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Verifies the database is open and responsive by executing a trivial query.
   */
  async check(): Promise<HealthStatus> {
    try {
      if (!this.db.isOpen()) {
        return { healthy: false, message: 'Database connection is closed' };
      }

      // A fast, no-op query that verifies the connection is functional.
      const result = this.db.connection.prepare('SELECT 1 AS ok').get() as { ok: number };
      return {
        healthy: result.ok === 1,
        message: 'Database connection is healthy',
        details: { path: 'sqlite', open: true },
      };
    } catch (err) {
      return {
        healthy: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
