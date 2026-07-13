import type { LogLevel } from '../types/LogLevel.js';

/**
 * Structured context attached to log messages.
 *
 * Enables machine-parseable metadata alongside human-readable messages.
 */
export interface LogContext {
  readonly [key: string]: unknown;
}

/**
 * Logger contract.
 *
 * All application code depends on this abstraction rather than any
 * concrete logger implementation. Implementations include ConsoleLogger,
 * and future FileLogger, JsonLogger, or TelemetryLogger.
 */
export interface ILogger {
  /** Logs a debug-level message. */
  debug(message: string, context?: LogContext): void;

  /** Logs an info-level message. */
  info(message: string, context?: LogContext): void;

  /** Logs a warn-level message. */
  warn(message: string, context?: LogContext): void;

  /** Logs an error-level message. */
  error(message: string, context?: LogContext): void;
}

/**
 * Logger factory contract.
 *
 * Decouples logger creation from specific implementations.
 * The runtime requests loggers through this factory rather than
 * constructing concrete classes directly.
 */
export interface ILoggerFactory {
  /** Creates a logger instance, optionally scoped to a named prefix. */
  createLogger(prefix?: string): ILogger;

  /** The configured minimum log level. */
  readonly level: LogLevel;
}
