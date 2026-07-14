import { BaseRepository } from './BaseRepository.js';
import type { Session } from '../models/Session.js';
import type { Database } from '../database/Database.js';

interface SessionRow {
  id: string;
  workspace_id: string;
  state: string;
  goals: string;
  started_at: string;
  ended_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for session persistence.
 *
 * Contains ALL SQL related to the sessions table.
 * Contains NO business logic.
 */
export class SessionRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /** Inserts a new session row. */
  insert(session: Session): void {
    this.db.connection
      .prepare(`
        INSERT INTO sessions (
          id, workspace_id, state, goals, started_at, ended_at, version, created_at, updated_at
        ) VALUES (
          @id, @workspaceId, @state, @goals, @startedAt, @endedAt, @version, @createdAt, @updatedAt
        )
      `)
      .run({
        id: session.id,
        workspaceId: session.workspaceId,
        state: session.state,
        goals: JSON.stringify(session.goals),
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        version: session.version,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
  }

  /** Finds a session by its primary key. Returns null if not found. */
  findById(id: string): Session | null {
    const row = this.db.connection
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(id) as SessionRow | undefined;
    return row ? this.toModel(row) : null;
  }

  /** Returns all sessions for a given workspace id. */
  findByWorkspaceId(workspaceId: string): Session[] {
    const rows = this.db.connection
      .prepare('SELECT * FROM sessions WHERE workspace_id = ? ORDER BY started_at')
      .all(workspaceId) as SessionRow[];
    return rows.map(r => this.toModel(r));
  }

  /** Updates an existing session row. */
  update(session: Session): void {
    this.db.connection
      .prepare(`
        UPDATE sessions SET
          state = @state,
          goals = @goals,
          ended_at = @endedAt,
          version = @version
        WHERE id = @id
      `)
      .run({
        id: session.id,
        state: session.state,
        goals: JSON.stringify(session.goals),
        endedAt: session.endedAt,
        version: session.version,
      });
  }

  private toModel(row: SessionRow): Session {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      state: row.state as Session['state'],
      goals: JSON.parse(row.goals) as string[],
      startedAt: row.started_at,
      endedAt: row.ended_at,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
