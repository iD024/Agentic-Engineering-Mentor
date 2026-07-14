import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ICommandHandler } from './interfaces.js';
import { CreateWorkspaceCommand, CreateWorkspaceResult } from './CreateWorkspaceCommand.js';
import type { StateManager } from '../../state/StateManager.js';
import type { Database } from '../../database/Database.js';
import type { EventBus } from '../../events/bus/EventBus.js';

export class CreateWorkspaceCommandHandler implements ICommandHandler<CreateWorkspaceCommand, CreateWorkspaceResult> {
  readonly commandType = 'CreateWorkspaceCommand';

  constructor(
    private readonly stateManager: StateManager,
    private readonly database: Database,
    private readonly dbPath: string,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateWorkspaceCommand): Promise<CreateWorkspaceResult> {
    const { name, description, workspaceRoot } = command.payload;
    const aiDir = path.join(workspaceRoot, '.ai');
    
    const result: CreateWorkspaceResult = {
      success: false,
      message: '',
      details: {
        createdFolders: [],
        updatedFiles: [],
        dbChanges: [],
        warnings: [],
        errors: []
      }
    };
    
    try {
      // 1. Check if workspace already exists
      const workspaceJsonPath = path.join(aiDir, 'workspace.json');
      try {
        const stat = await fs.stat(workspaceJsonPath);
        if (stat.isFile()) {
           result.details.errors.push('workspace.json already exists. Use load instead of create.');
           result.message = 'Workspace already exists.';
           return result;
        }
      } catch {}

      // 2. Create Workspace Directories
      const dirs = [
        'context',
        'docs',
        'profiles',
        'templates',
        'repositories',
        'knowledge',
        'sessions',
        'validation',
        'logs',
        'exports',
        'imports',
        'data'
      ];
      
      for (const dir of dirs) {
        const dirPath = path.join(aiDir, dir);
        try {
          const stat = await fs.stat(dirPath);
          if (!stat.isDirectory()) {
            result.details.errors.push(`${dir} exists but is not a directory.`);
          }
        } catch {
          await fs.mkdir(dirPath, { recursive: true });
          result.details.createdFolders.push(dir);
        }
      }

      // 3. Migrate the in-memory database to the newly created data directory
      try {
        if (this.database.isOpen() && (this.database as any).config.path === ':memory:') {
          await this.database.migrateToDisk(this.dbPath);
          result.details.dbChanges.push(`Migrated SQLite database to ${this.dbPath}`);
        } else {
          result.details.warnings.push('Database is already on disk, skipped migration.');
        }
      } catch (err) {
        result.details.errors.push(`Failed to migrate database to disk: ${err instanceof Error ? err.message : String(err)}`);
        result.message = 'Database migration failed.';
        return result;
      }

      // 4. Initialize workspace.json
      const workspaceJsonData = {
        name: name,
        description: description || '',
        version: '2.0.0',
        created_at: new Date().toISOString(),
        workspace: {
          initialized: true,
          state: "planning",
          currentMilestone: null,
          lastSynchronization: new Date().toISOString(),
          repositoryFingerprint: ""
        },
        initialization: {
          projectUnderstanding: "missing",
          repositoryKnowledge: "missing",
          curriculum: "missing",
          projectMemory: "missing",
          learningProgress: "missing",
          workspaceStatus: "missing",
          milestones: "missing",
          session: "missing",
          mistakeLogger: "missing"
        },
        profiles: { installed: [], active: [] },
        skills: { enabled: [] },
        contextVersions: {
          projectContext: "1.0",
          projectUnderstanding: "1.0",
          repositoryKnowledge: "1.0",
          projectMemory: "1.0",
          curriculum: "1.0",
          learningProgress: "1.0",
          workspaceStatus: "1.0",
          session: "1.0"
        },
        featureFlags: { strictMode: true, experimentalSkills: false }
      };
      await fs.writeFile(workspaceJsonPath, JSON.stringify(workspaceJsonData, null, 2));
      result.details.updatedFiles.push('workspace.json');

      // 5. Initialize Database State
      const workspace = this.stateManager.createWorkspace({
        name,
        description
      });
      
      this.stateManager.updateWorkspace(workspace.id, {
        initialized: true,
        state: 'active'
      });
      result.details.dbChanges.push(`Created workspace ${workspace.id}`);
      this.stateManager.setSetting('workspace.primaryId', workspace.id);
      
      const session = this.stateManager.createSession({ workspaceId: workspace.id, goals: ['Initial Workspace Setup'] });
      result.details.dbChanges.push(`Created initial session ${session.id}`);

      // 6. Verification
      const verifyDirs = await Promise.all(dirs.map(async (dir) => {
        try {
          const stat = await fs.stat(path.join(aiDir, dir));
          return stat.isDirectory();
        } catch {
          return false;
        }
      }));
      
      if (verifyDirs.includes(false)) {
        result.details.errors.push('Failed to verify all directories physically exist.');
      }
      
      try {
        const jsonStat = await fs.stat(workspaceJsonPath);
        if (!jsonStat.isFile()) {
           result.details.errors.push('workspace.json verification failed.');
        }
      } catch {
        result.details.errors.push('workspace.json verification failed.');
      }
      
      if (result.details.errors.length > 0) {
          result.success = false;
          result.message = 'Workspace initialization encountered errors.';
          return result;
      }

      // 7. Emit WorkspaceCreated Event
      let eventEmitted = false;
      try {
        this.eventBus.publish({
          eventId: randomUUID(),
          id: workspace.id,
          type: 'WorkspaceCreated',
          timestamp: new Date().toISOString(),
          source: 'CreateWorkspaceCommand',
          version: 1,
          payload: { workspace }
        });
        eventEmitted = true;
      } catch (e) {
        result.details.errors.push(`Failed to emit WorkspaceCreated event: ${e instanceof Error ? e.message : String(e)}`);
      }

      if (!eventEmitted) {
        result.success = false;
        result.message = 'Workspace created but failed to emit event.';
        return result;
      }

      result.success = true;
      result.message = 'Workspace initialized and verified successfully.';
      return result;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      result.success = false;
      result.message = `Workspace initialization failed: ${errMessage}`;
      result.details.errors.push(errMessage);
      return result;
    }
  }
}
