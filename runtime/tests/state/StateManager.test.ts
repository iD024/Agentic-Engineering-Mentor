import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import { WorkspaceRepository } from '../../src/repositories/WorkspaceRepository.js';
import { SessionRepository } from '../../src/repositories/SessionRepository.js';
import { LearningRepository } from '../../src/repositories/LearningRepository.js';
import { MilestoneRepository } from '../../src/repositories/MilestoneRepository.js';
import { DependencyRepository } from '../../src/repositories/DependencyRepository.js';
import { SettingsRepository } from '../../src/repositories/SettingsRepository.js';
import { StateManager } from '../../src/state/StateManager.js';
import { RuntimeState } from '../../src/kernel/RuntimeState.js';

function setupDb(): Database {
  const db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
  db.open();
  new MigrationRunner().run(db);
  return db;
}

function buildManager(db: Database): StateManager {
  return new StateManager(
    new WorkspaceRepository(db),
    new SessionRepository(db),
    new LearningRepository(db),
    new MilestoneRepository(db),
    new DependencyRepository(db),
    new SettingsRepository(db),
  );
}

describe('StateManager', () => {
  let db: Database;
  let manager: StateManager;

  beforeEach(() => {
    db = setupDb();
    manager = buildManager(db);
  });

  afterEach(() => db.close());

  describe('workspace commands', () => {
    it('createWorkspace() persists and returns a frozen workspace', () => {
      const ws = manager.createWorkspace({ id: 'ws-1', name: 'Test' });
      expect(ws.id).toBe('ws-1');
      expect(ws.name).toBe('Test');
      expect(Object.isFrozen(ws)).toBe(true);
    });

    it('loadWorkspace() returns the persisted workspace', () => {
      manager.createWorkspace({ id: 'ws-1', name: 'Test' });
      const ws = manager.loadWorkspace('ws-1');
      expect(ws).not.toBeNull();
      expect(ws!.name).toBe('Test');
    });

    it('updateWorkspace() updates fields and bumps version', () => {
      manager.createWorkspace({ id: 'ws-1', name: 'Old' });
      const updated = manager.updateWorkspace('ws-1', { name: 'New' });
      expect(updated.name).toBe('New');
      expect(updated.version).toBe(2);
    });

    it('loadWorkspace() uses cache on second read', () => {
      manager.createWorkspace({ id: 'ws-1', name: 'Test' });
      const first = manager.loadWorkspace('ws-1');
      const second = manager.loadWorkspace('ws-1');
      expect(first).toBe(second); // same frozen reference from cache
    });

    it('updateWorkspace() throws for unknown id', () => {
      expect(() => manager.updateWorkspace('nonexistent', { name: 'X' })).toThrow(
        /Workspace not found/
      );
    });
  });

  describe('session commands', () => {
    it('createSession() persists a session', () => {
      manager.createWorkspace({ id: 'ws-1', name: 'Test' });
      const session = manager.createSession({ workspaceId: 'ws-1' });
      expect(session.workspaceId).toBe('ws-1');
      expect(session.state).toBe('active');
      expect(Object.isFrozen(session)).toBe(true);
    });

    it('endSession() marks session as completed', () => {
      manager.createWorkspace({ id: 'ws-1', name: 'Test' });
      const session = manager.createSession({ workspaceId: 'ws-1' });
      const ended = manager.endSession(session.id);
      expect(ended.state).toBe('completed');
      expect(ended.endedAt).not.toBeNull();
    });
  });

  describe('snapshot', () => {
    it('createSnapshot() returns an immutable snapshot', () => {
      manager.createWorkspace({ id: 'ws-1', name: 'Test' });
      const snap = manager.createSnapshot(RuntimeState.READY, 'ws-1');
      expect(snap.runtimeState).toBe(RuntimeState.READY);
      expect(snap.workspace).not.toBeNull();
    });
  });

  describe('settings', () => {
    it('getSetting() reads seeded setting', () => {
      expect(manager.getSetting('runtime.version')).toBe('2.0.0');
    });

    it('setSetting() persists a setting', () => {
      manager.setSetting('my.key', 'value');
      expect(manager.getSetting('my.key')).toBe('value');
    });
  });
});
