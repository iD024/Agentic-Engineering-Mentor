import type { IQuery, IQueryHandler } from './interfaces.js';
import type { Workspace } from '../../models/Workspace.js';
import type { StateManager } from '../../state/StateManager.js';

export class GetWorkspaceQuery implements IQuery<Workspace | null> {
  readonly type = 'GetWorkspaceQuery';
  constructor(public readonly workspaceId: string) {}
}

export class GetWorkspaceQueryHandler implements IQueryHandler<GetWorkspaceQuery, Workspace | null> {
  readonly queryType = 'GetWorkspaceQuery';

  constructor(private readonly stateManager: StateManager) {}

  async execute(query: GetWorkspaceQuery): Promise<Workspace | null> {
    return this.stateManager.loadWorkspace(query.workspaceId);
  }
}
