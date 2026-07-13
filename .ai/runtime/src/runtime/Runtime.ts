import type { ILifecycle } from '../interfaces/ILifecycle.js';
import type { RuntimeContext } from '../types/RuntimeContext.js';
import type { ILogger } from '../interfaces/ILogger.js';

/**
 * The running application.
 *
 * Receives all dependencies via constructor injection through RuntimeContext.
 * Contains no construction logic. Implements ILifecycle so the Kernel can
 * manage it via the LifecycleManager.
 *
 * Future stages add business logic (MCP server, agent registry, workspace
 * operations) to the start/stop methods.
 */
export class Runtime implements ILifecycle {
  private readonly logger: ILogger;
  private readonly context: RuntimeContext;

  /**
   * Creates the Runtime.
   *
   * @param context - The runtime context containing all core dependencies.
   */
  constructor(context: RuntimeContext) {
    this.context = context;
    this.logger = context.loggerFactory.createLogger('Runtime');
  }

  /**
   * Starts the runtime application.
   *
   * Called by the LifecycleManager during the Kernel boot sequence.
   */
  async start(): Promise<void> {
    this.logger.info('Runtime started', {
      workspaceRoot: this.context.workspaceRoot,
      state: this.context.getState(),
    });
  }

  /**
   * Stops the runtime application.
   *
   * Called by the LifecycleManager during graceful shutdown.
   */
  async stop(): Promise<void> {
    this.logger.info('Runtime stopped');
  }
}
