import type { StateManager, CreateWorkspaceParams, UpdateWorkspaceParams } from '../state/StateManager.js';
import type { WorkspaceRepository } from '../repositories/WorkspaceRepository.js';
import type { Workspace } from '../models/Workspace.js';

/**
 * Business-facing workspace service.
 *
 * Why this exists: StateManager is a low-level persistence coordinator.
 * WorkspaceService adds the business rules: what constitutes a valid
 * workspace initialization, when a workspace can transition from planning to
 * active, and how workspace fingerprints are computed.
 *
 * WorkspaceService is the boundary between infrastructure (StateManager)
 * and domain logic. Future MCP tools that need to modify a workspace must
 * go through WorkspaceService, not StateManager directly.
 *
 * Who may call this:
 *   - Runtime (during startup import)
 *   - Future MCP tools
 *   - Future AI agents
 *
 * Who must NEVER call this:
 *   - Repositories (wrong direction)
 *   - StateManager (wrong direction)
 */
export class WorkspaceService {
  private readonly stateManager: StateManager;
  private readonly workspaceRepo: WorkspaceRepository;

  constructor(stateManager: StateManager, workspaceRepo: WorkspaceRepository) {
    this.stateManager = stateManager;
    this.workspaceRepo = workspaceRepo;
  }

  /**
   * Returns all workspaces.
   */
  listWorkspaces(): ReadonlyArray<Readonly<Workspace>> {
    return this.workspaceRepo.findAll();
  }

  /**
   * Returns a single workspace by id, or null.
   *
   * @param id - Workspace id.
   */
  getWorkspace(id: string): Readonly<Workspace> | null {
    return this.stateManager.loadWorkspace(id);
  }

  /**
   * Creates a new workspace with the given parameters.
   *
   * @param params - Creation parameters.
   * @returns The created workspace.
   */
  createWorkspace(params: CreateWorkspaceParams): Readonly<Workspace> {
    return this.stateManager.createWorkspace(params);
  }

  /**
   * Updates a workspace.
   *
   * @param id - Workspace id.
   * @param params - Fields to update.
   * @returns The updated workspace.
   * @throws If the workspace does not exist.
   */
  updateWorkspace(id: string, params: UpdateWorkspaceParams): Readonly<Workspace> {
    return this.stateManager.updateWorkspace(id, params);
  }

  /**
   * Marks a workspace as initialized and transitions it to active state.
   *
   * Business rule: a workspace can only be initialized once.
   * Calling this on an already-initialized workspace is a no-op.
   *
   * @param id - The workspace id.
   * @returns The updated workspace.
   */
  initializeWorkspace(id: string): Readonly<Workspace> {
    const workspace = this.stateManager.loadWorkspace(id);
    if (!workspace) {
      throw new Error(`Cannot initialize unknown workspace: ${id}`);
    }
    if (workspace.initialized) {
      return workspace;
    }
    return this.stateManager.updateWorkspace(id, {
      initialized: true,
      state: 'active',
    });
  }
}
