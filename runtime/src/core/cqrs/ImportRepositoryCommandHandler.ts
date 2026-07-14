import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import util from 'node:util';
import { ICommandHandler } from './interfaces.js';
import { ImportRepositoryCommand, ImportRepositoryResult } from './ImportRepositoryCommand.js';

const execAsync = util.promisify(exec);

export class ImportRepositoryCommandHandler implements ICommandHandler<ImportRepositoryCommand, ImportRepositoryResult> {
  readonly commandType = 'ImportRepositoryCommand';

  async execute(command: ImportRepositoryCommand): Promise<ImportRepositoryResult> {
    const { name, repositoryUrl, workspaceRoot } = command.payload;
    const destDir = path.join(workspaceRoot, '.ai', 'repositories', name);
    
    const result: ImportRepositoryResult = {
      success: false,
      message: '',
      details: {
        clonedTo: destDir,
        filesIndexed: 0,
        dbChanges: [],
        errors: []
      }
    };
    
    try {
      // 1. Check if it already exists
      try {
        const stat = await fs.stat(destDir);
        if (stat.isDirectory()) {
           result.details.errors.push('Repository directory already exists.');
           result.message = 'Repository already imported.';
           return result;
        }
      } catch {}

      await fs.mkdir(path.dirname(destDir), { recursive: true });

      // 2. Clone the repository
      try {
        // Just a basic clone, if it fails it might be an invalid URL.
        await execAsync(`git clone ${repositoryUrl} ${destDir}`);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        result.details.errors.push(`Git clone failed: ${errMsg}`);
        result.message = 'Failed to clone repository.';
        return result;
      }

      // 3. Write Metadata
      await fs.writeFile(path.join(destDir, 'metadata.json'), JSON.stringify({
        url: repositoryUrl,
        importedAt: new Date().toISOString()
      }, null, 2));

      // 4. Update workspace.json
      const workspaceJsonPath = path.join(workspaceRoot, '.ai', 'workspace.json');
      let workspaceJson: any = { repositories: [] };
      try {
        const raw = await fs.readFile(workspaceJsonPath, 'utf-8');
        workspaceJson = JSON.parse(raw);
        if (!workspaceJson.repositories) workspaceJson.repositories = [];
      } catch {}
      
      workspaceJson.repositories.push({
        name,
        url: repositoryUrl,
        path: destDir,
        importedAt: new Date().toISOString()
      });
      await fs.writeFile(workspaceJsonPath, JSON.stringify(workspaceJson, null, 2));
      result.details.dbChanges.push(`Added ${name} to workspace.json`);

      // 5. Verification
      const stat = await fs.stat(destDir);
      if (!stat.isDirectory()) {
         result.details.errors.push('Verification failed: Repository directory not created.');
         result.message = 'Verification failed.';
         return result;
      }
      
      const gitStat = await fs.stat(path.join(destDir, '.git'));
      if (!gitStat.isDirectory()) {
         result.details.errors.push('Verification failed: .git directory not found.');
         result.message = 'Verification failed.';
         return result;
      }

      // Optional: Count files indexed
      try {
        const { stdout } = await execAsync(`find ${destDir} -type f | wc -l`);
        result.details.filesIndexed = parseInt(stdout.trim(), 10);
      } catch {}

      result.success = true;
      result.message = `Successfully imported repository: ${name}`;
      return result;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      result.success = false;
      result.message = `Repository import failed: ${errMessage}`;
      result.details.errors.push(errMessage);
      return result;
    }
  }
}
