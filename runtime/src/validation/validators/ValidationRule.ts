import type { ValidationResult } from '../ValidationResult.js';
import type { ValidationTarget, ValidationTargetKind } from '../types.js';

/**
 * Contract that every validation rule must implement.
 * Rules are registered in the ValidationRegistry and executed by ValidationPipeline.
 */
export interface IValidationRule {
  /** Unique identifier (e.g. 'code/no-circular-imports'). */
  readonly id: string;
  readonly name: string;
  /** Which target kinds this rule applies to. */
  readonly targetKinds: ValidationTargetKind[];
  validate(target: ValidationTarget): Promise<ValidationResult[]>;
}
