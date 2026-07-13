import type { IValidationRule } from './validators/ValidationRule.js';
import type { ValidationTargetKind } from './types.js';

/**
 * Central registry for IValidationRule instances.
 * Rules are keyed by id and looked up by ValidationTargetKind.
 */
export class ValidationRegistry {
  private readonly rules = new Map<string, IValidationRule>();

  register(rule: IValidationRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Validation rule '${rule.id}' is already registered.`);
    }
    this.rules.set(rule.id, rule);
  }

  getRule(id: string): IValidationRule | undefined {
    return this.rules.get(id);
  }

  getRules(kind: ValidationTargetKind): IValidationRule[] {
    return Array.from(this.rules.values()).filter(r => r.targetKinds.includes(kind));
  }

  getAllRules(): IValidationRule[] {
    return Array.from(this.rules.values());
  }
}
