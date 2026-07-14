import { describe, it, expect } from 'vitest';
import { RubricEngine } from '../../../src/validation/rubrics/RubricEngine.js';
import { RubricLoader } from '../../../src/validation/rubrics/RubricLoader.js';
import type { Rubric } from '../../../src/validation/rubrics/types.js';
import { ValidationResult, ValidationStatus } from '../../../src/validation/ValidationResult.js';
import { ValidationTargetKind } from '../../../src/validation/types.js';
import type { PipelineRunResult } from '../../../src/validation/ValidationPipeline.js';

const RUBRIC: Rubric = {
  id: 'uart-driver-rubric',
  name: 'UART Driver Rubric',
  version: '1.0',
  passingThreshold: 70,
  criteria: [
    { id: 'c1', name: 'Compiles', description: 'Code compiles', weight: 40, ruleIds: ['compiler/no-errors'], requiredPassCount: 1 },
    { id: 'c2', name: 'Static Clean', description: 'No lint', weight: 30, ruleIds: ['static/no-lint-errors'], requiredPassCount: 1 },
    { id: 'c3', name: 'Tests Pass', description: 'Unit tests pass', weight: 30, ruleIds: ['sim/unit-tests'], requiredPassCount: 1 },
  ],
};

function makePipelineResult(results: ValidationResult[]): PipelineRunResult {
  const passCount = results.filter(r => r.status === ValidationStatus.Pass).length;
  const failCount = results.filter(r => r.status === ValidationStatus.Fail).length;
  const errorCount = results.filter(r => r.status === ValidationStatus.Error).length;
  const skippedCount = results.filter(r => r.status === ValidationStatus.Skip).length;
  return {
    target: { kind: ValidationTargetKind.Code, path: '/fake' },
    results,
    passCount,
    failCount,
    errorCount,
    skippedCount,
    passed: failCount === 0 && errorCount === 0,
    durationMs: 0,
  };
}

describe('RubricEngine', () => {
  it('scores 100% when all criteria pass', () => {
    const engine = new RubricEngine();
    const pr = makePipelineResult([
      ValidationResult.pass('compiler/no-errors', 'ok'),
      ValidationResult.pass('static/no-lint-errors', 'ok'),
      ValidationResult.pass('sim/unit-tests', 'ok'),
    ]);
    const score = engine.score(RUBRIC, pr);
    expect(score.percentage).toBe(100);
    expect(score.passed).toBe(true);
    expect(score.criterionScores).toHaveLength(3);
  });

  it('scores 40% when only compiler passes', () => {
    const engine = new RubricEngine();
    const pr = makePipelineResult([
      ValidationResult.pass('compiler/no-errors', 'ok'),
      ValidationResult.fail('static/no-lint-errors', 'lint error'),
      ValidationResult.fail('sim/unit-tests', 'test failed'),
    ]);
    const score = engine.score(RUBRIC, pr);
    expect(score.percentage).toBe(40);
    expect(score.passed).toBe(false);
  });

  it('scores 0% when all fail', () => {
    const engine = new RubricEngine();
    const pr = makePipelineResult([
      ValidationResult.fail('compiler/no-errors', 'fail'),
      ValidationResult.fail('static/no-lint-errors', 'fail'),
      ValidationResult.fail('sim/unit-tests', 'fail'),
    ]);
    const score = engine.score(RUBRIC, pr);
    expect(score.percentage).toBe(0);
    expect(score.passed).toBe(false);
  });

  it('includes diagnostic messages for failed criteria', () => {
    const engine = new RubricEngine();
    const pr = makePipelineResult([
      ValidationResult.fail('compiler/no-errors', 'syntax error at line 5'),
      ValidationResult.pass('static/no-lint-errors', 'ok'),
      ValidationResult.pass('sim/unit-tests', 'ok'),
    ]);
    const score = engine.score(RUBRIC, pr);
    const compilerScore = score.criterionScores.find(cs => cs.criterionId === 'c1')!;
    expect(compilerScore.diagnosticMessages).toContain('syntax error at line 5');
  });
});

describe('RubricLoader', () => {
  it('validates a valid rubric without errors', () => {
    const loader = new RubricLoader();
    expect(loader.validate(RUBRIC)).toHaveLength(0);
  });

  it('returns error for rubric missing criteria', () => {
    const loader = new RubricLoader();
    const errors = loader.validate({ ...RUBRIC, criteria: [] });
    expect(errors.some(e => e.includes('criteria'))).toBe(true);
  });

  it('loadFromObject succeeds for valid rubric', () => {
    const loader = new RubricLoader();
    const result = loader.loadFromObject(RUBRIC);
    expect(result.id).toBe('uart-driver-rubric');
  });

  it('loadFromObject throws for invalid rubric', () => {
    const loader = new RubricLoader();
    expect(() => loader.loadFromObject({ id: '', criteria: [] })).toThrow('Invalid rubric');
  });
});
