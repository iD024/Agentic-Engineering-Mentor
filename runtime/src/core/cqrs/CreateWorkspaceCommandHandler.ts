import fs from 'node:fs/promises';
import path from 'node:path';
import { ICommandHandler } from './interfaces.js';
import { CreateWorkspaceCommand } from './CreateWorkspaceCommand.js';
import type { StateManager } from '../../state/StateManager.js';

export class CreateWorkspaceCommandHandler implements ICommandHandler<CreateWorkspaceCommand, { success: boolean, message: string }> {
  readonly commandType = 'CreateWorkspaceCommand';

  constructor(private readonly stateManager: StateManager) {}

  async execute(command: CreateWorkspaceCommand): Promise<{ success: boolean, message: string }> {
    const { name, description, workspaceRoot } = command.payload;
    const aiDir = path.join(workspaceRoot, '.ai');
    
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
        'imports'
      ];
      
      for (const dir of dirs) {
        await fs.mkdir(path.join(aiDir, dir), { recursive: true });
      }

      // 2. Initialize workspace.json
      const workspaceJsonPath = path.join(aiDir, 'workspace.json');
      const workspaceJsonData = {
        name: name,
        description: description || '',
        version: '2.0.0',
        created_at: new Date().toISOString()
      };
      await fs.writeFile(workspaceJsonPath, JSON.stringify(workspaceJsonData, null, 2));

      // 3. Initialize WORKSPACE.md
      const workspaceMdPath = path.join(aiDir, 'WORKSPACE.md');
      const workspaceMdContent = `# ${name}\n\n${description || 'A new Antigravity Engineering Workspace.'}\n\n## Overview\nThis workspace is deterministically managed by the Antigravity runtime.`;
      await fs.writeFile(workspaceMdPath, workspaceMdContent);

      // 4. Initialize Database State
      const workspace = this.stateManager.createWorkspace({
        name,
        description
      });
      
      this.stateManager.updateWorkspace(workspace.id, {
        initialized: true,
        state: 'active'
      });
      
      // Default Profile / Session metadata could be added here
      this.stateManager.createSession({ workspaceId: workspace.id, goals: ['Initial Workspace Setup'] });

      // 5. Verification
      const verifyDirs = await Promise.all(dirs.map(async (dir) => {
        try {
          const stat = await fs.stat(path.join(aiDir, dir));
          return stat.isDirectory();
        } catch {
          return false;
        }
      }));
      
      if (verifyDirs.includes(false)) {
        return { success: false, message: 'Failed to verify all created directories.' };
      }
      
      const jsonStat = await fs.stat(workspaceJsonPath);
      const mdStat = await fs.stat(workspaceMdPath);
      
      if (!jsonStat.isFile() || !mdStat.isFile()) {
         return { success: false, message: 'Failed to verify initialization files.' };
      }

      return { success: true, message: 'Workspace initialized and verified successfully.' };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Workspace initialization failed: ${errMessage}` };
    }
  }
}
