import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus, ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';
import { GetWorkspaceSummaryQuery } from '../core/cqrs/index.js';

export function createTool(container: IServiceContainer): Tool {
  return new WorkspaceSummaryTool(container.resolve(TOKENS.QueryBus), container.resolve(TOKENS.CommandBus));
}

export class WorkspaceSummaryTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'WorkspaceSummary',
    description: 'Provides a comprehensive summary of the current engineering workspace state.',
    category: 'Workspace',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
        "workspaceId": {
          "type": "string"
        }
      },
      required: ["workspaceId"]
    }
  };

  constructor(
    private readonly queryBus: IQueryBus,
    private readonly commandBus: ICommandBus
  ) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    const query = new GetWorkspaceSummaryQuery(params.workspaceId, context.workspaceRoot);
    
    try {
      const result = await this.queryBus.execute(query);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        data: { message: `Failed to get workspace summary: ${errMessage}` }
      };
    }
  }
}
