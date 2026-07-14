import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus, ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export function createTool(container: IServiceContainer): Tool {
  return new RelatedTopicsTool(container.resolve(TOKENS.QueryBus), container.resolve(TOKENS.CommandBus));
}

export class RelatedTopicsTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'RelatedTopics',
    description: 'Finds related topics.',
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
      data: { message: 'RelatedTopics executed successfully', params }
    };
  }
}
