/** Possible states of a milestone. */
export type MilestoneState = 'pending' | 'in_progress' | 'completed' | 'skipped';

/** Immutable milestone domain model. */
export interface Milestone {
  readonly id: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly description: string;
  readonly state: MilestoneState;
  readonly orderIndex: number;
  readonly completedAt: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Validates that a value is a valid MilestoneState. */
export function isMilestoneState(value: unknown): value is MilestoneState {
  return (
    value === 'pending' ||
    value === 'in_progress' ||
    value === 'completed' ||
    value === 'skipped'
  );
}
