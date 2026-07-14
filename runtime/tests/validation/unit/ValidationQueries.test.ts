import { describe, it, expect } from 'vitest';
import { ValidateSubmissionQuery } from '../../../src/validation/validation-queries/ValidateSubmissionQuery.js';
import { ValidateSubmissionHandler } from '../../../src/validation/validation-queries/ValidateSubmissionHandler.js';
import { ValidationRuntime } from '../../../src/validation/ValidationRuntime.js';
import { ValidationRegistry } from '../../../src/validation/ValidationRegistry.js';
import { GradingEngine } from '../../../src/validation/grading/GradingEngine.js';
import { RubricEngine } from '../../../src/validation/rubrics/RubricEngine.js';
import { ReportGenerator } from '../../../src/validation/reports/ReportGenerator.js';
import { ValidationTargetKind } from '../../../src/validation/types.js';
import type { Rubric } from '../../../src/validation/rubrics/types.js';

describe('ValidateSubmissionHandler', () => {
  it('handles query and returns ValidationReport', async () => {
    const registry = new ValidationRegistry();
    const runtime = new ValidationRuntime(registry, new GradingEngine(new RubricEngine()), new ReportGenerator());
    const handler = new ValidateSubmissionHandler(runtime);
    
    const rubric: Rubric = {
      id: 'r1', name: 'R1', version: '1', passingThreshold: 50, criteria: [],
    };
    const query = new ValidateSubmissionQuery('s1', { kind: ValidationTargetKind.Code, path: '/fake' }, rubric);
    
    const result = await handler.execute(query);
    expect(result.gradeReport.submissionId).toBe('s1');
  });
});
