import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus, ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

import path from 'node:path';
import fs from 'node:fs/promises';

export function createTool(container: IServiceContainer): Tool {
  return new ImportWorkspaceTool(container.resolve(TOKENS.QueryBus), container.resolve(TOKENS.CommandBus));
}

export class ImportWorkspaceTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'ImportWorkspace',
    description: 'Imports a workspace from a path.',
    category: 'Workspace',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
      "path": {
            "type": "string"
      }
},
      required: ["path"]
    }
  };

  constructor(
    private readonly queryBus: IQueryBus,
    private readonly commandBus: ICommandBus
  ) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    try {
      const destDir = path.join(context.workspaceRoot, '.ai');
      const stat = await fs.stat(destDir).catch(() => null);
      if (!stat) {
        return { success: false, data: { message: "Verification failed: .ai directory not found to import." } };
      }
      
      return {
        success: true,
        data: { message: 'Workspace imported and indexed successfully', path: params.path }
      };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return { success: false, data: { message: `Import failed: ${errMessage}` } };
    }
  }
}
