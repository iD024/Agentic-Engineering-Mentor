import { BaseRepository } from './BaseRepository.js';
import type { LearningProgress } from '../models/LearningProgress.js';
import type { Database } from '../database/Database.js';

interface LearningRow {
  id: string;
  workspace_id: string;
  topic: string;
  level: string;
  notes: string;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for learning progress persistence.
 *
 * Contains ALL SQL related to the learning_progress table.
 * Contains NO business logic.
 */
export class LearningRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /** Inserts a new learning progress record. */
  insert(progress: LearningProgress): void {
    this.db.connection
      .prepare(`
        INSERT INTO learning_progress (
          id, workspace_id, topic, level, notes, version, created_at, updated_at
        ) VALUES (
          @id, @workspaceId, @topic, @level, @notes, @version, @createdAt, @updatedAt
        )
      `)
      .run({
        id: progress.id,
        workspaceId: progress.workspaceId,
        topic: progress.topic,
        level: progress.level,
        notes: progress.notes,
        version: progress.version,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      });
  }

  /** Finds a learning progress record by id. Returns null if not found. */
  findById(id: string): LearningProgress | null {
    const row = this.db.connection
      .prepare('SELECT * FROM learning_progress WHERE id = ?')
      .get(id) as LearningRow | undefined;
    return row ? this.toModel(row) : null;
  }

  /** Returns all learning progress records for a workspace. */
  findByWorkspaceId(workspaceId: string): LearningProgress[] {
    const rows = this.db.connection
      .prepare('SELECT * FROM learning_progress WHERE workspace_id = ? ORDER BY topic')
      .all(workspaceId) as LearningRow[];
    return rows.map(r => this.toModel(r));
  }

  /** Finds a learning progress record by workspace and topic. */
  findByTopic(workspaceId: string, topic: string): LearningProgress | null {
    const row = this.db.connection
      .prepare('SELECT * FROM learning_progress WHERE workspace_id = ? AND topic = ?')
      .get(workspaceId, topic) as LearningRow | undefined;
    return row ? this.toModel(row) : null;
  }

  /** Updates an existing learning progress record. */
  update(progress: LearningProgress): void {
    this.db.connection
      .prepare(`
        UPDATE learning_progress SET
          topic = @topic,
          level = @level,
          notes = @notes,
          version = @version
        WHERE id = @id
      `)
      .run({
        id: progress.id,
        topic: progress.topic,
        level: progress.level,
        notes: progress.notes,
        version: progress.version,
      });
  }

  private toModel(row: LearningRow): LearningProgress {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      topic: row.topic,
      level: row.level as LearningProgress['level'],
      notes: row.notes,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
