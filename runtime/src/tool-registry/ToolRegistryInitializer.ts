import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import type { ToolRegistry } from './ToolRegistry.js';
import type { ILogger } from '../interfaces/ILogger.js';
import { TOKENS } from '../core/di/ServiceTokens.js';

// Static Tool Imports
import { createTool as createCompleteMilestoneTool } from '../tools/CompleteMilestoneTool.js';
import { createTool as createCreateWorkspaceTool } from '../tools/CreateWorkspaceTool.js';
import { createTool as createFindDefinitionTool } from '../tools/FindDefinitionTool.js';
import { createTool as createGetRepositorySummaryTool } from '../tools/GetRepositorySummaryTool.js';
import { createTool as createGetWorkspaceTool } from '../tools/GetWorkspaceTool.js';
import { createTool as createImpactAnalysisTool } from '../tools/ImpactAnalysisTool.js';
import { createTool as createImportKnowledgeTool } from '../tools/ImportKnowledgeTool.js';
import { createTool as createImportRepositoryTool } from '../tools/ImportRepositoryTool.js';
import { createTool as createImportWorkspaceTool } from '../tools/ImportWorkspaceTool.js';
import { createTool as createWorkspaceSummaryTool } from '../tools/WorkspaceSummaryTool.js';

export class ToolRegistryInitializer {
  private readonly logger: ILogger;

  constructor(
    private readonly container: IServiceContainer,
    private readonly registry: ToolRegistry
  ) {
    this.logger = this.container.resolve(TOKENS.LoggerFactory).createLogger('ToolRegistryInitializer');
  }

  async initialize(): Promise<void> {
    this.logger.info('Starting static tool registration');
    
    const toolCreators = [
      createCompleteMilestoneTool,
      createCreateWorkspaceTool,
      createFindDefinitionTool,
      createGetRepositorySummaryTool,
      createGetWorkspaceTool,
      createImpactAnalysisTool,
      createImportKnowledgeTool,
      createImportRepositoryTool,
      createImportWorkspaceTool,
      createWorkspaceSummaryTool
    ];

    for (const creator of toolCreators) {
      try {
        const tool = creator(this.container);
        this.registry.register(tool);
        this.logger.info(`Registered tool: ${tool.descriptor.name} (${tool.descriptor.category})`);
      } catch (err) {
        this.logger.error(`Failed to initialize tool: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    this.logger.info(`Loaded ${this.registry.getAll().length} tools in total`);
  }
}
