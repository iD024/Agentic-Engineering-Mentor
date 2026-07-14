import { BaseRepository } from './BaseRepository.js';
import type { Workspace } from '../models/Workspace.js';
import type { Database } from '../database/Database.js';

/** Row shape as stored in SQLite (snake_case, integers for booleans). */
interface WorkspaceRow {
  id: string;
  name: string;
  description: string;
  project_version: string;
  state: string;
  initialized: number;
  current_milestone: string | null;
  last_synchronization: string;
  repository_fingerprint: string;
  schema_version: string;
  feature_flags: string;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for workspace persistence.
 *
 * Contains ALL SQL related to the workspaces table.
 * Contains NO business logic.
 * Returns domain models, not raw rows.
 */
export class WorkspaceRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /**
   * Inserts a new workspace row.
   *
   * @param workspace - The workspace to persist.
   */
  insert(workspace: Workspace): void {
    this.db.connection
      .prepare(`
        INSERT INTO workspaces (
          id, name, description, project_version, state, initialized,
          current_milestone, last_synchronization, repository_fingerprint,
          schema_version, feature_flags, version, created_at, updated_at
        ) VALUES (
          @id, @name, @description, @projectVersion, @state, @initialized,
          @currentMilestone, @lastSynchronization, @repositoryFingerprint,
          @schemaVersion, @featureFlags, @version, @createdAt, @updatedAt
        )
      `)
      .run({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        projectVersion: workspace.projectVersion,
        state: workspace.state,
        initialized: workspace.initialized ? 1 : 0,
        currentMilestone: workspace.currentMilestone,
        lastSynchronization: workspace.lastSynchronization,
        repositoryFingerprint: workspace.repositoryFingerprint,
        schemaVersion: workspace.schemaVersion,
        featureFlags: JSON.stringify(workspace.featureFlags),
        version: workspace.version,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      });
  }

  /**
   * Finds a workspace by its primary key.
   *
   * @param id - The workspace id.
   * @returns The workspace, or null if not found.
   */
  findById(id: string): Workspace | null {
    const row = this.db.connection
      .prepare('SELECT * FROM workspaces WHERE id = ?')
      .get(id) as WorkspaceRow | undefined;
    return row ? this.toModel(row) : null;
  }

  /**
   * Returns all workspaces.
   */
  findAll(): Workspace[] {
    const rows = this.db.connection
      .prepare('SELECT * FROM workspaces ORDER BY created_at')
      .all() as WorkspaceRow[];
    return rows.map(r => this.toModel(r));
  }

  /**
   * Updates an existing workspace row.
   *
   * @param workspace - The workspace with updated fields.
   */
  update(workspace: Workspace): void {
    this.db.connection
      .prepare(`
        UPDATE workspaces SET
          name = @name,
          description = @description,
          project_version = @projectVersion,
          state = @state,
          initialized = @initialized,
          current_milestone = @currentMilestone,
          last_synchronization = @lastSynchronization,
          repository_fingerprint = @repositoryFingerprint,
          schema_version = @schemaVersion,
          feature_flags = @featureFlags,
          version = @version
        WHERE id = @id
      `)
      .run({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        projectVersion: workspace.projectVersion,
        state: workspace.state,
        initialized: workspace.initialized ? 1 : 0,
        currentMilestone: workspace.currentMilestone,
        lastSynchronization: workspace.lastSynchronization,
        repositoryFingerprint: workspace.repositoryFingerprint,
        schemaVersion: workspace.schemaVersion,
        featureFlags: JSON.stringify(workspace.featureFlags),
        version: workspace.version,
      });
  }

  /**
   * Deletes a workspace by id.
   *
   * @param id - The workspace id to delete.
   */
  delete(id: string): void {
    this.db.connection.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
  }

  private toModel(row: WorkspaceRow): Workspace {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      projectVersion: row.project_version,
      state: row.state as Workspace['state'],
      initialized: row.initialized === 1,
      currentMilestone: row.current_milestone,
      lastSynchronization: row.last_synchronization,
      repositoryFingerprint: row.repository_fingerprint,
      schemaVersion: row.schema_version,
      featureFlags: JSON.parse(row.feature_flags) as Record<string, boolean>,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
