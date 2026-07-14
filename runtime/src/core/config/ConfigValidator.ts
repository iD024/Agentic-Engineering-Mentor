import { resolve } from 'node:path';
import { ZodError } from 'zod';
import { configSchema, type RawValidatedConfig } from './ConfigSchema.js';
import type { RuntimeConfig } from '../../types/RuntimeConfig.js';
import { LogLevel } from '../../types/LogLevel.js';

/** Maps string log level names to the LogLevel enum. */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

/**
 * Configuration validator.
 *
 * Single responsibility: validates raw key-value pairs against the Zod schema
 * and transforms the result into a typed RuntimeConfig object.
 * No loading — that's ConfigLoader's job.
 * No serving — that's ConfigProvider's job.
 */
export class ConfigValidator {
  /**
   * Validates raw environment variables and returns a typed RuntimeConfig.
   *
   * @param raw - Raw key-value pairs from ConfigLoader.
   * @returns A validated, typed RuntimeConfig object.
   * @throws Error with descriptive message on validation failure.
   */
  static validate(raw: Record<string, string | undefined>): RuntimeConfig {
    let parsed: RawValidatedConfig;

    try {
      parsed = configSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues
          .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
          .join('\n');
        throw new Error(`Configuration validation failed:\n${details}`);
      }
      throw err;
    }

    return {
      nodeEnv: parsed.NODE_ENV,
      logLevel: LOG_LEVEL_MAP[parsed.LOG_LEVEL]!,
      workspaceRoot: resolve(parsed.WORKSPACE_ROOT),
      shutdownTimeoutMs: parsed.SHUTDOWN_TIMEOUT_MS,
    };
  }
}
