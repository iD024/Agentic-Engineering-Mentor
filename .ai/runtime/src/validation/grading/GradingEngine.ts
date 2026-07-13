import type { Rubric } from '../rubrics/types.js';
import type { RubricEngine } from '../rubrics/RubricEngine.js';
import type { PipelineRunResult } from '../ValidationPipeline.js';
import type { GradeReport } from './GradeReport.js';
import { percentageToLetter } from './GradeReport.js';

/**
 * Aggregates a RubricScore into a final GradeReport.
 * Produces letter grade and human-readable feedback points.
 * Fully deterministic — no LLM.
 */
export class GradingEngine {
  constructor(private readonly rubricEngine: RubricEngine) {}

  grade(submissionId: string, rubric: Rubric, pipelineResult: PipelineRunResult): GradeReport {
    const rubricScore = this.rubricEngine.score(rubric, pipelineResult);
    const letter = percentageToLetter(rubricScore.percentage);

    const feedbackPoints: string[] = [];
    for (const cs of rubricScore.criterionScores) {
      const criterion = rubric.criteria.find(c => c.id === cs.criterionId);
      const name = criterion?.name ?? cs.criterionId;
      if (cs.passed) {
        feedbackPoints.push(`✅ ${name}: passed`);
      } else {
        const detail = cs.diagnosticMessages.join(', ') || 'did not meet requirements';
        feedbackPoints.push(`❌ ${name}: ${detail}`);
      }
    }

    return {
      submissionId,
      rubricId: rubric.id,
      pipelineResult,
      rubricScore,
      letter,
      timestamp: new Date().toISOString(),
      feedbackPoints,
    };
  }
}
