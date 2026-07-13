import type { Database } from '../database/Database.js';

/**
 * Base class for all repositories.
 *
 * Why this exists: Every repository needs access to the database connection.
 * BaseRepository provides that single shared piece of infrastructure,
 * and nothing else. It deliberately contains no SQL, no business logic,
 * and no caching — those belong to the concrete repository and StateManager
 * respectively.
 *
 * Dependency rule: Repositories depend on Database. Nothing else.
 *
 * Who must NEVER extend this indirectly:
 *   - Services (they call repositories, not extend them)
 *   - StateManager (coordinates, does not query)
 */
export abstract class BaseRepository {
  protected readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }
}
