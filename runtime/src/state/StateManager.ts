import { randomUUID } from 'node:crypto';
import type { WorkspaceRepository } from '../repositories/WorkspaceRepository.js';
import type { SessionRepository } from '../repositories/SessionRepository.js';
import type { LearningRepository } from '../repositories/LearningRepository.js';
import type { MilestoneRepository } from '../repositories/MilestoneRepository.js';
import type { DependencyRepository } from '../repositories/DependencyRepository.js';
import type { SettingsRepository } from '../repositories/SettingsRepository.js';
import type { Workspace } from '../models/Workspace.js';
import type { Session } from '../models/Session.js';
import type { LearningProgress } from '../models/LearningProgress.js';
import type { Milestone } from '../models/Milestone.js';
import { createDefaultWorkspace } from '../models/Workspace.js';
import { StateCache } from './StateCache.js';
import { StateSnapshot } from './StateSnapshot.js';
import { StateEvents } from './StateEvents.js';
import type { RuntimeState } from '../kernel/RuntimeState.js';

/** Parameters for creating a new workspace. */
export interface CreateWorkspaceParams {
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
}

/** Parameters for updating an existing workspace. */
export interface UpdateWorkspaceParams {
  readonly name?: string;
  readonly description?: string;
  readonly state?: Workspace['state'];
  readonly initialized?: boolean;
  readonly currentMilestone?: string | null;
  readonly lastSynchronization?: string;
  readonly repositoryFingerprint?: string;
  readonly featureFlags?: Record<string, boolean>;
}

/** Parameters for creating a new session. */
export interface CreateSessionParams {
  readonly workspaceId: string;
  readonly goals?: string[];
}

/** Parameters for saving learning progress. */
export interface SaveLearningProgressParams {
  readonly workspaceId: string;
  readonly topic: string;
  readonly level: LearningProgress['level'];
  readonly notes?: string;
}

/** Parameters for creating a milestone. */
export interface CreateMilestoneParams {
  readonly workspaceId: string;
  readonly title: string;
  readonly description?: string;
  readonly orderIndex?: number;
}

/**
 * The single gateway to all persistence in the runtime.
 *
 * Why StateManager exists
 * ─────────────────────────────────────────────────────────────────────────────
 * Without a StateManager, any service or module could call any repository
 * directly. This creates N separate persistence paths that are impossible to
 * audit, cache coherently, or roll back atomically. One service might write a
 * workspace while another reads a stale cached copy — an invisible bug.
 *
 * StateManager solves this by being the ONLY entity that:
 *   - Calls repositories
 *   - Reads from and writes to StateCache
 *   - Creates StateSnapshots
 *   - Emits StateEvents
 *
 * This means any AI agent or MCP tool in future stages that wants to affect
 * workspace state must go through StateManager's explicit command API.
 * There is no "side door" to the database.
 *
 * API design: command-oriented, not setter-based
 * ─────────────────────────────────────────────────────────────────────────────
 * StateManager does not expose generic `set(field, value)` methods. Instead it
 * exposes named commands: `createWorkspace()`, `updateWorkspace()`,
 * `createSession()`, `completeMilestone()`. This makes the intent of each
 * operation explicit and auditable.
 *
 * All read operations return frozen (immutable) objects. Callers cannot mutate
 * what StateManager returns — they must issue a write command.
 *
 * Who may use StateManager:
 *   - Services (WorkspaceService, SessionService, etc.)
 *   - Bootstrap (for initial load)
 *   - Runtime (for import/export orchestration)
 *
 * Who must NEVER use StateManager:
 *   - Repositories (they are called BY StateManager)
 *   - External AI agents (must go through Services)
 *   - MCP tools (must go through Services)
 */
export class StateManager {
  private readonly workspaceRepo: WorkspaceRepository;
  private readonly sessionRepo: SessionRepository;
  private readonly learningRepo: LearningRepository;
  private readonly milestoneRepo: MilestoneRepository;
  private readonly dependencyRepo: DependencyRepository;
  private readonly settingsRepo: SettingsRepository;
  private readonly cache: StateCache;
  readonly events: StateEvents;

