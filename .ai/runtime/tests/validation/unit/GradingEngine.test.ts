import { describe, it, expect } from 'vitest';
import { GradingEngine } from '../../../src/validation/grading/GradingEngine.js';
import { RubricEngine } from '../../../src/validation/rubrics/RubricEngine.js';
import { percentageToLetter } from '../../../src/validation/grading/GradeReport.js';
import { ValidationResult, ValidationStatus } from '../../../src/validation/ValidationResult.js';
import { ValidationTargetKind } from '../../../src/validation/types.js';
import type { Rubric } from '../../../src/validation/rubrics/types.js';
import type { PipelineRunResult } from '../../../src/validation/ValidationPipeline.js';

const RUBRIC: Rubric = {
  id: 'test-rubric',
  name: 'Test Rubric',
  version: '1.0',
  passingThreshold: 70,
  criteria: [
    { id: 'c1', name: 'Compiler', description: 'Compiles', weight: 50, ruleIds: ['compiler/clean'], requiredPassCount: 1 },
    { id: 'c2', name: 'Tests', description: 'Tests pass', weight: 50, ruleIds: ['sim/tests'], requiredPassCount: 1 },
  ],
};

function pr(results: ValidationResult[]): PipelineRunResult {
  const passCount = results.filter(r => r.status === ValidationStatus.Pass).length;
  const failCount = results.filter(r => r.status === ValidationStatus.Fail).length;
  return {
    target: { kind: ValidationTargetKind.Code, path: '/fake' },
    results,
    passCount,
    failCount,
    errorCount: 0,
    skippedCount: 0,
    passed: failCount === 0,
    durationMs: 0,
  };
}

describe('GradingEngine', () => {
  it('grades A for 100%', () => {
    const engine = new GradingEngine(new RubricEngine());
    const report = engine.grade('sub-1', RUBRIC, pr([
      ValidationResult.pass('compiler/clean', 'ok'),
      ValidationResult.pass('sim/tests', 'ok'),
    ]));
    expect(report.letter).toBe('A');
    expect(report.rubricScore.percentage).toBe(100);
    expect(report.feedbackPoints).toHaveLength(2);
    expect(report.feedbackPoints[0]).toContain('✅');
  });

  it('grades F for 0%', () => {
    const engine = new GradingEngine(new RubricEngine());
    const report = engine.grade('sub-2', RUBRIC, pr([
      ValidationResult.fail('compiler/clean', 'error'),
      ValidationResult.fail('sim/tests', 'failure'),
    ]));
    expect(report.letter).toBe('F');
    expect(report.rubricScore.percentage).toBe(0);
    expect(report.feedbackPoints[0]).toContain('❌');
  });

  it('grades C for 70%', () => {
    expect(percentageToLetter(70)).toBe('C');
  });

  it('grades D for 65%', () => {
    expect(percentageToLetter(65)).toBe('D');
  });

  it('timestamps are ISO strings', () => {
    const engine = new GradingEngine(new RubricEngine());
    const report = engine.grade('sub-3', RUBRIC, pr([
      ValidationResult.pass('compiler/clean', 'ok'),
      ValidationResult.pass('sim/tests', 'ok'),
    ]));
    expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
  });
});
