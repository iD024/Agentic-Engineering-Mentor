import { IQuery, IQueryHandler } from './interfaces.js';
import type { StateManager } from '../../state/StateManager.js';
import type { Workspace } from '../../models/Workspace.js';
import type { Session } from '../../models/Session.js';

export interface WorkspaceSummary {
  workspace: Workspace | null;
  activeSession: Session | null;
  recentSessions: Session[];
  // Other details could be gathered from knowledge, validation, repos, etc.
}

export class GetWorkspaceSummaryQuery implements IQuery<WorkspaceSummary> {
  readonly type = 'GetWorkspaceSummaryQuery';
  constructor(public readonly workspaceId: string) {}
}

export class GetWorkspaceSummaryQueryHandler implements IQueryHandler<GetWorkspaceSummaryQuery, WorkspaceSummary> {
  readonly queryType = 'GetWorkspaceSummaryQuery';

  constructor(private readonly stateManager: StateManager) {}

  async execute(query: GetWorkspaceSummaryQuery): Promise<WorkspaceSummary> {
    const workspace = this.stateManager.loadWorkspace(query.workspaceId);
    
    // As a simplification for now, we'll retrieve sessions via some repo or stateManager if available.
    // If not, we just return basic info. 
    // Wait, StateManager doesn't expose getSessions natively? 
    // We can just rely on the snapshot or build a comprehensive object.
    
    return {
      workspace,
      activeSession: null, // Placeholder: Would fetch from SessionRepository
      recentSessions: [], // Placeholder
    };
  }
}
