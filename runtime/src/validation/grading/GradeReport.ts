import type { RubricScore } from '../rubrics/types.js';
import type { PipelineRunResult } from '../ValidationPipeline.js';

export type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeReport {
  submissionId: string;
  rubricId: string;
  pipelineResult: PipelineRunResult;
  rubricScore: RubricScore;
  letter: GradeLetter;
  timestamp: string;
  feedbackPoints: string[];
}

export function percentageToLetter(pct: number): GradeLetter {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}
