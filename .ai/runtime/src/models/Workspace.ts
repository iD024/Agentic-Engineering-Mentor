/**
 * Workspace model.
 *
 * Why this exists: The Workspace is the root domain entity. Every other
 * entity (Session, Milestone, LearningProgress) belongs to a Workspace.
 * Keeping the model as a plain TypeScript interface (no ORM, no class)
 * ensures it can be constructed, compared, and frozen trivially.
 */

/** Possible states of a workspace's engineering lifecycle. */
export type WorkspaceState = 'planning' | 'active' | 'paused' | 'completed';

/** Immutable workspace domain model. */
export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly projectVersion: string;
  readonly state: WorkspaceState;
  readonly initialized: boolean;
  readonly currentMilestone: string | null;
  readonly lastSynchronization: string;
  readonly repositoryFingerprint: string;
  readonly schemaVersion: string;
  readonly featureFlags: Record<string, boolean>;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Validates that a string is a non-empty workspace state. */
export function isWorkspaceState(value: unknown): value is WorkspaceState {
  return value === 'planning' || value === 'active' || value === 'paused' || value === 'completed';
}

/** Creates a default workspace with the given id. */
export function createDefaultWorkspace(id: string): Workspace {
  const now = new Date().toISOString();
  return {
    id,
    name: '',
    description: '',
    projectVersion: '0.1.0',
    state: 'planning',
    initialized: false,
    currentMilestone: null,
    lastSynchronization: '',
    repositoryFingerprint: '',
    schemaVersion: '1.0',
    featureFlags: {},
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}
