import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { ICommandBus } from '../core/cqrs/interfaces.js';
import { CompleteMilestoneCommand } from '../core/cqrs/CompleteMilestoneCommand.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export function createTool(container: IServiceContainer): Tool {
  return new CompleteMilestoneTool(container.resolve(TOKENS.CommandBus));
}

export class CompleteMilestoneTool implements Tool<{ milestoneId: string }, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'CompleteMilestone',
    description: 'Marks a specific milestone as complete.',
    category: 'Workspace',
    version: new SemanticVersion(1, 0, 0),
    parameters: {
      type: 'object',
      properties: {
        milestoneId: { type: 'string', description: 'The ID of the milestone to complete' }
      },
      required: ['milestoneId']
    }
  };

  constructor(private readonly commandBus: ICommandBus) {}

  async execute(params: { milestoneId: string }, _context: ToolContext): Promise<ToolResult<unknown>> {
    try {
      await this.commandBus.execute(new CompleteMilestoneCommand(params.milestoneId));
      return { success: true, data: { status: 'Milestone completed successfully' } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
