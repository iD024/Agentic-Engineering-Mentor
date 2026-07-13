import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import { WorkspaceRepository } from '../../src/repositories/WorkspaceRepository.js';
import { createDefaultWorkspace } from '../../src/models/Workspace.js';

function setupDb(): Database {
  const db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
  db.open();
  new MigrationRunner().run(db);
  return db;
}

describe('WorkspaceRepository', () => {
  let db: Database;
  let repo: WorkspaceRepository;

  beforeEach(() => {
    db = setupDb();
    repo = new WorkspaceRepository(db);
  });

  afterEach(() => db.close());

  it('inserts and finds a workspace by id', () => {
    const ws = createDefaultWorkspace('ws-1');
    repo.insert(ws);
    const found = repo.findById('ws-1');
    expect(found).not.toBeNull();
    expect(found!.id).toBe('ws-1');
  });

  it('returns null for unknown id', () => {
    expect(repo.findById('nonexistent')).toBeNull();
  });

  it('updates a workspace', () => {
    const ws = createDefaultWorkspace('ws-1');
    repo.insert(ws);
    repo.update({ ...ws, name: 'Updated', version: 2 });
    const found = repo.findById('ws-1');
    expect(found!.name).toBe('Updated');
  });

  it('lists all workspaces', () => {
    repo.insert(createDefaultWorkspace('ws-1'));
    repo.insert(createDefaultWorkspace('ws-2'));
    const all = repo.findAll();
    expect(all.length).toBe(2);
  });

  it('deletes a workspace', () => {
    repo.insert(createDefaultWorkspace('ws-1'));
    repo.delete('ws-1');
    expect(repo.findById('ws-1')).toBeNull();
  });
});
