import { IQuery, IQueryHandler } from './interfaces.js';
import type { StateManager } from '../../state/StateManager.js';
import type { Workspace } from '../../models/Workspace.js';
import type { Session } from '../../models/Session.js';
import type { Milestone } from '../../models/Milestone.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface WorkspaceSummary {
  workspace: Workspace | null;
  activeSession: Session | null;
  recentSessions: ReadonlyArray<Readonly<Session>>;
  milestones: ReadonlyArray<Readonly<Milestone>>;
  repositories: any[];
  knowledgeSources: any[];
  profiles: any;
  learningGoals: any;
  recentActivity: string[];
}

export class GetWorkspaceSummaryQuery implements IQuery<WorkspaceSummary> {
  readonly type = 'GetWorkspaceSummaryQuery';
  constructor(public readonly workspaceId: string, public readonly workspaceRoot: string) {}
}

export class GetWorkspaceSummaryQueryHandler implements IQueryHandler<GetWorkspaceSummaryQuery, WorkspaceSummary> {
  readonly queryType = 'GetWorkspaceSummaryQuery';

  constructor(private readonly stateManager: StateManager) {}

  async execute(query: GetWorkspaceSummaryQuery): Promise<WorkspaceSummary> {
    const workspace = this.stateManager.loadWorkspace(query.workspaceId);
    const sessions = this.stateManager.getSessions ? this.stateManager.getSessions(query.workspaceId) : [];
    const milestones = this.stateManager.getMilestones ? this.stateManager.getMilestones(query.workspaceId) : [];

    let repositories = [];
    let knowledgeSources = [];
    let profiles = {};
    let learningGoals = {};

    try {
      const workspaceJsonPath = path.join(query.workspaceRoot, '.ai', 'workspace.json');
      const raw = await fs.readFile(workspaceJsonPath, 'utf-8');
      const workspaceJson = JSON.parse(raw);
      repositories = workspaceJson.repositories || [];
      knowledgeSources = workspaceJson.knowledge || [];
      profiles = workspaceJson.profiles || {};
      learningGoals = workspaceJson.initialization || {};
    } catch (e) {
      // workspace.json might not exist or be invalid
    }

    const activeSession = sessions.find(s => s.state === 'active') || null;
    const recentSessions = [...sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, 5);

    const recentActivity = [];
    if (activeSession) {
      recentActivity.push(`Active session started at ${activeSession.startedAt}`);
    }
    if (repositories.length > 0) {
      recentActivity.push(`Managed repositories: ${repositories.length}`);
    }

    return {
      workspace,
      activeSession,
      recentSessions,
      milestones,
      repositories,
      knowledgeSources,
      profiles,
      learningGoals,
      recentActivity
    };
  }
}