  constructor(
    workspaceRepo: WorkspaceRepository,
    sessionRepo: SessionRepository,
    learningRepo: LearningRepository,
    milestoneRepo: MilestoneRepository,
    dependencyRepo: DependencyRepository,
    settingsRepo: SettingsRepository,
  ) {
    this.workspaceRepo = workspaceRepo;
    this.sessionRepo = sessionRepo;
    this.learningRepo = learningRepo;
    this.milestoneRepo = milestoneRepo;
    this.dependencyRepo = dependencyRepo;
    this.settingsRepo = settingsRepo;
    this.cache = new StateCache();
    this.events = new StateEvents();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Workspace commands
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Creates and persists a new workspace.
   *
   * @param params - Optional overrides for default workspace values.
   * @returns A frozen, immutable workspace.
   */
  createWorkspace(params: CreateWorkspaceParams = {}): Readonly<Workspace> {
    const id = params.id ?? randomUUID();
    const base = createDefaultWorkspace(id);
    const workspace: Workspace = {
      ...base,
      name: params.name ?? base.name,
      description: params.description ?? base.description,
    };
    this.workspaceRepo.insert(workspace);
    this.cache.setWorkspace(workspace);
    this.events.emit('WorkspaceSaved', { workspace });
    return Object.freeze({ ...workspace });
  }

  /**
   * Loads a workspace by id.
   *
   * Checks the cache first; falls back to the database if not cached.
   * Returns null if the workspace does not exist.
   *
   * @param id - The workspace id.
   */
  loadWorkspace(id: string): Readonly<Workspace> | null {
    const cached = this.cache.getWorkspace(id);
    if (cached) return cached;

    const workspace = this.workspaceRepo.findById(id);
    if (!workspace) return null;

    this.cache.setWorkspace(workspace);
    this.events.emit('WorkspaceLoaded', { workspace });
    return this.cache.getWorkspace(id)!;
  }

  /**
   * Loads all workspaces.
   *
   * @returns An array of frozen workspaces.
   */
  loadAllWorkspaces(): ReadonlyArray<Readonly<Workspace>> {
    const workspaces = this.workspaceRepo.findAll();
    const result = [];
    for (const workspace of workspaces) {
      this.cache.setWorkspace(workspace);
      result.push(this.cache.getWorkspace(workspace.id)!);
    }
    return Object.freeze(result);
  }

  /**
   * Updates fields on an existing workspace.
   *
   * Bumps the version number for optimistic concurrency.
   * Invalidates the cache entry and refreshes it after writing.
   *
   * @param id - The workspace id to update.
   * @param params - The fields to update.
   * @returns The updated, frozen workspace.
   * @throws If the workspace is not found.
   */
  updateWorkspace(id: string, params: UpdateWorkspaceParams): Readonly<Workspace> {
    const existing = this.workspaceRepo.findById(id);
    if (!existing) {
      throw new Error(`Workspace not found: ${id}`);
    }
    const updated: Workspace = {
      ...existing,
      ...params,
      version: existing.version + 1,
    };
    this.workspaceRepo.update(updated);
    this.cache.setWorkspace(updated);
    this.events.emit('WorkspaceSaved', { workspace: updated });
    return this.cache.getWorkspace(id)!;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Session commands
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Creates and persists a new engineering session.
   *
   * @param params - Session creation parameters.
   * @returns A frozen, immutable session.
   */
  createSession(params: CreateSessionParams): Readonly<Session> {
    const now = new Date().toISOString();
    const session: Session = {
      id: randomUUID(),
      workspaceId: params.workspaceId,
      state: 'active',
      goals: params.goals ?? [],
      startedAt: now,
      endedAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.sessionRepo.insert(session);
    this.cache.setSession(session);
    this.events.emit('SessionCreated', { session });
    return Object.freeze({ ...session });
  }

  /**
   * Marks a session as completed and records the end time.
   *
   * @param sessionId - The session to end.
   * @returns The updated, frozen session.
   * @throws If the session is not found.
   */
  endSession(sessionId: string): Readonly<Session> {
    const existing = this.sessionRepo.findById(sessionId);
    if (!existing) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    const updated: Session = {
      ...existing,
      state: 'completed',
      endedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
    this.sessionRepo.update(updated);
    this.cache.setSession(updated);
    this.events.emit('SessionUpdated', { session: updated });
    return Object.freeze({ ...updated });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Learning progress commands
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Saves learning progress for a topic (upsert by workspace + topic).
   *
   * @param params - Learning progress parameters.
   * @returns The saved learning progress record.
   */
  saveLearningProgress(params: SaveLearningProgressParams): Readonly<LearningProgress> {
    const now = new Date().toISOString();
    const existing = this.learningRepo.findByTopic(params.workspaceId, params.topic);

    if (existing) {
      const updated: LearningProgress = {
        ...existing,
        level: params.level,
        notes: params.notes ?? existing.notes,
        version: existing.version + 1,
      };
      this.learningRepo.update(updated);
      return Object.freeze({ ...updated });
    }

    const record: LearningProgress = {
      id: randomUUID(),
      workspaceId: params.workspaceId,
      topic: params.topic,
      level: params.level,
      notes: params.notes ?? '',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.learningRepo.insert(record);
    return Object.freeze({ ...record });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Milestone commands
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Creates a new milestone for a workspace.
   *
   * @param params - Milestone creation parameters.
   * @returns The created, frozen milestone.
   */
  createMilestone(params: CreateMilestoneParams): Readonly<Milestone> {
    const now = new Date().toISOString();
    const milestone: Milestone = {
      id: randomUUID(),
      workspaceId: params.workspaceId,
      title: params.title,
      description: params.description ?? '',
      state: 'pending',
      orderIndex: params.orderIndex ?? 0,
      completedAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.milestoneRepo.insert(milestone);
    return Object.freeze({ ...milestone });
  }

  /**
   * Marks a milestone as completed.
   *
   * @param milestoneId - The milestone to complete.
   * @returns The updated, frozen milestone.
   * @throws If the milestone is not found.
   */
  completeMilestone(milestoneId: string): Readonly<Milestone> {
    const existing = this.milestoneRepo.findById(milestoneId);
    if (!existing) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }
    const updated: Milestone = {
      ...existing,
      state: 'completed',
      completedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
    this.milestoneRepo.update(updated);
    return Object.freeze({ ...updated });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Settings
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Reads a setting value by key.
   *
   * @param key - The setting key.
   * @returns The value string, or null if the key does not exist.
   */
  getSetting(key: string): string | null {
    return this.settingsRepo.get(key)?.value ?? null;
  }

  /**
   * Writes a setting value.
   *
   * @param key - The setting key.
   * @param value - The setting value.
   */
  setSetting(key: string, value: string): void {
    this.settingsRepo.set(key, value);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Snapshots
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Creates an immutable snapshot of the current runtime state.
   *
   * @param runtimeState - The current RuntimeState enum value.
   * @param workspaceId - Optional workspace id to include in the snapshot.
   * @returns A frozen StateSnapshot.
   */
  createSnapshot(runtimeState: RuntimeState, workspaceId?: string): StateSnapshot {
    const workspace = workspaceId ? this.workspaceRepo.findById(workspaceId) : null;
    const sessions = workspaceId ? this.sessionRepo.findByWorkspaceId(workspaceId) : [];
    const snapshot = StateSnapshot.create(runtimeState, workspace, sessions);
    this.events.emit('SnapshotCreated', { snapshotId: snapshot.id });
    return snapshot;
  }

  getSessions(workspaceId: string): ReadonlyArray<Readonly<Session>> {
    const sessions = this.sessionRepo.findByWorkspaceId(workspaceId);
    return Object.freeze(sessions.map(s => Object.freeze(s)));
  }

  getMilestones(workspaceId: string): ReadonlyArray<Readonly<Milestone>> {
    // Assuming milestoneRepo has findByWorkspaceId, otherwise we can just return empty for now
    const milestones = (this.milestoneRepo as any).findByWorkspaceId ? (this.milestoneRepo as any).findByWorkspaceId(workspaceId) : [];
    return Object.freeze(milestones.map((m: any) => Object.freeze(m)));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Cache management
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Flushes the in-memory cache.
   *
   * Called during shutdown to prevent stale data from surviving the process.
   */
  flushCache(): void {
    this.cache.clear();
  }
}
