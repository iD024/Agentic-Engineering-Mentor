import type { RuntimeState } from '../kernel/RuntimeState.js';

/**
 * Kernel contract.
 *
 * Exposes the boot and shutdown operations and runtime state to other
 * components. ShutdownHandler and other consumers depend on this abstraction
 * rather than the concrete Kernel class.
 */
export interface IKernel {
  /** Current runtime state. Read-only. */
  readonly state: RuntimeState;

  /**
   * Boots the application.
   *
   * Transitions: CREATED → BOOTING → READY.
   *
   * @throws If any lifecycle service fails to start.
   */
  boot(): Promise<void>;

  /**
   * Shuts down the application.
   *
   * Transitions: READY → STOPPING → STOPPED.
   * Idempotent — safe to call multiple times.
   */
  shutdown(): Promise<void>;
}
