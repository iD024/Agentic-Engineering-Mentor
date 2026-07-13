import type { ILifecycle, ILifecycleManager } from '../../interfaces/ILifecycle.js';
import type { ILogger } from '../../interfaces/ILogger.js';

/** Internal record of a registered lifecycle service. */
interface LifecycleEntry {
  readonly name: string;
  readonly service: ILifecycle;
}

/**
 * Lifecycle manager.
 *
 * Coordinates the startup and shutdown of registered services in a
 * deterministic order. Services start in registration order and stop
 * in reverse registration order. Errors in individual services are
 * logged but do not abort the sequence.
 */
export class LifecycleManager implements ILifecycleManager {
  private readonly entries: LifecycleEntry[] = [];
  private readonly logger: ILogger;

  /**
   * Creates a LifecycleManager.
   *
   * @param logger - Logger for reporting lifecycle events.
   */
  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Registers a named service for lifecycle management.
   *
   * @param name - Human-readable service name for logging.
   * @param service - The lifecycle-aware service instance.
   */
  register(name: string, service: ILifecycle): void {
    this.entries.push({ name, service });
    this.logger.debug(`Lifecycle service registered: ${name}`);
  }

  /**
   * Starts all registered services in registration order.
   *
   * Errors in individual services are logged and re-thrown. On failure,
   * already-started services are not automatically stopped — the Kernel
   * is responsible for triggering shutdown on boot failure.
   */
  async startAll(): Promise<void> {
    for (const entry of this.entries) {
      this.logger.info(`Starting service: ${entry.name}`);
      try {
        await entry.service.start();
        this.logger.info(`Service started: ${entry.name}`);
      } catch (err) {
        this.logger.error(`Failed to start service: ${entry.name}`, {
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    }
  }

  /**
   * Stops all registered services in reverse registration order.
   *
   * Errors in individual services are logged but do not prevent
   * remaining services from stopping. This ensures maximum cleanup
   * during shutdown even when individual services fail.
   */
  async stopAll(): Promise<void> {
    const reversed = [...this.entries].reverse();
    for (const entry of reversed) {
      this.logger.info(`Stopping service: ${entry.name}`);
      try {
        await entry.service.stop();
        this.logger.info(`Service stopped: ${entry.name}`);
      } catch (err) {
        this.logger.error(`Failed to stop service: ${entry.name}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
