/** Possible states of an engineering session. */
export type SessionState = 'active' | 'completed' | 'abandoned';

/** Immutable session domain model. */
export interface Session {
  readonly id: string;
  readonly workspaceId: string;
  readonly state: SessionState;
  readonly goals: string[];
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Validates that a value is a valid SessionState. */
export function isSessionState(value: unknown): value is SessionState {
  return value === 'active' || value === 'completed' || value === 'abandoned';
}
