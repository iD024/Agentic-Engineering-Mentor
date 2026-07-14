import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus } from '../core/cqrs/interfaces.js';
import { GetWorkspaceQuery } from '../core/cqrs/GetWorkspaceQuery.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export function createTool(container: IServiceContainer): Tool {
  return new GetWorkspaceTool(container.resolve(TOKENS.QueryBus));
}

export class GetWorkspaceTool implements Tool<{ workspaceId: string }, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'GetWorkspace',
    description: 'Retrieves the workspace by ID.',
    category: 'Foundation',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'The ID of the workspace' }
      },
      required: ['workspaceId']
    }
  };

  constructor(private readonly queryBus: IQueryBus) {}

  async execute(params: { workspaceId: string }, _context: ToolContext): Promise<ToolResult<unknown>> {
    try {
      const workspace = await this.queryBus.execute(new GetWorkspaceQuery(params.workspaceId));
      if (!workspace) {
        return { success: false, error: 'Workspace not found' };
      }
      return { success: true, data: workspace };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
