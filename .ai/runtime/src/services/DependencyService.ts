import type { StateManager } from '../state/StateManager.js';
import type { DependencyRepository } from '../repositories/DependencyRepository.js';
import type { DependencyMetric } from '../models/DependencyMetric.js';
import { randomUUID } from 'node:crypto';

/**
 * Business-facing dependency health service.
 *
 * Manages dependency metric records for a workspace.
 */
export class DependencyService {
  private readonly stateManager: StateManager;
  private readonly dependencyRepo: DependencyRepository;

  constructor(stateManager: StateManager, dependencyRepo: DependencyRepository) {
    this.stateManager = stateManager;
    this.dependencyRepo = dependencyRepo;
  }

  /**
   * Records a dependency metric (upsert by workspace + name).
   *
   * @param workspaceId - The workspace id.
   * @param name - The dependency name.
   * @param version - The dependency version.
   * @param outdated - Whether the dependency is outdated.
   * @param vulnerable - Whether the dependency has known vulnerabilities.
   */
  recordMetric(
    workspaceId: string,
    name: string,
    version: string,
    outdated: boolean,
    vulnerable: boolean,
  ): Readonly<DependencyMetric> {
    const all = this.dependencyRepo.findByWorkspaceId(workspaceId);
    const existing = all.find(d => d.name === name);
    const now = new Date().toISOString();

    if (existing) {
      const updated: DependencyMetric = {
        ...existing, version, outdated, vulnerable, rowVersion: existing.rowVersion + 1,
      };
      this.dependencyRepo.update(updated);
      return Object.freeze({ ...updated });
    }

    const metric: DependencyMetric = {
      id: randomUUID(), workspaceId, name, version, outdated, vulnerable,
      notes: '', rowVersion: 1, createdAt: now, updatedAt: now,
    };
    this.dependencyRepo.insert(metric);
    return Object.freeze({ ...metric });
  }

  /**
   * Lists all dependency metrics for a workspace.
   *
   * @param workspaceId - The workspace id.
   */
  listMetrics(workspaceId: string): ReadonlyArray<Readonly<DependencyMetric>> {
    return this.dependencyRepo.findByWorkspaceId(workspaceId);
  }
}
