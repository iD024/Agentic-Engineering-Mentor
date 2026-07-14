import type { ILogger } from '../interfaces/ILogger.js';
import type { ILifecycleManager } from '../interfaces/ILifecycle.js';
import type { IKernel } from '../interfaces/IKernel.js';
import type { IRuntimeEvents } from '../interfaces/IRuntimeEvents.js';
import { RuntimeState } from './RuntimeState.js';

/**
 * Application kernel.
 *
 * Owns the RuntimeState, LifecycleManager, and RuntimeEvents.
 * Coordinates startup and shutdown deterministically. Receives all
 * dependencies via constructor — never constructs core services itself.
 *
 * The Kernel represents the operating system layer responsible for
 * orchestrating the application. The Runtime represents the running
 * application itself.
 */
export class Kernel implements IKernel {
  private _state: RuntimeState = RuntimeState.CREATED;
  private readonly lifecycle: ILifecycleManager;
  private readonly events: IRuntimeEvents;
  private readonly logger: ILogger;

  /**
   * Creates the Kernel.
   *
   * @param lifecycle - Lifecycle manager for coordinating service start/stop.
   * @param events - Runtime event emitter for lifecycle observability.
   * @param logger - Logger scoped to the Kernel.
   */
  constructor(
    lifecycle: ILifecycleManager,
    events: IRuntimeEvents,
    logger: ILogger,
  ) {
    this.lifecycle = lifecycle;
    this.events = events;
    this.logger = logger;
  }

  /**
   * Current runtime state.
   *
   * Read-only access for external components.
   */
  get state(): RuntimeState {
    return this._state;
  }

  /**
   * Boots the application.
   *
   * Transitions: CREATED → BOOTING → READY.
   * On failure: → FAILED, emits FatalError.
   *
   * @throws If any lifecycle service fails to start.
   */
  async boot(): Promise<void> {
    this.logger.info('Kernel booting...');
    this._state = RuntimeState.BOOTING;

    try {
      await this.lifecycle.startAll();
      this.events.emit('RuntimeStarted');
      this._state = RuntimeState.READY;
      this.logger.info('Kernel ready');
    } catch (err) {
      this._state = RuntimeState.FAILED;
      this.events.emit('FatalError', err);
      this.logger.error('Kernel boot failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Shuts down the application.
   *
   * Transitions: READY → STOPPING → STOPPED.
   * On failure: → FAILED, emits FatalError.
   */
  async shutdown(): Promise<void> {
    if (this._state === RuntimeState.STOPPING || this._state === RuntimeState.STOPPED) {
      return;
    }

    this.logger.info('Kernel shutting down...');
    this._state = RuntimeState.STOPPING;
    this.events.emit('RuntimeStopping');

    try {
      await this.lifecycle.stopAll();
      this.events.emit('RuntimeStopped');
      this._state = RuntimeState.STOPPED;
      this.logger.info('Kernel stopped');
    } catch (err) {
      this._state = RuntimeState.FAILED;
      this.events.emit('FatalError', err);
      this.logger.error('Kernel shutdown failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}
