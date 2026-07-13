import type { ILogger } from '../../interfaces/ILogger.js';
import type { IKernel } from '../../interfaces/IKernel.js';

/**
 * Graceful shutdown handler.
 *
 * Registers process signal handlers (SIGINT, SIGTERM) and delegates
 * shutdown coordination to the Kernel. Enforces a configurable timeout
 * and force-exits if the timeout is exceeded. Prevents duplicate shutdown runs.
 */
export class ShutdownHandler {
  private readonly kernel: IKernel;
  private readonly timeoutMs: number;
  private readonly logger: ILogger;
  private shutdownInProgress = false;

  /**
   * Creates a ShutdownHandler.
   *
   * @param kernel - The IKernel implementation to delegate shutdown to.
   * @param timeoutMs - Maximum time in milliseconds for graceful shutdown.
   * @param logger - Logger for reporting shutdown events.
   */
  constructor(kernel: IKernel, timeoutMs: number, logger: ILogger) {
    this.kernel = kernel;
    this.timeoutMs = timeoutMs;
    this.logger = logger;
  }

  /**
   * Installs signal handlers for SIGINT and SIGTERM.
   *
   * Call this once after the Kernel is constructed and before boot.
   */
  install(): void {
    const handler = (signal: string): void => {
      this.logger.info(`Received ${signal}, initiating graceful shutdown...`);
      void this.handleShutdown();
    };

    process.on('SIGINT', () => handler('SIGINT'));
    process.on('SIGTERM', () => handler('SIGTERM'));
  }

  /**
   * Executes the shutdown sequence with timeout enforcement.
   *
   * Prevents duplicate runs if multiple signals arrive in quick succession.
   */
  private async handleShutdown(): Promise<void> {
    if (this.shutdownInProgress) {
      this.logger.warn('Shutdown already in progress, ignoring duplicate signal');
      return;
    }

    this.shutdownInProgress = true;

    const forceExitTimer = setTimeout(() => {
      this.logger.error(
        `Shutdown timeout exceeded (${this.timeoutMs}ms), force exiting`,
      );
      process.exit(1);
    }, this.timeoutMs);

    // Prevent the timer from keeping the process alive if shutdown completes
    forceExitTimer.unref();

    try {
      await this.kernel.shutdown();
      this.logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      this.logger.error('Error during shutdown', {
        error: err instanceof Error ? err.message : String(err),
      });
      process.exit(1);
    } finally {
      clearTimeout(forceExitTimer);
    }
  }
}
