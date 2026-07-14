import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';
import { ImportRepositoryCommand } from '../core/cqrs/index.js';

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
    const command = new ImportRepositoryCommand({
      name: params.name,
      repositoryUrl: params.repositoryUrl,
      workspaceRoot: context.workspaceRoot
    });
    
    try {
      const result = await this.commandBus.execute(command) as any;
      return {
        success: result.success,
        data: result
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
