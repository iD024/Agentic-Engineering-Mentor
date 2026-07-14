import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
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
import { WorkspaceImporter } from '../../src/importer/WorkspaceImporter.js';

const TEST_DIR = '/tmp/ws-importer-test';

const SAMPLE_WORKSPACE_JSON = JSON.stringify({
  schemaVersion: '1.0',
  workspaceVersion: '1.0.0',
  project: { name: 'Test Project', description: 'A test', version: '0.1.0' },
  workspace: {
    initialized: false,
    state: 'planning',
    currentMilestone: null,
    lastSynchronization: '',
    repositoryFingerprint: '',
  },
  featureFlags: { strictMode: true, experimentalSkills: false },
});

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

describe('WorkspaceImporter', () => {
  let db: Database;
  let manager: StateManager;
  let importer: WorkspaceImporter;

  beforeEach(() => {
    mkdirSync(join(TEST_DIR, '.ai'), { recursive: true });
    writeFileSync(join(TEST_DIR, '.ai', 'workspace.json'), SAMPLE_WORKSPACE_JSON);

    db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
    db.open();
    new MigrationRunner().run(db);
    manager = buildManager(db);
    importer = new WorkspaceImporter(manager);
  });

  afterEach(() => {
    db.close();
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('imports workspace.json and creates a workspace in the database', async () => {
    const result = await importer.import(TEST_DIR);
    expect(result.success).toBe(true);
    expect(result.workspaceId).toBeTruthy();
  });

  it('sets project name from workspace.json', async () => {
    const result = await importer.import(TEST_DIR);
    expect(result.success).toBe(true);
    const ws = manager.loadWorkspace(result.workspaceId!);
    expect(ws!.name).toBe('Test Project');
  });

  it('returns failure result when workspace.json is missing', async () => {
    rmSync(join(TEST_DIR, '.ai', 'workspace.json'));
    const result = await importer.import(TEST_DIR);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('is idempotent — importing twice updates the existing workspace', async () => {
    await importer.import(TEST_DIR);
    const result2 = await importer.import(TEST_DIR);
    expect(result2.success).toBe(true);
  });
});
