import { randomUUID } from 'node:crypto';
import type { RuntimeState } from '../kernel/RuntimeState.js';
import type { Workspace } from '../models/Workspace.js';
import type { Session } from '../models/Session.js';

/**
 * Serialisable JSON representation of a snapshot.
 */
export interface SnapshotJSON {
  readonly id: string;
  readonly takenAt: string;
  readonly runtimeState: RuntimeState;
  readonly workspace: Readonly<Workspace> | null;
  readonly sessionCount: number;
}

/**
 * Immutable snapshot of the runtime state at a point in time.
 *
 * Why this exists: Snapshots serve three purposes:
 *   1. Rollback — if a complex operation fails, the runtime can restore a
 *      known-good snapshot rather than leaving the system in a half-written state.
 *   2. Debugging — a snapshot can be serialised and inspected offline.
 *   3. Future timeline support — future AI planning stages can use snapshots
 *      to reason about historical workspace states.
 *
 * Snapshots are immutable by construction. Once created, no field can change.
 *
 * Who creates snapshots:
 *   - StateManager (before and after significant state transitions)
 *
 * Who consumes snapshots:
 *   - StateManager (for rollback)
 *   - Future audit/debug tools
 */
export class StateSnapshot {
  /** Unique identifier for this snapshot. */
  readonly id: string;

  /** ISO-8601 timestamp of when the snapshot was taken. */
  readonly takenAt: string;

  /** The runtime lifecycle state at snapshot time. */
  readonly runtimeState: RuntimeState;

  /** Frozen copy of the workspace at snapshot time. */
  readonly workspace: Readonly<Workspace> | null;

  /** Frozen copy of all active sessions at snapshot time. */
  readonly sessions: ReadonlyArray<Readonly<Session>>;

  private constructor(
    id: string,
    takenAt: string,
    runtimeState: RuntimeState,
    workspace: Workspace | null,
    sessions: Session[],
  ) {
    this.id = id;
    this.takenAt = takenAt;
    this.runtimeState = runtimeState;
    this.workspace = workspace !== null ? Object.freeze({ ...workspace }) : null;
    this.sessions = Object.freeze(sessions.map(s => Object.freeze({ ...s })));
  }

  /**
   * Creates a new immutable snapshot.
   *
   * @param runtimeState - Current runtime state.
   * @param workspace - Current workspace, or null if not loaded.
   * @param sessions - Current active sessions.
   */
  static create(
    runtimeState: RuntimeState,
    workspace: Workspace | null,
    sessions: Session[],
  ): StateSnapshot {
    return new StateSnapshot(
      randomUUID(),
      new Date().toISOString(),
      runtimeState,
      workspace,
      sessions,
    );
  }

  /**
   * Returns a plain JSON-serialisable representation of this snapshot.
   */
  toJSON(): SnapshotJSON {
    return {
      id: this.id,
      takenAt: this.takenAt,
      runtimeState: this.runtimeState,
      workspace: this.workspace,
      sessionCount: this.sessions.length,
    };
  }
}
