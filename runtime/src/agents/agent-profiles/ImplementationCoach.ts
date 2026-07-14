import type { IAgent, AgentManifest, AgentResult } from '../agent-runtime/types.js';
import { AgentCapability } from '../agent-runtime/types.js';
import type { AgentContext } from '../agent-context/AgentContext.js';

export class ImplementationCoach implements IAgent {
  public readonly manifest: AgentManifest = {
    id: 'implementation-coach',
    name: 'Implementation Coach',
    version: '1.0.0',
    description: 'Guides the user through implementing code changes.',
    capabilities: [AgentCapability.CODE_ANALYSIS, AgentCapability.CODE_GENERATION, AgentCapability.PEDAGOGY],
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
    
    this.context.logger.info(`Coach executing task: ${taskId}`);
    
    return {
      success: true,
      data: { guidance: 'Please implement the following...', input },
      capabilitiesUsed: [AgentCapability.CODE_ANALYSIS, AgentCapability.PEDAGOGY]
    };
  }
}
