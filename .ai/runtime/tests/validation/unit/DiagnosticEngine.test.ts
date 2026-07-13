import { describe, it, expect } from 'vitest';
import { DiagnosticEngine } from '../../../src/validation/diagnostics/DiagnosticEngine.js';
import { ValidationResult, ValidationSeverity } from '../../../src/validation/ValidationResult.js';
import { DiagnosticSeverity } from '../../../src/validation/diagnostics/Diagnostic.js';

describe('DiagnosticEngine', () => {
  it('converts ValidationResults to Diagnostics (pass results excluded)', () => {
    const results = [
      ValidationResult.fail('rule-1', 'bad import', ValidationSeverity.Error, { file: 'a.ts', line: 5 }),
      ValidationResult.pass('rule-2', 'ok'),
    ];
    const engine = new DiagnosticEngine();
    engine.addFromResults(results, 'test-source');
    expect(engine.getErrors()).toHaveLength(1);
    expect(engine.getWarnings()).toHaveLength(0);
    expect(engine.getAll()).toHaveLength(1);
  });

  it('deduplicates identical diagnostics', () => {
    const engine = new DiagnosticEngine();
    const r = ValidationResult.fail('rule-1', 'same message', ValidationSeverity.Error, { file: 'a.ts', line: 3 });
    engine.addFromResults([r, r], 'src');
    engine.deduplicate();
    expect(engine.getAll()).toHaveLength(1);
  });

  it('toAnnotations returns human-readable string', () => {
    const engine = new DiagnosticEngine();
    engine.addFromResults(
      [ValidationResult.fail('r', 'oops', ValidationSeverity.Warning, { file: 'b.ts', line: 10 })],
      'src',
    );
    const ann = engine.toAnnotations();
    expect(ann).toContain('b.ts');
    expect(ann).toContain('oops');
  });

  it('getWarnings returns only warning-level diagnostics', () => {
    const engine = new DiagnosticEngine();
    engine.addFromResults([
      ValidationResult.fail('r1', 'error', ValidationSeverity.Error),
      ValidationResult.fail('r2', 'warn', ValidationSeverity.Warning),
    ], 'src');
    expect(engine.getWarnings()).toHaveLength(1);
    expect(engine.getWarnings()[0]!.severity).toBe(DiagnosticSeverity.Warning);
  });
});
