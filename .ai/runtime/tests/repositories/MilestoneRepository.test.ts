import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import { WorkspaceRepository } from '../../src/repositories/WorkspaceRepository.js';
import { MilestoneRepository } from '../../src/repositories/MilestoneRepository.js';
import { createDefaultWorkspace } from '../../src/models/Workspace.js';
import type { Milestone } from '../../src/models/Milestone.js';

function setupDb(): Database {
  const db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
  db.open();
  new MigrationRunner().run(db);
  return db;
}

function makeMilestone(id: string, workspaceId: string, title: string, order: number): Milestone {
  const now = new Date().toISOString();
  return { id, workspaceId, title, description: '', state: 'pending', orderIndex: order, completedAt: null, version: 1, createdAt: now, updatedAt: now };
}

describe('MilestoneRepository', () => {
  let db: Database;
  let repo: MilestoneRepository;

  beforeEach(() => {
    db = setupDb();
    new WorkspaceRepository(db).insert(createDefaultWorkspace('ws-1'));
    repo = new MilestoneRepository(db);
  });

  afterEach(() => db.close());

  it('inserts and finds by id', () => {
    repo.insert(makeMilestone('m-1', 'ws-1', 'Milestone 1', 0));
    expect(repo.findById('m-1')!.title).toBe('Milestone 1');
  });

  it('finds by workspace in order', () => {
    repo.insert(makeMilestone('m-2', 'ws-1', 'Second', 1));
    repo.insert(makeMilestone('m-1', 'ws-1', 'First', 0));
    const list = repo.findByWorkspaceId('ws-1');
    expect(list[0]!.orderIndex).toBe(0);
    expect(list[1]!.orderIndex).toBe(1);
  });

  it('updates state and completedAt', () => {
    const now = new Date().toISOString();
    const m = makeMilestone('m-1', 'ws-1', 'Milestone', 0);
    repo.insert(m);
    repo.update({ ...m, state: 'completed', completedAt: now, version: 2 });
    const found = repo.findById('m-1')!;
    expect(found.state).toBe('completed');
    expect(found.completedAt).toBe(now);
  });
});
