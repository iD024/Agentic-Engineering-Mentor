import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import { WorkspaceRepository } from '../../src/repositories/WorkspaceRepository.js';
import { DependencyRepository } from '../../src/repositories/DependencyRepository.js';
import { createDefaultWorkspace } from '../../src/models/Workspace.js';
import type { DependencyMetric } from '../../src/models/DependencyMetric.js';

function setupDb(): Database {
  const db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
  db.open();
  new MigrationRunner().run(db);
  return db;
}

function makeMetric(id: string, workspaceId: string, name: string): DependencyMetric {
  const now = new Date().toISOString();
  return { id, workspaceId, name, version: '1.0.0', outdated: false, vulnerable: false, notes: '', rowVersion: 1, createdAt: now, updatedAt: now };
}

describe('DependencyRepository', () => {
  let db: Database;
  let repo: DependencyRepository;

  beforeEach(() => {
    db = setupDb();
    new WorkspaceRepository(db).insert(createDefaultWorkspace('ws-1'));
    repo = new DependencyRepository(db);
  });

  afterEach(() => db.close());

  it('inserts and finds by id', () => {
    repo.insert(makeMetric('d-1', 'ws-1', 'typescript'));
    expect(repo.findById('d-1')!.name).toBe('typescript');
  });

  it('finds by workspace', () => {
    repo.insert(makeMetric('d-1', 'ws-1', 'typescript'));
    repo.insert(makeMetric('d-2', 'ws-1', 'zod'));
    expect(repo.findByWorkspaceId('ws-1').length).toBe(2);
  });

  it('updates outdated flag', () => {
    const m = makeMetric('d-1', 'ws-1', 'typescript');
    repo.insert(m);
    repo.update({ ...m, outdated: true, rowVersion: 2 });
    expect(repo.findById('d-1')!.outdated).toBe(true);
  });
});
