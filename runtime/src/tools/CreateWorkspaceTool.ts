import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus, ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

import { CreateWorkspaceCommand } from '../core/cqrs/index.js';

export function createTool(container: IServiceContainer): Tool {
  return new CreateWorkspaceTool(container.resolve(TOKENS.QueryBus), container.resolve(TOKENS.CommandBus));
}

export class CreateWorkspaceTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'CreateWorkspace',
    description: 'Creates a new workspace.',
    category: 'Workspace',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
      "name": {
            "type": "string"
      }
},
      required: ["name"]
    }
  };

  constructor(
    private readonly queryBus: IQueryBus,
    private readonly commandBus: ICommandBus
  ) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    const command = new CreateWorkspaceCommand({
      name: params.name,
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
        data: { message: `Execution failed: ${errMessage}` }
      };
    }
  }
}
