import type { StateManager } from '../state/StateManager.js';

/**
 * Business-facing settings service.
 *
 * Wraps StateManager's setting commands with typed, named accessors.
 * Prevents raw key-string access from leaking into the rest of the system.
 */
export class SettingsService {
  private readonly stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /** Returns the runtime version string from settings. */
  getRuntimeVersion(): string {
    return this.stateManager.getSetting('runtime.version') ?? 'unknown';
  }

  /** Returns the current runtime stage number. */
  getRuntimeStage(): number {
    const val = this.stateManager.getSetting('runtime.stage');
    return val ? parseInt(val, 10) : 0;
  }

  /** Returns whether auto-import is enabled. */
  isAutoImportEnabled(): boolean {
    return this.stateManager.getSetting('import.autoRun') === 'true';
  }

  /** Returns whether export is enabled. */
  isExportEnabled(): boolean {
    return this.stateManager.getSetting('export.enabled') === 'true';
  }

  /**
   * Sets a raw setting value.
   *
   * @param key - The setting key.
   * @param value - The setting value.
   */
  set(key: string, value: string): void {
    this.stateManager.setSetting(key, value);
  }
}
