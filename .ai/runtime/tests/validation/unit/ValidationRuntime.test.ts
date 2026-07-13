import { describe, it, expect } from 'vitest';
import { ValidationRuntime } from '../../../src/validation/ValidationRuntime.js';
import { ValidationRegistry } from '../../../src/validation/ValidationRegistry.js';
import { GradingEngine } from '../../../src/validation/grading/GradingEngine.js';
import { RubricEngine } from '../../../src/validation/rubrics/RubricEngine.js';
import { ReportGenerator } from '../../../src/validation/reports/ReportGenerator.js';
import { ValidationTargetKind } from '../../../src/validation/types.js';
import type { Rubric } from '../../../src/validation/rubrics/types.js';
import { ValidationResult, ValidationSeverity } from '../../../src/validation/ValidationResult.js';
import type { IValidationRule } from '../../../src/validation/validators/ValidationRule.js';

const RUBRIC: Rubric = {
  id: 'test-rubric',
  name: 'Test',
  version: '1',
  passingThreshold: 70,
  criteria: [
    { id: 'c1', name: 'Crit1', description: 'desc', weight: 100, ruleIds: ['r1'], requiredPassCount: 1 },
  ],
};

class DummyRule implements IValidationRule {
  readonly id = 'r1';
  readonly name = 'Dummy';
  readonly targetKinds = [ValidationTargetKind.Code];
  async validate() {
    return [ValidationResult.fail('r1', 'dummy failure', ValidationSeverity.Error, { file: 'a.ts' })];
  }
}

describe('ReportGenerator', () => {
  it('generates markdown with diagnostics', () => {
    const generator = new ReportGenerator();
    const mockGrade = {
      submissionId: 's1',
      rubricId: 'r1',
      letter: 'F' as const,
      timestamp: new Date().toISOString(),
      feedbackPoints: ['❌ Crit1: dummy failure'],
      pipelineResult: {} as any,
      rubricScore: { percentage: 0 } as any,
    };
    const report = generator.generate(mockGrade, [
      { id: '1', ruleId: 'r1', severity: 'error' as any, message: 'dummy failure', source: 'src', location: { file: 'a.ts' } },
    ]);
    expect(report.id).toBeDefined();
    expect(report.markdownSummary).toContain('**Grade:** F (0%)');
    expect(report.markdownSummary).toContain('❌ ERROR');
    expect(report.markdownSummary).toContain('a.ts');
  });
});

describe('ValidationRuntime', () => {
  it('orchestrates full pipeline flow and returns ValidationReport', async () => {
    const registry = new ValidationRegistry();
    registry.register(new DummyRule());
    const rubricEngine = new RubricEngine();
    const gradingEngine = new GradingEngine(rubricEngine);
    const reportGenerator = new ReportGenerator();
    const runtime = new ValidationRuntime(registry, gradingEngine, reportGenerator);

    const report = await runtime.validateSubmission('sub-1', { kind: ValidationTargetKind.Code, path: '/fake' }, RUBRIC);

    expect(report.gradeReport.submissionId).toBe('sub-1');
    expect(report.gradeReport.letter).toBe('F');
    expect(report.diagnostics).toHaveLength(1);
    expect(report.diagnostics[0]!.message).toBe('dummy failure');
  });
});
