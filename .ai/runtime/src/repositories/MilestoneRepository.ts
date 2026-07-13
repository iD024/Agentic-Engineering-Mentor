import { BaseRepository } from './BaseRepository.js';
import type { Milestone } from '../models/Milestone.js';
import type { Database } from '../database/Database.js';

interface MilestoneRow {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  state: string;
  order_index: number;
  completed_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for milestone persistence.
 *
 * Contains ALL SQL related to the milestones table.
 * Contains NO business logic.
 */
export class MilestoneRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /** Inserts a new milestone row. */
  insert(milestone: Milestone): void {
    this.db.connection
      .prepare(`
        INSERT INTO milestones (
          id, workspace_id, title, description, state, order_index,
          completed_at, version, created_at, updated_at
        ) VALUES (
          @id, @workspaceId, @title, @description, @state, @orderIndex,
          @completedAt, @version, @createdAt, @updatedAt
        )
      `)
      .run({
        id: milestone.id,
        workspaceId: milestone.workspaceId,
        title: milestone.title,
        description: milestone.description,
        state: milestone.state,
        orderIndex: milestone.orderIndex,
        completedAt: milestone.completedAt,
        version: milestone.version,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
      });
  }

  /** Finds a milestone by id. Returns null if not found. */
  findById(id: string): Milestone | null {
    const row = this.db.connection
      .prepare('SELECT * FROM milestones WHERE id = ?')
      .get(id) as MilestoneRow | undefined;
    return row ? this.toModel(row) : null;
  }

  /** Returns all milestones for a workspace, ordered by order_index. */
  findByWorkspaceId(workspaceId: string): Milestone[] {
    const rows = this.db.connection
      .prepare('SELECT * FROM milestones WHERE workspace_id = ? ORDER BY order_index')
      .all(workspaceId) as MilestoneRow[];
    return rows.map(r => this.toModel(r));
  }

  /** Updates an existing milestone row. */
  update(milestone: Milestone): void {
    this.db.connection
      .prepare(`
        UPDATE milestones SET
          title = @title,
          description = @description,
          state = @state,
          order_index = @orderIndex,
          completed_at = @completedAt,
          version = @version
        WHERE id = @id
      `)
      .run({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        state: milestone.state,
        orderIndex: milestone.orderIndex,
        completedAt: milestone.completedAt,
        version: milestone.version,
      });
  }

  private toModel(row: MilestoneRow): Milestone {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title,
      description: row.description,
      state: row.state as Milestone['state'],
      orderIndex: row.order_index,
      completedAt: row.completed_at,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
