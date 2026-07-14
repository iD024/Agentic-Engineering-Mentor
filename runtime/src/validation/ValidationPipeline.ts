import type { ValidationTarget } from './types.js';
import { ValidationStatus } from './types.js';
import type { ValidationResult } from './ValidationResult.js';
import type { ValidationRegistry } from './ValidationRegistry.js';

export interface PipelineRunResult {
  target: ValidationTarget;
  results: ValidationResult[];
  passCount: number;
  failCount: number;
  errorCount: number;
  skippedCount: number;
  /** True when failCount === 0 AND errorCount === 0. */
  passed: boolean;
  durationMs: number;
}

/**
 * Runs all registered IValidationRule implementations that match the target kind,
 * collecting results into a PipelineRunResult.
 * Deterministic — no LLM involvement.
 */
export class ValidationPipeline {
  constructor(private readonly registry: ValidationRegistry) {}

  async run(target: ValidationTarget, ruleIds?: string[]): Promise<PipelineRunResult> {
    const start = Date.now();

    let rules = this.registry.getRules(target.kind);
    if (ruleIds && ruleIds.length > 0) {
      rules = rules.filter(r => ruleIds.includes(r.id));
    }

    const allResults: ValidationResult[] = [];

    for (const rule of rules) {
      try {
        const ruleResults = await rule.validate(target);
        allResults.push(...ruleResults);
      } catch (err) {
        const { ValidationResult: VR } = await import('./ValidationResult.js');
        allResults.push(VR.error(rule.id, err instanceof Error ? err.message : String(err)));
      }
    }

    const passCount = allResults.filter(r => r.status === ValidationStatus.Pass).length;
    const failCount = allResults.filter(r => r.status === ValidationStatus.Fail).length;
    const errorCount = allResults.filter(r => r.status === ValidationStatus.Error).length;
    const skippedCount = allResults.filter(r => r.status === ValidationStatus.Skip).length;

    return {
      target,
      results: allResults,
      passCount,
      failCount,
      errorCount,
      skippedCount,
      passed: failCount === 0 && errorCount === 0,
      durationMs: Date.now() - start,
    };
  }
}
