/** Competency levels for a learning topic. */
export type CompetencyLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** Immutable learning progress domain model. */
export interface LearningProgress {
  readonly id: string;
  readonly workspaceId: string;
  readonly topic: string;
  readonly level: CompetencyLevel;
  readonly notes: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Validates that a value is a valid CompetencyLevel. */
export function isCompetencyLevel(value: unknown): value is CompetencyLevel {
  return (
    value === 'novice' ||
    value === 'beginner' ||
    value === 'intermediate' ||
    value === 'advanced' ||
    value === 'expert'
  );
}
