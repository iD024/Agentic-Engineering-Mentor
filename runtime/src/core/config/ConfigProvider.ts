import type { IConfigProvider } from '../../interfaces/IConfigProvider.js';
import type { RuntimeConfig } from '../../types/RuntimeConfig.js';

/**
 * Configuration provider.
 *
 * Single responsibility: provides immutable, read-only access to validated
 * runtime configuration. No loading, no validation — those are handled
 * by ConfigLoader and ConfigValidator respectively.
 */
export class ConfigProvider implements IConfigProvider {
  private readonly config: Readonly<RuntimeConfig>;

  /**
   * Creates a ConfigProvider wrapping a validated configuration.
   *
   * @param config - A validated RuntimeConfig object from ConfigValidator.
   */
  private constructor(config: RuntimeConfig) {
    this.config = Object.freeze({ ...config });
  }

  /**
   * Factory method to create a ConfigProvider from a validated config.
   *
   * @param config - A validated RuntimeConfig from ConfigValidator.
   * @returns An immutable ConfigProvider instance.
   */
  static create(config: RuntimeConfig): ConfigProvider {
    return new ConfigProvider(config);
  }

  /** {@inheritDoc IConfigProvider.get} */
  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    return this.config[key];
  }

  /** {@inheritDoc IConfigProvider.getAll} */
  getAll(): Readonly<RuntimeConfig> {
    return this.config;
  }
}
