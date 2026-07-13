import type { ILogger, ILoggerFactory } from '../../interfaces/ILogger.js';
import { LogLevel } from '../../types/LogLevel.js';
import { ConsoleLogger } from './ConsoleLogger.js';

/**
 * Logger factory.
 *
 * Decouples logger creation from concrete implementations. The runtime
 * requests loggers through this factory, enabling future swaps to
 * FileLogger, JsonLogger, or TelemetryLogger without modifying application code.
 */
export class LoggerFactory implements ILoggerFactory {
  /** The configured minimum log level. */
  readonly level: LogLevel;

  /**
   * Creates a LoggerFactory.
   *
   * @param level - Minimum log level applied to all created loggers.
   */
  constructor(level: LogLevel) {
    this.level = level;
  }

  /**
   * Creates a logger instance.
   *
   * @param prefix - Optional scope prefix prepended to all messages.
   * @returns An ILogger implementation configured with the factory's log level.
   */
  createLogger(prefix?: string): ILogger {
    return new ConsoleLogger(this.level, prefix);
  }
}
