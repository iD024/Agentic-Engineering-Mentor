import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus, ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';
import path from 'node:path';
import fs from 'node:fs/promises';

export function createTool(container: IServiceContainer): Tool {
  return new ImportKnowledgeTool(container.resolve(TOKENS.CommandBus));
}

export class ImportKnowledgeTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'ImportKnowledge',
    description: 'Imports a document (PDF, Markdown, Notes) into the workspace knowledge base.',
    category: 'Workspace',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
        "filePath": { "type": "string" },
        "type": { "type": "string", "enum": ["Notes", "Markdown", "PDF", "Datasheet", "Book"] }
      },
      required: ["filePath", "type"]
    }
  };

  constructor(private readonly commandBus: ICommandBus) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    try {
      const sourceFile = params.filePath;
      const fileName = path.basename(sourceFile);
      const destDir = path.join(context.workspaceRoot, '.ai', 'knowledge', params.type.toLowerCase() + 's');
      const destFile = path.join(destDir, fileName);
      
      // 1. Copy
      await fs.mkdir(destDir, { recursive: true });
      await fs.copyFile(sourceFile, destFile);

      // 2. Index / Verify
      const stat = await fs.stat(destFile);
      if (!stat.isFile()) {
         return { success: false, data: { message: 'Verification failed: File not found in workspace.' } };
      }

      // 3. Update JSON
      const workspaceJsonPath = path.join(context.workspaceRoot, '.ai', 'workspace.json');
      let workspaceJson = { knowledge: [] as any[] };
      try {
        const raw = await fs.readFile(workspaceJsonPath, 'utf-8');
        workspaceJson = JSON.parse(raw);
        if (!workspaceJson.knowledge) workspaceJson.knowledge = [];
      } catch {}
      
      workspaceJson.knowledge.push({
        file: destFile,
        type: params.type,
        importedAt: new Date().toISOString()
      });
      await fs.writeFile(workspaceJsonPath, JSON.stringify(workspaceJson, null, 2));

      return {
        success: true,
        data: { message: `Successfully imported ${params.type}: ${fileName}`, path: destFile }
      };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        data: { message: `Import failed: ${errMessage}` }
      };
    }
  }
}
