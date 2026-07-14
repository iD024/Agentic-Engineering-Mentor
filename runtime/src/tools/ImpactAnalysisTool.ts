import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus } from '../core/cqrs/interfaces.js';
import { ImpactAnalysisQuery } from '../repository-queries/ImpactAnalysisQuery.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export function createTool(container: IServiceContainer): Tool {
  return new ImpactAnalysisTool(container.resolve(TOKENS.QueryBus));
}

export class ImpactAnalysisTool implements Tool<{ targetNodeIds: string[] }, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'ImpactAnalysis',
    description: 'Analyzes the impact of changes to a specific node in the repository.',
    category: 'Foundation',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
        targetNodeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'The IDs of the target nodes to analyze'
        }
      },
      required: ['targetNodeIds']
    }
  };

  constructor(private readonly queryBus: IQueryBus) {}

  async execute(params: { targetNodeIds: string[] }, _context: ToolContext): Promise<ToolResult<unknown>> {
    try {
      const analysis = await this.queryBus.execute(new ImpactAnalysisQuery(params.targetNodeIds));
      return { success: true, data: analysis };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
