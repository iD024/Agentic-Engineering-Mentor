import dotenv from 'dotenv';

/**
 * Configuration loader.
 *
 * Single responsibility: reads configuration sources and returns raw
 * key-value pairs. No validation, no transformation, no freezing.
 */
export class ConfigLoader {
  /**
   * Loads environment variables from `.env` file (if present) and
   * returns the merged result from `process.env`.
   *
   * @param envPath - Optional path to a `.env` file. Defaults to `.env` in cwd.
   * @returns Raw key-value pairs from the environment.
   */
  static load(envPath?: string): Record<string, string | undefined> {
    dotenv.config({ path: envPath });
    return { ...process.env };
  }
}
