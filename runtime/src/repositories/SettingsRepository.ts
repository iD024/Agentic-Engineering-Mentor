import { BaseRepository } from './BaseRepository.js';
import type { Setting } from '../models/Setting.js';
import type { Database } from '../database/Database.js';

interface SettingRow {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for settings persistence.
 *
 * Contains ALL SQL related to the settings table.
 * Contains NO business logic.
 */
export class SettingsRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /** Retrieves a setting by key. Returns null if the key does not exist. */
  get(key: string): Setting | null {
    const row = this.db.connection
      .prepare('SELECT * FROM settings WHERE key = ?')
      .get(key) as SettingRow | undefined;
    return row ? this.toModel(row) : null;
  }

  /**
   * Upserts a setting (inserts or replaces).
   *
   * @param key - The setting key.
   * @param value - The setting value as a string.
   */
  set(key: string, value: string): void {
    this.db.connection
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run(key, value);
  }

  /** Returns all settings. */
  findAll(): Setting[] {
    const rows = this.db.connection
      .prepare('SELECT * FROM settings ORDER BY key')
      .all() as SettingRow[];
    return rows.map(r => this.toModel(r));
  }

  /** Deletes a setting by key. */
  delete(key: string): void {
    this.db.connection.prepare('DELETE FROM settings WHERE key = ?').run(key);
  }

  private toModel(row: SettingRow): Setting {
    return {
      key: row.key,
      value: row.value,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
