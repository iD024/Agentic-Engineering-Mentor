import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
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
import { WorkspaceExporter } from '../../src/exporter/WorkspaceExporter.js';

const TEST_DIR = '/tmp/ws-exporter-test';

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

describe('WorkspaceExporter', () => {
  let db: Database;
  let manager: StateManager;
  let exporter: WorkspaceExporter;

  beforeEach(() => {
    mkdirSync(join(TEST_DIR, '.ai'), { recursive: true });

    db = new Database({ path: ':memory:', walMode: true, timeout: 5000, verbose: false });
    db.open();
    new MigrationRunner().run(db);
    manager = buildManager(db);
    exporter = new WorkspaceExporter(manager, new WorkspaceRepository(db));
  });

  afterEach(() => {
    db.close();
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('exports workspace.json to .ai/ directory', async () => {
    manager.createWorkspace({ id: 'ws-1', name: 'Test Project' });
    const result = await exporter.export(TEST_DIR, 'ws-1');
    expect(result.success).toBe(true);
    expect(existsSync(join(TEST_DIR, '.ai', 'workspace.json'))).toBe(true);
  });

  it('exported JSON is valid and contains workspace name', async () => {
    manager.createWorkspace({ id: 'ws-1', name: 'My Project' });
    await exporter.export(TEST_DIR, 'ws-1');
    const content = readFileSync(join(TEST_DIR, '.ai', 'workspace.json'), 'utf-8');
    const json = JSON.parse(content) as { project: { name: string } };
    expect(json.project.name).toBe('My Project');
  });

  it('returns failure when workspace is not found', async () => {
    const result = await exporter.export(TEST_DIR, 'nonexistent');
    expect(result.success).toBe(false);
  });
});
