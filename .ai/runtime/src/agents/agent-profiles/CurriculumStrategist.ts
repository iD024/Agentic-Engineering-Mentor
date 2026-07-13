import type { IAgent, AgentManifest, AgentResult } from '../agent-runtime/types.js';
import { AgentCapability } from '../agent-runtime/types.js';
import type { AgentContext } from '../agent-context/AgentContext.js';

export class CurriculumStrategist implements IAgent {
  public readonly manifest: AgentManifest = {
    id: 'curriculum-strategist',
    name: 'Curriculum Strategist',
    version: '1.0.0',
    description: 'Plans the optimal learning path for a given topic.',
    capabilities: [AgentCapability.PLANNING, AgentCapability.PEDAGOGY],
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
    
    this.context.logger.info(`Strategist creating curriculum for task: ${taskId}`);
    
    return {
      success: true,
      data: { strategy: 'Step-by-step guidance plan', input },
      capabilitiesUsed: [AgentCapability.PLANNING, AgentCapability.PEDAGOGY]
    };
  }
}
