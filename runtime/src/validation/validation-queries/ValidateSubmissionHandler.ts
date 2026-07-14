import type { IQueryHandler } from '../../core/cqrs/interfaces.js';
import { ValidateSubmissionQuery } from './ValidateSubmissionQuery.js';
import type { ValidationRuntime } from '../ValidationRuntime.js';
import type { ValidationReport } from '../reports/ValidationReport.js';

export class ValidateSubmissionHandler implements IQueryHandler<ValidateSubmissionQuery, ValidationReport> {
  readonly queryType = 'ValidateSubmissionQuery';

  constructor(private readonly runtime: ValidationRuntime) {}

  async execute(query: ValidateSubmissionQuery): Promise<ValidationReport> {
    return this.runtime.validateSubmission(query.submissionId, query.target, query.rubric, query.overrideRuleIds);
  }
}
