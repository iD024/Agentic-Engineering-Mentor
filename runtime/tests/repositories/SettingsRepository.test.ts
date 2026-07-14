import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import { SettingsRepository } from '../../src/repositories/SettingsRepository.js';

function setupDb(): Database {
  const db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
  db.open();
  new MigrationRunner().run(db);
  return db;
}

describe('SettingsRepository', () => {
  let db: Database;
  let repo: SettingsRepository;

  beforeEach(() => {
    db = setupDb();
    repo = new SettingsRepository(db);
  });

  afterEach(() => db.close());

  it('reads seeded settings', () => {
    const v = repo.get('runtime.version');
    expect(v).not.toBeNull();
    expect(v!.value).toBe('2.0.0');
  });

  it('sets and retrieves a setting', () => {
    repo.set('my.key', 'hello');
    expect(repo.get('my.key')!.value).toBe('hello');
  });

  it('updates an existing setting', () => {
    repo.set('runtime.version', '2.1.0');
    expect(repo.get('runtime.version')!.value).toBe('2.1.0');
  });

  it('returns null for unknown key', () => {
    expect(repo.get('unknown.key')).toBeNull();
  });

  it('lists all settings', () => {
    const all = repo.findAll();
    expect(all.length).toBeGreaterThanOrEqual(4);
  });
});
