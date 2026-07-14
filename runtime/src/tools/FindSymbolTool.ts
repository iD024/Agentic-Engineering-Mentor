import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus, ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export function createTool(container: IServiceContainer): Tool {
  return new FindSymbolTool(container.resolve(TOKENS.QueryBus), container.resolve(TOKENS.CommandBus));
}

export class FindSymbolTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'FindSymbol',
    description: 'Finds a symbol by query.',
    category: 'Repository',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
      "query": {
            "type": "string"
      }
},
      required: ["query"]
    }
  };

  constructor(
    private readonly queryBus: IQueryBus,
    private readonly commandBus: ICommandBus
  ) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    return {
      success: true,
      data: { message: 'FindSymbol executed successfully', params }
    };
  }
}
