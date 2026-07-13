import type { StateManager, CreateSessionParams } from '../state/StateManager.js';
import type { SessionRepository } from '../repositories/SessionRepository.js';
import type { Session } from '../models/Session.js';

/**
 * Business-facing session service.
 *
 * Manages the lifecycle of engineering sessions.
 * Business rule: only one active session per workspace at a time.
 */
export class SessionService {
  private readonly stateManager: StateManager;
  private readonly sessionRepo: SessionRepository;

  constructor(stateManager: StateManager, sessionRepo: SessionRepository) {
    this.stateManager = stateManager;
    this.sessionRepo = sessionRepo;
  }

  /**
   * Starts a new engineering session for a workspace.
   *
   * Business rule: abandons any currently active session before starting a new one.
   *
   * @param params - Session creation parameters.
   * @returns The new session.
   */
  startSession(params: CreateSessionParams): Readonly<Session> {
    const active = this.getActiveSession(params.workspaceId);
    if (active) {
      // Abandon the stale session before starting a new one.
      this.sessionRepo.update({ ...active, state: 'abandoned' });
    }
    return this.stateManager.createSession(params);
  }

  /**
   * Ends the currently active session for a workspace.
   *
   * @param workspaceId - The workspace whose active session to end.
   * @returns The ended session, or null if no active session.
   */
  endActiveSession(workspaceId: string): Readonly<Session> | null {
    const active = this.getActiveSession(workspaceId);
    if (!active) return null;
    return this.stateManager.endSession(active.id);
  }

  /**
   * Returns the currently active session for a workspace, or null.
   *
   * @param workspaceId - The workspace id.
   */
  getActiveSession(workspaceId: string): Readonly<Session> | null {
    const sessions = this.sessionRepo.findByWorkspaceId(workspaceId);
    return sessions.find(s => s.state === 'active') ?? null;
  }

  /**
   * Lists all sessions for a workspace.
   *
   * @param workspaceId - The workspace id.
   */
  listSessions(workspaceId: string): ReadonlyArray<Readonly<Session>> {
    return this.sessionRepo.findByWorkspaceId(workspaceId);
  }
}
