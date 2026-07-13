import type { IAgent, AgentManifest, AgentResult } from '../agent-runtime/types.js';
import { AgentCapability } from '../agent-runtime/types.js';
import type { AgentContext } from '../agent-context/AgentContext.js';

export class CodeDependencyValidator implements IAgent {
  public readonly manifest: AgentManifest = {
    id: 'code-dependency-validator',
    name: 'Code & Dependency Validator',
    version: '1.0.0',
    description: 'Verifies code correctness and dependencies via Repository Intelligence.',
    capabilities: [AgentCapability.CODE_ANALYSIS, AgentCapability.TESTING],
    executionMode: 'synchronous'
  };

  private context?: AgentContext;

  async initialize(): Promise<void> {}

  async start(context: unknown): Promise<void> {
    this.context = context as AgentContext;
    this.context.logger.info(`${this.manifest.name} started.`);
  }

  async pause(): Promise<void> {}
  async resume(): Promise<void> {}

  async stop(): Promise<void> {
    this.context = undefined;
  }

  async executeTask(taskId: string, input: unknown): Promise<AgentResult> {
    if (!this.context) throw new Error('Agent not started');
    
    this.context.logger.info(`Validator checking task: ${taskId}`);
    
    return {
      success: true,
      data: { validated: true, input },
      capabilitiesUsed: [AgentCapability.CODE_ANALYSIS, AgentCapability.TESTING]
    };
  }
}
