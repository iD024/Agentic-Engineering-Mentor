import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus } from '../core/cqrs/interfaces.js';
import { FindDefinitionQuery } from '../repository-queries/FindDefinitionQuery.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export function createTool(container: IServiceContainer): Tool {
  return new FindDefinitionTool(container.resolve(TOKENS.QueryBus));
}

export class FindDefinitionTool implements Tool<{ symbolName: string }, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'FindDefinition',
    description: 'Finds the definition of a symbol in the repository.',
    category: 'Repository',
    version: new SemanticVersion(1, 0, 0),
    parameters: {
      type: 'object',
      properties: {
        symbolName: { type: 'string', description: 'The name of the symbol to find' }
      },
      required: ['symbolName']
    }
  };

  constructor(private readonly queryBus: IQueryBus) {}

  async execute(params: { symbolName: string }, _context: ToolContext): Promise<ToolResult<unknown>> {
    try {
      const definition = await this.queryBus.execute(new FindDefinitionQuery(params.symbolName));
      if (!definition) {
        return { success: false, error: 'Definition not found' };
      }
      return { success: true, data: definition };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
