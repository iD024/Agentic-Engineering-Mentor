import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import { SemanticVersion, type ToolDescriptor, type ToolResult } from '../tool-registry/ToolModels.js';
import type { ICommandBus } from '../core/cqrs/interfaces.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';
import { ImportKnowledgeCommand } from '../core/cqrs/index.js';

export function createTool(container: IServiceContainer): Tool {
  return new ImportKnowledgeTool(container.resolve(TOKENS.CommandBus));
}

export class ImportKnowledgeTool implements Tool<any, unknown> {
  readonly descriptor: ToolDescriptor = {
    name: 'ImportKnowledge',
    description: 'Imports a document (PDF, Markdown, Notes) into the workspace knowledge base.',
    category: 'Workspace',
    version: new SemanticVersion(1, 0, 0),
    visibility: 'public',
    parameters: {
      type: 'object',
      properties: {
        "filePath": { "type": "string" },
        "type": { "type": "string", "enum": ["Notes", "Markdown", "PDF", "Datasheet", "Book"] }
      },
      required: ["filePath", "type"]
    }
  };

  constructor(private readonly commandBus: ICommandBus) {}

  async execute(params: any, context: ToolContext): Promise<ToolResult<unknown>> {
    const command = new ImportKnowledgeCommand({
      filePath: params.filePath,
      type: params.type,
      workspaceRoot: context.workspaceRoot
    });
    
    try {
      const result = await this.commandBus.execute(command) as any;
      return {
        success: result.success,
        data: result
      };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        data: { message: `Import failed: ${errMessage}` }
      };
    }
  }
}
