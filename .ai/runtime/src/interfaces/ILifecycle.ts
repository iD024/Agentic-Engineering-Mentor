/**
 * Lifecycle contract for services managed by the LifecycleManager.
 *
 * Services implementing this interface are started in registration order
 * and stopped in reverse registration order during graceful shutdown.
 */
export interface ILifecycle {
  /** Starts the service. Called during the boot sequence. */
  start(): Promise<void>;

  /** Stops the service. Called during graceful shutdown. */
  stop(): Promise<void>;
}

/**
 * Lifecycle manager contract.
 *
 * Coordinates the startup and shutdown of all registered lifecycle services
 * in a deterministic order.
 */
export interface ILifecycleManager {
  /**
   * Registers a named service for lifecycle management.
   *
   * @param name - Human-readable service name for logging.
   * @param service - The lifecycle-aware service instance.
   */
  register(name: string, service: ILifecycle): void;

  /** Starts all registered services in registration order. */
  startAll(): Promise<void>;

  /** Stops all registered services in reverse registration order. */
  stopAll(): Promise<void>;
}
