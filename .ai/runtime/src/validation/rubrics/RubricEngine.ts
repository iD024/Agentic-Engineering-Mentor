import type { Rubric, RubricScore, CriterionScore } from './types.js';
import type { PipelineRunResult } from '../ValidationPipeline.js';
import { ValidationStatus } from '../types.js';

/**
 * Deterministically scores a Rubric against a completed PipelineRunResult.
 * Maps rule pass/fail status → criterion earned points → percentage.
 * No LLM involvement.
 */
export class RubricEngine {
  score(rubric: Rubric, pipelineResult: PipelineRunResult): RubricScore {
    // Index worst status per ruleId (error > fail > skip > pass)
    const resultsByRule = new Map<string, ValidationStatus>();
    for (const r of pipelineResult.results) {
      const existing = resultsByRule.get(r.ruleId);
      if (!existing || this.statusSeverity(r.status) > this.statusSeverity(existing)) {
        resultsByRule.set(r.ruleId, r.status);
      }
    }

    const criterionScores: CriterionScore[] = [];
    let totalEarned = 0;
    let totalPossible = 0;

    for (const criterion of rubric.criteria) {
      totalPossible += criterion.weight;

      const passCount = criterion.ruleIds.filter(
        id => resultsByRule.get(id) === ValidationStatus.Pass,
      ).length;
      const passed = passCount >= criterion.requiredPassCount;
      const earned = passed ? criterion.weight : 0;
      totalEarned += earned;

      const diagnosticMessages = criterion.ruleIds
        .filter(id => {
          const s = resultsByRule.get(id);
          return s === ValidationStatus.Fail || s === ValidationStatus.Error;
        })
        .map(id => {
          const result = pipelineResult.results.find(r => r.ruleId === id);
          return result ? result.message : `Rule ${id} failed`;
        });

      criterionScores.push({
        criterionId: criterion.id,
        earned,
        possible: criterion.weight,
        passed,
        diagnosticMessages,
      });
    }

    const percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    return {
      rubricId: rubric.id,
      totalEarned,
      totalPossible,
      percentage,
      passed: percentage >= rubric.passingThreshold,
      criterionScores,
    };
  }

  private statusSeverity(s: ValidationStatus): number {
    switch (s) {
      case ValidationStatus.Error: return 3;
      case ValidationStatus.Fail:  return 2;
      case ValidationStatus.Skip:  return 1;
      default:                     return 0;
    }
  }
}
