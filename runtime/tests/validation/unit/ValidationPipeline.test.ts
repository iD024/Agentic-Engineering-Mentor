import { describe, it, expect } from 'vitest';
import { ValidationResult, ValidationStatus, ValidationSeverity } from '../../../src/validation/ValidationResult.js';
import { ValidationRegistry } from '../../../src/validation/ValidationRegistry.js';
import { ValidationTargetKind } from '../../../src/validation/types.js';
import type { IValidationRule } from '../../../src/validation/validators/ValidationRule.js';
import { ValidationPipeline } from '../../../src/validation/ValidationPipeline.js';

// ── Task 1: ValidationResult ───────────────────────────────────────────────
describe('ValidationResult', () => {
  it('creates a pass result', () => {
    const r = ValidationResult.pass('rule-1', 'ok');
    expect(r.status).toBe(ValidationStatus.Pass);
    expect(r.ruleId).toBe('rule-1');
    expect(r.message).toBe('ok');
  });

  it('creates a fail result with location', () => {
    const r = ValidationResult.fail('rule-2', 'bad import', ValidationSeverity.Error, { file: 'foo.ts', line: 10 });
    expect(r.status).toBe(ValidationStatus.Fail);
    expect(r.severity).toBe(ValidationSeverity.Error);
    expect(r.location?.file).toBe('foo.ts');
    expect(r.location?.line).toBe(10);
  });

  it('creates a skip result', () => {
    const r = ValidationResult.skip('rule-3', 'not applicable');
    expect(r.status).toBe(ValidationStatus.Skip);
  });
});

// ── Task 2: ValidationRegistry ─────────────────────────────────────────────
describe('ValidationRegistry', () => {
  it('registers and retrieves rules by kind', () => {
    const registry = new ValidationRegistry();
    const mockRule: IValidationRule = {
      id: 'test-rule',
      name: 'Test Rule',
      targetKinds: [ValidationTargetKind.Code],
      validate: async () => [],
    };
    registry.register(mockRule);
    const rules = registry.getRules(ValidationTargetKind.Code);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.id).toBe('test-rule');
  });

  it('returns empty array for unregistered kind', () => {
    const registry = new ValidationRegistry();
    expect(registry.getRules(ValidationTargetKind.Architecture)).toHaveLength(0);
  });

  it('getRule returns undefined for unknown id', () => {
    const registry = new ValidationRegistry();
    expect(registry.getRule('nonexistent')).toBeUndefined();
  });
});

// ── Task 3: ValidationPipeline ─────────────────────────────────────────────
describe('ValidationPipeline', () => {
  it('runs all rules applicable to the target kind', async () => {
    const registry = new ValidationRegistry();
    registry.register({
      id: 'code/always-pass',
      name: 'Always Pass',
      targetKinds: [ValidationTargetKind.Code],
      validate: async () => [ValidationResult.pass('code/always-pass', 'ok')],
    });
    const pipeline = new ValidationPipeline(registry);
    const result = await pipeline.run({ kind: ValidationTargetKind.Code, path: '/fake/path' });
    expect(result.passed).toBe(true);
    expect(result.passCount).toBe(1);
    expect(result.failCount).toBe(0);
    expect(result.results).toHaveLength(1);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('marks pipeline as failed when any rule fails', async () => {
    const registry = new ValidationRegistry();
    registry.register({
      id: 'code/always-fail',
      name: 'Always Fail',
      targetKinds: [ValidationTargetKind.Code],
      validate: async () => [ValidationResult.fail('code/always-fail', 'deliberate failure')],
    });
    const pipeline = new ValidationPipeline(registry);
    const result = await pipeline.run({ kind: ValidationTargetKind.Code, path: '/fake' });
    expect(result.passed).toBe(false);
    expect(result.failCount).toBe(1);
  });

  it('skips rules for mismatched target kind', async () => {
    const registry = new ValidationRegistry();
    registry.register({
      id: 'arch/rule',
      name: 'Arch Rule',
      targetKinds: [ValidationTargetKind.Architecture],
      validate: async () => [ValidationResult.pass('arch/rule', 'ok')],
    });
    const pipeline = new ValidationPipeline(registry);
    const result = await pipeline.run({ kind: ValidationTargetKind.Code, path: '/fake' });
    expect(result.results).toHaveLength(0);
    expect(result.passed).toBe(true);
  });
});
