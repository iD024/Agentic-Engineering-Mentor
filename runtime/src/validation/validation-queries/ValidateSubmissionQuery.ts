import type { IQuery } from '../../core/cqrs/interfaces.js';
import type { ValidationTarget } from '../types.js';
import type { Rubric } from '../rubrics/types.js';

/**
 * Request to validate a submission deterministically.
 */
export class ValidateSubmissionQuery implements IQuery {
  readonly type = 'ValidateSubmissionQuery';
  constructor(
    public readonly submissionId: string,
    public readonly target: ValidationTarget,
    public readonly rubric: Rubric,
    public readonly overrideRuleIds?: string[],
  ) {}
}
