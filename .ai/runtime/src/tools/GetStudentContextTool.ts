import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { IQueryBus, ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

export function createTool(container: IServiceContainer): Tool {
  return new GetStudentContextTool(container.resolve(TOKENS.QueryBus), container.resolve(TOKENS.CommandBus));
}

export class GetStudentContextTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'GetStudentContext',
    description: 'Gets student context.',
    category: 'Learning',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
      "studentId": {
            "type": "string"
      }
},
      required: ["studentId"]
    }
  };

  constructor(
    private readonly queryBus: IQueryBus,
    private readonly commandBus: ICommandBus
  ) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    return {
      success: true,
      data: { message: 'GetStudentContext executed successfully', params }
    };
  }
}
