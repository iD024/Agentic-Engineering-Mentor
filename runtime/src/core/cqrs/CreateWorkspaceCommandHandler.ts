import fs from 'node:fs/promises';
import path from 'node:path';
import { ICommandHandler } from './interfaces.js';
import { CreateWorkspaceCommand, CreateWorkspaceResult } from './CreateWorkspaceCommand.js';
import type { StateManager } from '../../state/StateManager.js';

export class CreateWorkspaceCommandHandler implements ICommandHandler<CreateWorkspaceCommand, CreateWorkspaceResult> {
  readonly commandType = 'CreateWorkspaceCommand';

  constructor(private readonly stateManager: StateManager) {}

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
      // 1. Create Workspace Directories
      const dirs = [
        'context',
        'docs',
        'profiles',
        'templates',
        'knowledge',
        'repositories',
        'sessions',
        'validation',
        'logs',
        'exports',
        'imports',
        'data' // added data dir for DB
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

      // 2. Initialize workspace.json
      const workspaceJsonPath = path.join(aiDir, 'workspace.json');
      let workspaceJsonExists = false;
      try {
        const stat = await fs.stat(workspaceJsonPath);
        workspaceJsonExists = stat.isFile();
      } catch {}

      if (!workspaceJsonExists) {
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
      }

      // 3. Initialize Database State
      let existingWorkspace = null;
      try {
         const allWorkspaces = this.stateManager.loadAllWorkspaces ? this.stateManager.loadAllWorkspaces() : [];
         if (allWorkspaces.length > 0) {
             existingWorkspace = allWorkspaces[0];
         }
      } catch {
         // stateManager might not support loadAllWorkspaces, just catch.
      }

      if (!existingWorkspace) {
        const workspace = this.stateManager.createWorkspace({
          name,
          description
        });
        
        this.stateManager.updateWorkspace(workspace.id, {
          initialized: true,
          state: 'active'
        });
        result.details.dbChanges.push(`Created workspace ${workspace.id}`);
        
        // Default Profile / Session metadata could be added here
        const session = this.stateManager.createSession({ workspaceId: workspace.id, goals: ['Initial Workspace Setup'] });
        result.details.dbChanges.push(`Created initial session ${session.id}`);
      } else {
        result.details.warnings.push('Workspace already exists in database, skipping DB initialization.');
      }

      // 4. Verification
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
