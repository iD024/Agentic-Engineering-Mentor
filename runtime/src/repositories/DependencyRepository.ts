import { BaseRepository } from './BaseRepository.js';
import type { DependencyMetric } from '../models/DependencyMetric.js';
import type { Database } from '../database/Database.js';

interface DependencyRow {
  id: string;
  workspace_id: string;
  name: string;
  version: string;
  outdated: number;
  vulnerable: number;
  notes: string;
  row_version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for dependency metric persistence.
 *
 * Contains ALL SQL related to the dependency_metrics table.
 * Contains NO business logic.
 */
export class DependencyRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /** Inserts a new dependency metric row. */
  insert(metric: DependencyMetric): void {
    this.db.connection
      .prepare(`
        INSERT INTO dependency_metrics (
          id, workspace_id, name, version, outdated, vulnerable, notes,
          row_version, created_at, updated_at
        ) VALUES (
          @id, @workspaceId, @name, @version, @outdated, @vulnerable, @notes,
          @rowVersion, @createdAt, @updatedAt
        )
      `)
      .run({
        id: metric.id,
        workspaceId: metric.workspaceId,
        name: metric.name,
        version: metric.version,
        outdated: metric.outdated ? 1 : 0,
        vulnerable: metric.vulnerable ? 1 : 0,
        notes: metric.notes,
        rowVersion: metric.rowVersion,
        createdAt: metric.createdAt,
        updatedAt: metric.updatedAt,
      });
  }

  /** Finds a dependency metric by id. Returns null if not found. */
  findById(id: string): DependencyMetric | null {
    const row = this.db.connection
      .prepare('SELECT * FROM dependency_metrics WHERE id = ?')
      .get(id) as DependencyRow | undefined;
    return row ? this.toModel(row) : null;
  }

  /** Returns all dependency metrics for a workspace. */
  findByWorkspaceId(workspaceId: string): DependencyMetric[] {
    const rows = this.db.connection
      .prepare('SELECT * FROM dependency_metrics WHERE workspace_id = ? ORDER BY name')
      .all(workspaceId) as DependencyRow[];
    return rows.map(r => this.toModel(r));
  }

  /** Updates an existing dependency metric row. */
  update(metric: DependencyMetric): void {
    this.db.connection
      .prepare(`
        UPDATE dependency_metrics SET
          name = @name,
          version = @version,
          outdated = @outdated,
          vulnerable = @vulnerable,
          notes = @notes,
          row_version = @rowVersion
        WHERE id = @id
      `)
      .run({
        id: metric.id,
        name: metric.name,
        version: metric.version,
        outdated: metric.outdated ? 1 : 0,
        vulnerable: metric.vulnerable ? 1 : 0,
        notes: metric.notes,
        rowVersion: metric.rowVersion,
      });
  }

  private toModel(row: DependencyRow): DependencyMetric {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      version: row.version,
      outdated: row.outdated === 1,
      vulnerable: row.vulnerable === 1,
      notes: row.notes,
      rowVersion: row.row_version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
