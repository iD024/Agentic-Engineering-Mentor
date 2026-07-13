import type { ILogger, LogContext } from '../../interfaces/ILogger.js';
import { LogLevel } from '../../types/LogLevel.js';

/** Maps LogLevel enum values to their string labels. */
const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

/**
 * Console-based logger implementation.
 *
 * Writes structured log output to stdout (DEBUG, INFO, WARN) and stderr (ERROR).
 * Respects the configured minimum log level, filtering lower-priority messages.
 *
 * Output format: `[ISO-TIMESTAMP] [LEVEL] [PREFIX] message {context}`
 */
export class ConsoleLogger implements ILogger {
  private readonly level: LogLevel;
  private readonly prefix: string;

  /**
   * Creates a ConsoleLogger.
   *
   * @param level - Minimum log level. Messages below this level are discarded.
   * @param prefix - Optional prefix prepended to every message for scoping.
   */
  constructor(level: LogLevel, prefix?: string) {
    this.level = level;
    this.prefix = prefix ?? '';
  }

  /** {@inheritDoc ILogger.debug} */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /** {@inheritDoc ILogger.info} */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /** {@inheritDoc ILogger.warn} */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /** {@inheritDoc ILogger.error} */
  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Internal log dispatcher.
   *
   * Filters by configured level, formats the message, and writes
   * to the appropriate output stream.
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.level) {
      return;
    }

    const timestamp = new Date().toISOString();
    const label = LEVEL_LABELS[level];
    const prefixSegment = this.prefix ? ` [${this.prefix}]` : '';
    const contextSegment =
      context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';

    const formatted = `[${timestamp}] [${label}]${prefixSegment} ${message}${contextSegment}\n`;

    if (level >= LogLevel.ERROR) {
      process.stderr.write(formatted);
    } else {
      process.stdout.write(formatted);
    }
  }
}
