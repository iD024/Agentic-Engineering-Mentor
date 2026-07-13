import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus } from '../core/cqrs/interfaces.js';
import { RepositorySummaryQuery } from '../repository-queries/RepositorySummaryQuery.js';

export class GetRepositorySummaryTool implements Tool<void, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'GetRepositorySummary',
    description: 'Retrieves a summary of the repository including total symbols, edges, and nodes.',
    category: 'Repository',
    version: new SemanticVersion(1, 0, 0),
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  };

  constructor(private readonly queryBus: IQueryBus) {}

  async execute(_params: void, _context: ToolContext): Promise<ToolResult<unknown>> {
    try {
      const summary = await this.queryBus.execute(new RepositorySummaryQuery());
      return {
        success: true,
        data: summary
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
}
