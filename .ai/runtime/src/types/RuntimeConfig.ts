import type { LogLevel } from './LogLevel.js';

/**
 * Validated runtime configuration.
 *
 * This type represents the shape of configuration after it has been
 * loaded by ConfigLoader, validated by ConfigValidator, and served
 * through ConfigProvider. Fields correspond to the Zod schema in ConfigSchema.
 */
export interface RuntimeConfig {
  /** Application environment. */
  readonly nodeEnv: 'development' | 'production' | 'test';

  /** Minimum log level for output filtering. */
  readonly logLevel: LogLevel;

  /** Absolute path to the workspace root directory. */
  readonly workspaceRoot: string;

  /** Maximum time in milliseconds to wait for graceful shutdown. */
  readonly shutdownTimeoutMs: number;
}
