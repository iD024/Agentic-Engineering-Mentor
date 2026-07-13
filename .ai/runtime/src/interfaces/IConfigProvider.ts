import type { RuntimeConfig } from '../types/RuntimeConfig.js';

/**
 * Configuration provider contract.
 *
 * Provides immutable, read-only access to validated runtime configuration.
 * No loading or validation — those are separate responsibilities handled
 * by ConfigLoader and ConfigValidator respectively.
 */
export interface IConfigProvider {
  /**
   * Retrieves a configuration value by key.
   *
   * @param key - A key from the RuntimeConfig type.
   * @returns The corresponding configuration value.
   */
  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K];

  /** Returns a frozen snapshot of the entire configuration. */
  getAll(): Readonly<RuntimeConfig>;
}
