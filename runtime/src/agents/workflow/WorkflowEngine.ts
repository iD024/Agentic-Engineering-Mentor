import type { AgentResult } from '../agent-runtime/types.js';

export interface WorkflowStep {
  id: string;
  name: string;
  agentId?: string; // If specific agent is required
  capabilities: string[];
  dependsOn: string[];
  input?: unknown;
}

export interface WorkflowDefinition {
  id: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecutionState {
  workflowId: string;
  completedSteps: Set<string>;
  pendingSteps: Set<string>;
  failedSteps: Set<string>;
  results: Map<string, AgentResult>;
}

/**
 * Manages the execution of a Directed Acyclic Graph (DAG) of agent steps.
 */
export class WorkflowEngine {
  executeWorkflow(workflow: WorkflowDefinition): WorkflowExecutionState {
    const state: WorkflowExecutionState = {
      workflowId: workflow.id,
      completedSteps: new Set(),
      pendingSteps: new Set(workflow.steps.map(s => s.id)),
      failedSteps: new Set(),
      results: new Map()
    };
    
    // Initial state creation. Actual execution happens via Runtime coordinating with Registry.
    return state;
  }

  getNextExecutableSteps(workflow: WorkflowDefinition, state: WorkflowExecutionState): WorkflowStep[] {
    return workflow.steps.filter(step => 
      state.pendingSteps.has(step.id) &&
      step.dependsOn.every(dep => state.completedSteps.has(dep))
    );
  }

  markStepCompleted(state: WorkflowExecutionState, stepId: string, result: AgentResult): void {
    state.pendingSteps.delete(stepId);
    state.completedSteps.add(stepId);
    state.results.set(stepId, result);
  }

  markStepFailed(state: WorkflowExecutionState, stepId: string, result: AgentResult): void {
    state.pendingSteps.delete(stepId);
    state.failedSteps.add(stepId);
    state.results.set(stepId, result);
  }
}
