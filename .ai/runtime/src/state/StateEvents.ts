import type { Workspace } from '../models/Workspace.js';
import type { Session } from '../models/Session.js';

/**
 * Local state event types.
 *
 * Why this exists: StateEvents provides lightweight synchronous notifications
 * for persistence operations. This is NOT the global async Event Bus planned
 * for later stages — it is strictly local to the state layer and used only
 * for observability and cache coordination.
 *
 * Examples of consumers:
 *   - WorkspaceExporter listens to WorkspaceSaved to trigger JSON export
 *   - Future ChangeLog component listens to TransactionCommitted
 *
 * Who may use this:
 *   - StateManager (emits events)
 *   - WorkspaceExporter (listens to WorkspaceSaved)
 *
 * Who must NEVER use this:
 *   - Repositories (they know nothing about events)
 *   - External agents (use the future Event Bus instead)
 */
export type StateEventType =
  | 'WorkspaceLoaded'
  | 'WorkspaceSaved'
  | 'SessionCreated'
  | 'SessionUpdated'
  | 'SnapshotCreated'
  | 'TransactionCommitted'
  | 'TransactionRolledBack';

/** Payload shapes for each state event. */
export interface StateEventPayloads {
  WorkspaceLoaded: { workspace: Readonly<Workspace> };
  WorkspaceSaved: { workspace: Readonly<Workspace> };
  SessionCreated: { session: Readonly<Session> };
  SessionUpdated: { session: Readonly<Session> };
  SnapshotCreated: { snapshotId: string };
  TransactionCommitted: { description: string };
  TransactionRolledBack: { description: string; reason: string };
}

/** Listener callback for a specific state event. */
export type StateEventListener<T extends StateEventType> = (
  payload: StateEventPayloads[T]
) => void;

/**
 * Lightweight synchronous event emitter for state-layer events.
 *
 * Invokes listeners synchronously in registration order.
 */
export class StateEvents {
  private readonly listeners = new Map<StateEventType, Array<(payload: unknown) => void>>();

  /**
   * Registers a listener for a state event.
   *
   * @param event - The event type.
   * @param listener - Callback invoked when the event fires.
   */
  on<T extends StateEventType>(event: T, listener: StateEventListener<T>): void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener as (payload: unknown) => void);
    this.listeners.set(event, existing);
  }

  /**
   * Emits a state event, invoking all registered listeners synchronously.
   *
   * @param event - The event type.
   * @param payload - The event payload.
   */
  emit<T extends StateEventType>(event: T, payload: StateEventPayloads[T]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(payload);
    }
  }
}
