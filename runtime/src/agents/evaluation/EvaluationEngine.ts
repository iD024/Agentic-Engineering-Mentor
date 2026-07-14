import type { WorkflowExecutionState } from '../workflow/WorkflowEngine.js';
import type { AgentResult } from '../agent-runtime/types.js';

export interface EvaluationCriteria {
  acceptanceCriteria: string[];
  strictMode: boolean;
}

export interface EvaluationResult {
  isComplete: boolean;
  failedCriteria: string[];
  overallResult: AgentResult;
}

/**
 * Validates whether an overall goal or workflow has been met.
 */
export class EvaluationEngine {
  /**
   * Evaluates if the workflow execution satisfies the criteria.
   */
  async evaluateWorkflow(state: WorkflowExecutionState, criteria: EvaluationCriteria): Promise<EvaluationResult> {
    const isComplete = state.pendingSteps.size === 0 && state.failedSteps.size === 0;
    
    // Basic validation of workflow execution state
    const failedCriteria: string[] = [];
    if (!isComplete && criteria.strictMode) {
      failedCriteria.push('Not all steps completed successfully.');
    }

    return {
      isComplete,
      failedCriteria,
      overallResult: {
        success: isComplete,
        capabilitiesUsed: [],
        error: failedCriteria.length > 0 ? failedCriteria.join(', ') : undefined
      }
    };
  }
}
