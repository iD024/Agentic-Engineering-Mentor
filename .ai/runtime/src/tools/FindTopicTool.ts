import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus, ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export function createTool(container: IServiceContainer): Tool {
  return new FindTopicTool(container.resolve(TOKENS.QueryBus), container.resolve(TOKENS.CommandBus));
}

export class FindTopicTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'FindTopic',
    description: 'Finds a specific topic.',
    category: 'Knowledge',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
      "topicId": {
            "type": "string"
      }
},
      required: ["topicId"]
    }
  };

  constructor(
    private readonly queryBus: IQueryBus,
    private readonly commandBus: ICommandBus
  ) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    return {
      success: true,
      data: { message: 'FindTopic executed successfully', params }
    };
  }
}
