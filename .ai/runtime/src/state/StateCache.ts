import type { Workspace } from '../models/Workspace.js';
import type { Session } from '../models/Session.js';

/**
 * In-memory cache for frequently accessed domain objects.
 *
 * Why this exists: The database is the source of truth, but reading from disk
 * on every state access would be unnecessarily slow. StateCache holds frozen,
 * immutable copies of recently loaded objects. When StateManager writes to the
 * database, it also updates the cache — keeping them in sync.
 *
 * The cache returns `Readonly` (frozen) views so callers cannot accidentally
 * mutate the cached copy. All mutations must go through StateManager commands.
 *
 * Who may use this:
 *   - StateManager only (it is an internal implementation detail)
 *
 * Who must NEVER use this:
 *   - Services, Repositories, external consumers
 */
export class StateCache {
  private readonly workspaces = new Map<string, Readonly<Workspace>>();
  private readonly sessions = new Map<string, Readonly<Session>>();

  /**
   * Returns the cached workspace by id, or null if not cached.
   * The returned object is frozen.
   */
  getWorkspace(id: string): Readonly<Workspace> | null {
    return this.workspaces.get(id) ?? null;
  }

  /**
   * Stores a workspace in the cache.
   * The object is frozen before storage to prevent accidental mutation.
   *
   * @param workspace - The workspace to cache.
   */
  setWorkspace(workspace: Workspace): void {
    this.workspaces.set(workspace.id, Object.freeze({ ...workspace }));
  }

  /**
   * Removes a workspace from the cache.
   * The next read will go to the database and repopulate the cache.
   *
   * @param id - The workspace id to invalidate.
   */
  invalidateWorkspace(id: string): void {
    this.workspaces.delete(id);
  }

  /**
   * Returns the cached session by id, or null if not cached.
   * The returned object is frozen.
   */
  getSession(id: string): Readonly<Session> | null {
    return this.sessions.get(id) ?? null;
  }

  /**
   * Stores a session in the cache.
   * The object is frozen before storage.
   *
   * @param session - The session to cache.
   */
  setSession(session: Session): void {
    this.sessions.set(session.id, Object.freeze({ ...session }));
  }

  /**
   * Removes a session from the cache.
   *
   * @param id - The session id to invalidate.
   */
  invalidateSession(id: string): void {
    this.sessions.delete(id);
  }

  /**
   * Clears all cached entries.
   *
   * Used during shutdown or after a transaction rollback to ensure
   * stale data is never served.
   */
  clear(): void {
    this.workspaces.clear();
    this.sessions.clear();
  }

  /**
   * Triggers a re-population of cached entries from the database.
   * This is a no-op in StateCache itself — the caller (StateManager) is
   * responsible for re-loading from repositories after calling this.
   *
   * The method exists as a signal point for future instrumentation.
   */
  refresh(): void {
    this.clear();
  }
}
