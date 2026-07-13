import type { IAgent, AgentResult } from './types.js';
import type { AgentRegistry } from '../agent-registry/AgentRegistry.js';
import type { AgentContext } from '../agent-context/AgentContext.js';
import type { ILogger } from '../../interfaces/ILogger.js';
import type { WorkflowDefinition } from '../workflow/WorkflowEngine.js';
import { WorkflowEngine } from '../workflow/WorkflowEngine.js';
import { AgentPlanner } from '../agent-planner/AgentPlanner.js';

export interface AgentRuntimeOptions {
  registry: AgentRegistry;
  logger: ILogger;
}

/**
 * Orchestrates the lifecycle of active agents and manages workflow execution.
 * Interfaces with the Gateway and EventBus.
 */
export class AgentRuntime {
  private readonly registry: AgentRegistry;
  private readonly logger: ILogger;
  private readonly workflowEngine: WorkflowEngine;
  private readonly planner: AgentPlanner;

  constructor(options: AgentRuntimeOptions) {
    this.registry = options.registry;
    this.logger = options.logger;
    this.workflowEngine = new WorkflowEngine();
    this.planner = new AgentPlanner();
  }

  /**
   * Executes a specific agent by ID.
   */
  async executeAgent(agentId: string, taskId: string, input: unknown, context: AgentContext): Promise<AgentResult> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.logger.info(`Starting execution of agent ${agentId} for task ${taskId}`);
    
    await agent.start(context);
    try {
      const result = await agent.executeTask(taskId, input);
      return result;
    } finally {
      await agent.stop();
    }
  }

  /**
   * Executes a multi-agent workflow defined by a plan.
   */
  async executeWorkflow(workflow: WorkflowDefinition, context: AgentContext): Promise<AgentResult> {
    const state = this.workflowEngine.executeWorkflow(workflow);
    
    // Simplistic workflow loop
    while (state.pendingSteps.size > 0 && state.failedSteps.size === 0) {
      const executableSteps = this.workflowEngine.getNextExecutableSteps(workflow, state);
      if (executableSteps.length === 0 && state.pendingSteps.size > 0) {
        throw new Error('Deadlock detected in workflow execution');
      }

      for (const step of executableSteps) {
        const agent = step.agentId 
          ? this.registry.getAgent(step.agentId)
          : this.registry.getBestAgentForCapabilities(step.capabilities as any[]); // Cast to match enum
          
        if (!agent) {
          throw new Error(`No capable agent found for step ${step.id}`);
        }

        try {
          await agent.start(context);
          const result = await agent.executeTask(step.id, step.input);
          
          if (result.success) {
            this.workflowEngine.markStepCompleted(state, step.id, result);
          } else {
            this.workflowEngine.markStepFailed(state, step.id, result);
          }
        } finally {
          await agent.stop();
        }
      }
    }

    if (state.failedSteps.size > 0) {
      return {
        success: false,
        error: `Workflow failed at steps: ${Array.from(state.failedSteps).join(', ')}`,
        capabilitiesUsed: []
      };
    }

    return {
      success: true,
      data: Object.fromEntries(state.results),
      capabilitiesUsed: [] // Aggregated capabilities could be added here
    };
  }
}
