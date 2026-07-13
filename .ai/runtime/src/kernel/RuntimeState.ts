/**
 * Runtime state machine.
 *
 * Owned exclusively by the Kernel. Every startup and shutdown transition
 * updates the state deterministically. Other components receive read-only access.
 *
 * Valid transitions:
 * ```
 * CREATED ──boot()──► BOOTING ──success──► READY
 *                         │                  │
 *                       error              shutdown()
 *                         │                  │
 *                         ▼                  ▼
 *                       FAILED ◄──error── STOPPING ──success──► STOPPED
 * ```
 */
export enum RuntimeState {
  /** Initial state after construction, before boot() is called. */
  CREATED = 'CREATED',

  /** Boot sequence in progress — starting lifecycle services. */
  BOOTING = 'BOOTING',

  /** All services started successfully — application is operational. */
  READY = 'READY',

  /** Graceful shutdown in progress — stopping lifecycle services. */
  STOPPING = 'STOPPING',

  /** All services stopped — application has exited cleanly. */
  STOPPED = 'STOPPED',

  /** An unrecoverable error occurred during boot or shutdown. */
  FAILED = 'FAILED',
}
