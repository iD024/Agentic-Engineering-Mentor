/**
 * Log severity levels ordered by priority.
 *
 * Lower ordinal values indicate higher verbosity.
 * The runtime filters log messages below the configured level.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
