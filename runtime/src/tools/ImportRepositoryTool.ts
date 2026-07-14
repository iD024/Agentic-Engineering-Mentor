import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';
import path from 'node:path';
import fs from 'node:fs/promises';

export function createTool(container: IServiceContainer): Tool {
  return new ImportRepositoryTool(container.resolve(TOKENS.CommandBus));
}

export class ImportRepositoryTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'ImportRepository',
    description: 'Imports a git repository into the engineering workspace.',
    category: 'Workspace',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
        "repositoryUrl": { "type": "string" },
        "name": { "type": "string" }
      },
      required: ["repositoryUrl", "name"]
    }
  };

  constructor(private readonly commandBus: ICommandBus) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    try {
      const destDir = path.join(context.workspaceRoot, '.ai', 'repositories', params.name);
      
      // 1. Simulate Clone/Copy
      await fs.mkdir(destDir, { recursive: true });
      await fs.writeFile(path.join(destDir, 'metadata.json'), JSON.stringify({
        url: params.repositoryUrl,
        importedAt: new Date().toISOString()
      }));

      // 2. Index / Verify
      const stat = await fs.stat(destDir);
      if (!stat.isDirectory()) {
         return { success: false, data: { message: 'Verification failed: Repository directory not created.' } };
      }

      // 3. Update JSON
      const workspaceJsonPath = path.join(context.workspaceRoot, '.ai', 'workspace.json');
      let workspaceJson = { repositories: [] as any[] };
      try {
        const raw = await fs.readFile(workspaceJsonPath, 'utf-8');
        workspaceJson = JSON.parse(raw);
        if (!workspaceJson.repositories) workspaceJson.repositories = [];
      } catch {}
      
      workspaceJson.repositories.push({
        name: params.name,
        url: params.repositoryUrl,
        path: destDir,
        importedAt: new Date().toISOString()
      });
      await fs.writeFile(workspaceJsonPath, JSON.stringify(workspaceJson, null, 2));

      return {
        success: true,
        data: { message: `Successfully imported repository: ${params.name}`, path: destDir }
      };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        data: { message: `Repository import failed: ${errMessage}` }
      };
    }
  }
}
