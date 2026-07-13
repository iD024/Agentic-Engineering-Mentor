import { RuntimeState } from '../kernel/RuntimeState.js';

/**
 * Why StateTransitionGuard exists
 * ─────────────────────────────────────────────────────────────────────────────
 * Without a guard, any code anywhere in the runtime can write any state value.
 * That creates a class of bugs that are invisible until runtime: a service
 * attempting to go from STOPPED back to READY, a race condition leaving the
 * system in BOOTING forever, or a shutdown sequence that never emits STOPPED.
 *
 * The StateTransitionGuard solves this by encoding the ONLY legal transitions
 * as a compile-time-verified map. Every state change in the entire runtime
 * must pass through this guard. If a transition is not in the map, it throws
 * a descriptive error immediately — making illegal states impossible by design.
 *
 * This is the same pattern used in formal state machines and is the foundation
 * that makes the runtime safe for AI agents and MCP tools to interact with:
 * no external actor can drive the runtime into an undefined state.
 *
 * Valid transitions:
 *
 *   CREATED  ──► BOOTING
 *   BOOTING  ──► READY
 *   READY    ──► STOPPING
 *   STOPPING ──► STOPPED
 *   ANY      ──► FAILED   (error escape hatch from any state)
 *
 * Who may use this:
 *   - StateManager (the only entity permitted to change RuntimeState)
 *
 * Who must NEVER use this:
 *   - Services, Repositories, Importers, Exporters
 *   - External AI agents or MCP tools
 */
export class StateTransitionGuard {
  /**
   * Legal transitions as a map of `from` → Set of allowed `to` states.
   * FAILED is always a legal destination and is handled separately.
   */
  private static readonly ALLOWED: ReadonlyMap<RuntimeState, ReadonlySet<RuntimeState>> = new Map([
    [RuntimeState.CREATED,  new Set([RuntimeState.BOOTING])],
    [RuntimeState.BOOTING,  new Set([RuntimeState.READY])],
    [RuntimeState.READY,    new Set([RuntimeState.STOPPING])],
    [RuntimeState.STOPPING, new Set([RuntimeState.STOPPED])],
    [RuntimeState.STOPPED,  new Set<RuntimeState>()],
    [RuntimeState.FAILED,   new Set<RuntimeState>()],
  ]);

  /**
   * Asserts that transitioning from `from` to `to` is legal.
   *
   * @param from - The current runtime state.
   * @param to - The desired next runtime state.
   * @throws `Error` with a descriptive message if the transition is not allowed.
   */
  assertCanTransition(from: RuntimeState, to: RuntimeState): void {
    // FAILED is always reachable — it is the universal error escape hatch.
    if (to === RuntimeState.FAILED) {
      return;
    }

    const allowed = StateTransitionGuard.ALLOWED.get(from);
    if (!allowed || !allowed.has(to)) {
      throw new Error(
        `Invalid state transition: ${from} → ${to}. ` +
        `Allowed transitions from ${from}: ${
          [...(allowed ?? [])].join(', ') || 'none'
        }`
      );
    }
  }

  /**
   * Validates the transition and returns the new state.
   *
   * Convenience wrapper over `assertCanTransition` for use in assignment.
   *
   * @param current - The current runtime state.
   * @param to - The desired next runtime state.
   * @returns `to` if the transition is valid.
   * @throws `Error` if the transition is not allowed.
   */
  transition(current: RuntimeState, to: RuntimeState): RuntimeState {
    this.assertCanTransition(current, to);
    return to;
  }
}
