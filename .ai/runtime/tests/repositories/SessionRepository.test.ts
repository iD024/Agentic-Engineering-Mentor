import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import { WorkspaceRepository } from '../../src/repositories/WorkspaceRepository.js';
import { SessionRepository } from '../../src/repositories/SessionRepository.js';
import { createDefaultWorkspace } from '../../src/models/Workspace.js';
import type { Session } from '../../src/models/Session.js';

function setupDb(): Database {
  const db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
  db.open();
  new MigrationRunner().run(db);
  return db;
}

function makeSession(id: string, workspaceId: string): Session {
  const now = new Date().toISOString();
  return { id, workspaceId, state: 'active', goals: [], startedAt: now, endedAt: null, version: 1, createdAt: now, updatedAt: now };
}

describe('SessionRepository', () => {
  let db: Database;
  let sessionRepo: SessionRepository;

  beforeEach(() => {
    db = setupDb();
    const wsRepo = new WorkspaceRepository(db);
    wsRepo.insert(createDefaultWorkspace('ws-1'));
    sessionRepo = new SessionRepository(db);
  });

  afterEach(() => db.close());

  it('inserts and finds a session by id', () => {
    sessionRepo.insert(makeSession('s-1', 'ws-1'));
    const found = sessionRepo.findById('s-1');
    expect(found).not.toBeNull();
    expect(found!.workspaceId).toBe('ws-1');
  });

  it('finds sessions by workspace', () => {
    sessionRepo.insert(makeSession('s-1', 'ws-1'));
    sessionRepo.insert(makeSession('s-2', 'ws-1'));
    const all = sessionRepo.findByWorkspaceId('ws-1');
    expect(all.length).toBe(2);
  });

  it('updates a session', () => {
    const s = makeSession('s-1', 'ws-1');
    sessionRepo.insert(s);
    sessionRepo.update({ ...s, state: 'completed', version: 2 });
    expect(sessionRepo.findById('s-1')!.state).toBe('completed');
  });

  it('returns null for unknown id', () => {
    expect(sessionRepo.findById('no-such')).toBeNull();
  });
});
