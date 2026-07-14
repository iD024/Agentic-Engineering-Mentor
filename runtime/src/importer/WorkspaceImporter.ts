import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { StateManager } from '../state/StateManager.js';
import type { ImportResult } from './ImportResult.js';
import type { Workspace } from '../models/Workspace.js';
import { randomUUID } from 'node:crypto';

/**
 * The v1 workspace.json format (what we are importing FROM).
 * Kept private — callers only see ImportResult.
 */
interface LegacyWorkspaceJson {
  schemaVersion?: string;
  workspaceVersion?: string;
  project?: {
    name?: string;
    description?: string;
    version?: string;
  };
  workspace?: {
    initialized?: boolean;
    state?: string;
    currentMilestone?: string | null;
    lastSynchronization?: string;
    repositoryFingerprint?: string;
  };
  featureFlags?: Record<string, boolean>;
}

/**
 * Imports a v1 workspace into the Stage 2 SQLite schema.
 *
 * Why this exists: The v1 workspace lives in `.ai/workspace.json` (JSON) and
 * optionally in `.ai/core/` Markdown files. The importer reads those files,
 * converts them to domain models, and persists them via StateManager.
 *
 * The importer is the ONLY component that reads the legacy file system.
 * After the import runs, SQLite becomes the authoritative source of truth
 * and the legacy files are treated as read-only historical artifacts.
 *
 * Extensibility: The importer is structured as a series of discrete `import*`
 * methods (importWorkspace, importSettings, ...). Adding support for a new
 * legacy format means adding a new `import*` method — no rewriting of the
 * orchestration logic.
 *
 * Who calls this:
 *   - Runtime.start() during the boot sequence, before READY is declared
 *
 * Who must NEVER call this:
 *   - StateManager (it should not know about the file system)
 *   - Repositories (wrong layer)
 */
export class WorkspaceImporter {
  private readonly stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Runs the full import pipeline for a workspace root directory.
   *
   * @param workspaceRoot - Absolute path to the repository root (where `.ai/` lives).
   * @returns An ImportResult describing success, the workspace id, or any errors.
   */
  async import(workspaceRoot: string): Promise<ImportResult> {
    const warnings: string[] = [];
    const processedFiles: string[] = [];

    try {
      const workspaceJsonPath = join(workspaceRoot, '.ai', 'workspace.json');
      if (!existsSync(workspaceJsonPath)) {
        return {
          success: false,
          error: `workspace.json not found at ${workspaceJsonPath}`,
          warnings,
          processedFiles,
        };
      }

      const raw = readFileSync(workspaceJsonPath, 'utf-8');
      processedFiles.push(workspaceJsonPath);

      const legacy = JSON.parse(raw) as LegacyWorkspaceJson;
      const workspaceId = await this.importWorkspace(legacy, warnings);

      return { success: true, workspaceId, warnings, processedFiles };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        warnings,
        processedFiles,
      };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private import methods (one per legacy entity type)
  // ──────────────────────────────────────────────────────────────────────────

  private async importWorkspace(
    legacy: LegacyWorkspaceJson,
    warnings: string[],
  ): Promise<string> {
    const legacyState = legacy.workspace?.state ?? 'planning';
    const validStates = ['planning', 'active', 'paused', 'completed'] as const;
    const state = validStates.includes(legacyState as Workspace['state'])
      ? (legacyState as Workspace['state'])
      : 'planning';

    if (!validStates.includes(legacyState as Workspace['state'])) {
      warnings.push(`Unknown workspace state "${legacyState}", defaulting to "planning"`);
    }

    // Check if a workspace with these characteristics already exists.
    // We use a deterministic id derived from the workspace root fingerprint.
    // For simplicity in Stage 2, we look for any existing workspace and update it,
    // or create a new one if none exists.
    const existingId = this.stateManager.getSetting('workspace.primaryId');

    if (existingId) {
      const existing = this.stateManager.loadWorkspace(existingId);
      if (existing) {
        this.stateManager.updateWorkspace(existingId, {
          name: legacy.project?.name ?? existing.name,
          description: legacy.project?.description ?? existing.description,
          state,
          initialized: legacy.workspace?.initialized ?? existing.initialized,
          currentMilestone: legacy.workspace?.currentMilestone ?? existing.currentMilestone,
          lastSynchronization: legacy.workspace?.lastSynchronization ?? existing.lastSynchronization,
          repositoryFingerprint: legacy.workspace?.repositoryFingerprint ?? existing.repositoryFingerprint,
          featureFlags: this.parseFeatureFlags(legacy.featureFlags ?? {}),
        });
        return existingId;
      }
    }

    const workspace = this.stateManager.createWorkspace({
      id: randomUUID(),
      name: legacy.project?.name ?? '',
      description: legacy.project?.description ?? '',
    });

    this.stateManager.updateWorkspace(workspace.id, {
      state,
      initialized: legacy.workspace?.initialized ?? false,
      currentMilestone: legacy.workspace?.currentMilestone ?? null,
      lastSynchronization: legacy.workspace?.lastSynchronization ?? '',
      repositoryFingerprint: legacy.workspace?.repositoryFingerprint ?? '',
      featureFlags: this.parseFeatureFlags(legacy.featureFlags ?? {}),
    });

    // Record the primary workspace id in settings for idempotent re-runs.
    this.stateManager.setSetting('workspace.primaryId', workspace.id);

    return workspace.id;
  }

  private parseFeatureFlags(raw: Record<string, unknown>): Record<string, boolean> {
    const flags: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'boolean') {
        flags[key] = value;
      }
    }
    return flags;
  }
}
