import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Database } from '../../src/database/Database.js';
import { MigrationRunner } from '../../src/database/MigrationRunner.js';
import { WorkspaceRepository } from '../../src/repositories/WorkspaceRepository.js';
import { SessionRepository } from '../../src/repositories/SessionRepository.js';
import { LearningRepository } from '../../src/repositories/LearningRepository.js';
import { MilestoneRepository } from '../../src/repositories/MilestoneRepository.js';
import { DependencyRepository } from '../../src/repositories/DependencyRepository.js';
import { SettingsRepository } from '../../src/repositories/SettingsRepository.js';
import { StateManager } from '../../src/state/StateManager.js';
import { DatabaseHealthCheck } from '../../src/database/DatabaseHealthCheck.js';
import { WorkspaceImporter } from '../../src/importer/WorkspaceImporter.js';
import { WorkspaceExporter } from '../../src/exporter/WorkspaceExporter.js';
import { WorkspaceService } from '../../src/services/WorkspaceService.js';
import { SessionService } from '../../src/services/SessionService.js';
import { MilestoneService } from '../../src/services/MilestoneService.js';
import { RuntimeState } from '../../src/kernel/RuntimeState.js';
import { StateTransitionGuard } from '../../src/state/StateTransitionGuard.js';

const TEST_ROOT = '/tmp/stage2-integration-test';

const WORKSPACE_JSON = JSON.stringify({
  schemaVersion: '1.0',
  workspaceVersion: '1.0.0',
  project: { name: 'Integration Project', description: 'Test integration', version: '0.2.0' },
  workspace: { initialized: false, state: 'planning', currentMilestone: null, lastSynchronization: '', repositoryFingerprint: '' },
  featureFlags: { strictMode: true, experimentalSkills: false },
});

function buildStack(db: Database) {
  const workspaceRepo = new WorkspaceRepository(db);
  const sessionRepo = new SessionRepository(db);
  const learningRepo = new LearningRepository(db);
  const milestoneRepo = new MilestoneRepository(db);
  const dependencyRepo = new DependencyRepository(db);
  const settingsRepo = new SettingsRepository(db);
  const stateManager = new StateManager(workspaceRepo, sessionRepo, learningRepo, milestoneRepo, dependencyRepo, settingsRepo);
  return { workspaceRepo, sessionRepo, learningRepo, milestoneRepo, dependencyRepo, settingsRepo, stateManager };
}

describe('Stage 2 Integration', () => {
  let db: Database;

  beforeEach(() => {
    mkdirSync(join(TEST_ROOT, '.ai'), { recursive: true });
    writeFileSync(join(TEST_ROOT, '.ai', 'workspace.json'), WORKSPACE_JSON);
    db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
    db.open();
    new MigrationRunner().run(db);
  });

  afterEach(() => {
    db.close();
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('full lifecycle: import → manage → export', async () => {
    const { workspaceRepo, sessionRepo, milestoneRepo, stateManager } = buildStack(db);

    // Database health
    const healthCheck = new DatabaseHealthCheck(db);
    const health = await healthCheck.check();
    expect(health.healthy).toBe(true);

    // Import
    const importer = new WorkspaceImporter(stateManager);
    const importResult = await importer.import(TEST_ROOT);
    expect(importResult.success).toBe(true);
    const wsId = importResult.workspaceId!;

    // Service layer
    const wsService = new WorkspaceService(stateManager, workspaceRepo);
    const workspace = wsService.getWorkspace(wsId);
    expect(workspace!.name).toBe('Integration Project');

    wsService.initializeWorkspace(wsId);
    const initialized = wsService.getWorkspace(wsId);
    expect(initialized!.initialized).toBe(true);
    expect(initialized!.state).toBe('active');

    // Session
    const sessionService = new SessionService(stateManager, sessionRepo);
    const session = sessionService.startSession({ workspaceId: wsId, goals: ['Learn TypeScript'] });
    expect(session.state).toBe('active');

    const ended = sessionService.endActiveSession(wsId);
    expect(ended!.state).toBe('completed');

    // Milestone
    const milestoneService = new MilestoneService(stateManager, milestoneRepo);
    const m1 = milestoneService.createMilestone({ workspaceId: wsId, title: 'First Milestone', orderIndex: 0 });
    const completed = milestoneService.completeMilestone(m1.id);
    expect(completed.state).toBe('completed');

    // Snapshot
    const snap = stateManager.createSnapshot(RuntimeState.READY, wsId);
    expect(snap.runtimeState).toBe(RuntimeState.READY);
    expect(snap.workspace!.name).toBe('Integration Project');

    // Export
    const exporter = new WorkspaceExporter(stateManager, workspaceRepo);
    const exportResult = await exporter.export(TEST_ROOT, wsId);
    expect(exportResult.success).toBe(true);
    expect(existsSync(join(TEST_ROOT, '.ai', 'workspace.json'))).toBe(true);
  });

  it('StateTransitionGuard prevents invalid runtime state changes', () => {
    const guard = new StateTransitionGuard();
    expect(() => guard.assertCanTransition(RuntimeState.STOPPED, RuntimeState.BOOTING)).toThrow();
    expect(() => guard.assertCanTransition(RuntimeState.CREATED, RuntimeState.BOOTING)).not.toThrow();
  });

  it('MigrationRunner is idempotent across multiple runs', () => {
    const runner = new MigrationRunner();
    expect(() => runner.run(db)).not.toThrow();
    expect(() => runner.run(db)).not.toThrow();
    const count = (db.connection.prepare('SELECT COUNT(*) as c FROM schema_version').get() as { c: number }).c;
    expect(count).toBe(4);
  });

  it('StateManager cache is consistent with database', () => {
    const { stateManager } = buildStack(db);
    const _ws = stateManager.createWorkspace({ id: 'ws-cache-test', name: 'Cache Test' });
    const fromCache = stateManager.loadWorkspace('ws-cache-test');
    expect(fromCache).toBe(stateManager.loadWorkspace('ws-cache-test')); // same reference
    expect(fromCache!.name).toBe('Cache Test');
    stateManager.updateWorkspace('ws-cache-test', { name: 'Updated' });
    expect(stateManager.loadWorkspace('ws-cache-test')!.name).toBe('Updated');
  });
});
