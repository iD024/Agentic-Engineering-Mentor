import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import { WorkspaceRepository } from '../../src/repositories/WorkspaceRepository.js';
import { LearningRepository } from '../../src/repositories/LearningRepository.js';
import { createDefaultWorkspace } from '../../src/models/Workspace.js';
import type { LearningProgress } from '../../src/models/LearningProgress.js';

function setupDb(): Database {
  const db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
  db.open();
  new MigrationRunner().run(db);
  return db;
}

function makeProgress(id: string, workspaceId: string, topic: string): LearningProgress {
  const now = new Date().toISOString();
  return { id, workspaceId, topic, level: 'novice', notes: '', version: 1, createdAt: now, updatedAt: now };
}

describe('LearningRepository', () => {
  let db: Database;
  let repo: LearningRepository;

  beforeEach(() => {
    db = setupDb();
    new WorkspaceRepository(db).insert(createDefaultWorkspace('ws-1'));
    repo = new LearningRepository(db);
  });

  afterEach(() => db.close());

  it('inserts and finds by id', () => {
    repo.insert(makeProgress('lp-1', 'ws-1', 'TypeScript'));
    expect(repo.findById('lp-1')!.topic).toBe('TypeScript');
  });

  it('finds by workspace', () => {
    repo.insert(makeProgress('lp-1', 'ws-1', 'TypeScript'));
    repo.insert(makeProgress('lp-2', 'ws-1', 'SQL'));
    expect(repo.findByWorkspaceId('ws-1').length).toBe(2);
  });

  it('finds by topic', () => {
    repo.insert(makeProgress('lp-1', 'ws-1', 'TypeScript'));
    const found = repo.findByTopic('ws-1', 'TypeScript');
    expect(found).not.toBeNull();
    expect(found!.level).toBe('novice');
  });

  it('updates a record', () => {
    const p = makeProgress('lp-1', 'ws-1', 'TypeScript');
    repo.insert(p);
    repo.update({ ...p, level: 'intermediate', version: 2 });
    expect(repo.findById('lp-1')!.level).toBe('intermediate');
  });
});
