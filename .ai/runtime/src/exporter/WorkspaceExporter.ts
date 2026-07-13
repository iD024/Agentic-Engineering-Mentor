import { join } from 'node:path';
import type { StateManager } from '../state/StateManager.js';
import type { WorkspaceRepository } from '../repositories/WorkspaceRepository.js';
import type { ExportResult } from './ExportResult.js';
import { JsonExporter } from './JsonExporter.js';

/**
 * Exports the canonical workspace state from SQLite to workspace.json.
 *
 * Why this exists: SQLite is the authoritative source of truth. But the
 * Engineering Workspace's legacy contract is that a human-readable
 * workspace.json file exists in the `.ai/` directory. The exporter bridges
 * these two representations: it reads the definitive state from SQLite
 * (via StateManager) and writes a JSON snapshot for Git history and human
 * readability.
 *
 * Important: workspace.json is a SNAPSHOT for Git. It is never read by the
 * runtime on startup — the runtime always reads from SQLite. workspace.json
 * serves human operators and external tooling.
 *
 * The export runs:
 *   - After every significant state change (via StateEvents.WorkspaceSaved)
 *   - During graceful shutdown (via Runtime.stop())
 *
 * Who calls this:
 *   - Runtime (wires the WorkspaceSaved event listener)
 *
 * Who must NEVER call this:
 *   - Repositories, StateManager, Services
 */
export class WorkspaceExporter {
  private readonly stateManager: StateManager;
  private readonly workspaceRepo: WorkspaceRepository;
  private readonly jsonExporter: JsonExporter;

  constructor(stateManager: StateManager, workspaceRepo: WorkspaceRepository) {
    this.stateManager = stateManager;
    this.workspaceRepo = workspaceRepo;
    this.jsonExporter = new JsonExporter();
  }

  /**
   * Exports the workspace with the given id to `.ai/workspace.json`.
   *
   * @param workspaceRoot - Absolute path to the repository root.
   * @param workspaceId - The workspace id to export.
   * @returns An ExportResult describing success or failure.
   */
  async export(workspaceRoot: string, workspaceId: string): Promise<ExportResult> {
    const warnings: string[] = [];

    try {
      const workspace = this.stateManager.loadWorkspace(workspaceId);
      if (!workspace) {
        return {
          success: false,
          error: `Workspace not found: ${workspaceId}`,
          warnings,
        };
      }

      const outputPath = join(workspaceRoot, '.ai', 'workspace.json');

      const json = {
        schemaVersion: workspace.schemaVersion,
        workspaceVersion: workspace.projectVersion,
        exportedAt: new Date().toISOString(),
        project: {
          name: workspace.name,
          description: workspace.description,
          version: workspace.projectVersion,
        },
        workspace: {
          initialized: workspace.initialized,
          state: workspace.state,
          currentMilestone: workspace.currentMilestone,
          lastSynchronization: workspace.lastSynchronization,
          repositoryFingerprint: workspace.repositoryFingerprint,
        },
        featureFlags: workspace.featureFlags,
        _meta: {
          source: 'sqlite',
          runtimeVersion: this.stateManager.getSetting('runtime.version') ?? '2.0.0',
          stage: parseInt(this.stateManager.getSetting('runtime.stage') ?? '2', 10),
        },
      };

      this.jsonExporter.write(json, outputPath);

      return { success: true, outputPath, warnings };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        warnings,
      };
    }
  }
}
