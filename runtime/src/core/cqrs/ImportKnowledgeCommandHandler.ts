import fs from 'node:fs/promises';
import path from 'node:path';
import { ICommandHandler } from './interfaces.js';
import { ImportKnowledgeCommand, ImportKnowledgeResult } from './ImportKnowledgeCommand.js';

export class ImportKnowledgeCommandHandler implements ICommandHandler<ImportKnowledgeCommand, ImportKnowledgeResult> {
  readonly commandType = 'ImportKnowledgeCommand';

  async execute(command: ImportKnowledgeCommand): Promise<ImportKnowledgeResult> {
    const { filePath, type, workspaceRoot } = command.payload;
    const fileName = path.basename(filePath);
    const destDir = path.join(workspaceRoot, '.ai', 'knowledge', type.toLowerCase() + 's');
    const destFile = path.join(destDir, fileName);
    
    const result: ImportKnowledgeResult = {
      success: false,
      message: '',
      details: {
        copiedTo: destFile,
        dbChanges: [],
        errors: []
      }
    };
    
    try {
      // 1. Copy File
      await fs.mkdir(destDir, { recursive: true });
      try {
        await fs.copyFile(filePath, destFile);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        result.details.errors.push(`Failed to copy file: ${errMsg}`);
        result.message = 'Failed to copy file.';
        return result;
      }

      // 2. Index / Verify
      try {
        const stat = await fs.stat(destFile);
        if (!stat.isFile()) {
           result.details.errors.push('Verification failed: File not found in workspace.');
           result.message = 'Verification failed.';
           return result;
        }
      } catch {
        result.details.errors.push('Verification failed: Could not stat copied file.');
        result.message = 'Verification failed.';
        return result;
      }

      // 3. Update workspace.json
      const workspaceJsonPath = path.join(workspaceRoot, '.ai', 'workspace.json');
      let workspaceJson: any = { knowledge: [] };
      try {
        const raw = await fs.readFile(workspaceJsonPath, 'utf-8');
        workspaceJson = JSON.parse(raw);
        if (!workspaceJson.knowledge) workspaceJson.knowledge = [];
      } catch {}
      
      workspaceJson.knowledge.push({
        file: destFile,
        type: type,
        importedAt: new Date().toISOString()
      });
      await fs.writeFile(workspaceJsonPath, JSON.stringify(workspaceJson, null, 2));
      result.details.dbChanges.push(`Added ${fileName} to workspace.json knowledge list`);

      result.success = true;
      result.message = `Successfully imported ${type}: ${fileName}`;
      return result;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      result.success = false;
      result.message = `Import failed: ${errMessage}`;
      result.details.errors.push(errMessage);
      return result;
    }
  }
}
