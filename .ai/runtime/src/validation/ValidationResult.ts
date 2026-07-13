import { ValidationStatus, ValidationSeverity } from './types.js';
import type { ValidationLocation } from './types.js';

export { ValidationStatus, ValidationSeverity } from './types.js';

export interface ValidationResultData {
  ruleId: string;
  status: ValidationStatus;
  severity: ValidationSeverity;
  message: string;
  location?: ValidationLocation;
  /** Suggested automated fix text. */
  fix?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Immutable value object representing the outcome of a single validation rule.
 * Use static factories (pass / fail / skip / error) to construct.
 */
export class ValidationResult implements ValidationResultData {
  readonly ruleId: string;
  readonly status: ValidationStatus;
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly location?: ValidationLocation;
  readonly fix?: string;
  readonly metadata?: Record<string, unknown>;

  private constructor(data: ValidationResultData) {
    this.ruleId = data.ruleId;
    this.status = data.status;
    this.severity = data.severity;
    this.message = data.message;
    this.location = data.location;
    this.fix = data.fix;
    this.metadata = data.metadata;
  }

  static pass(ruleId: string, message: string, metadata?: Record<string, unknown>): ValidationResult {
    return new ValidationResult({
      ruleId,
      status: ValidationStatus.Pass,
      severity: ValidationSeverity.Info,
      message,
      metadata,
    });
  }

  static fail(
    ruleId: string,
    message: string,
    severity: ValidationSeverity = ValidationSeverity.Error,
    location?: ValidationLocation,
    fix?: string,
    metadata?: Record<string, unknown>,
  ): ValidationResult {
    return new ValidationResult({ ruleId, status: ValidationStatus.Fail, severity, message, location, fix, metadata });
  }

  static skip(ruleId: string, message: string): ValidationResult {
    return new ValidationResult({
      ruleId,
      status: ValidationStatus.Skip,
      severity: ValidationSeverity.Info,
      message,
    });
  }

  static error(ruleId: string, message: string): ValidationResult {
    return new ValidationResult({
      ruleId,
      status: ValidationStatus.Error,
      severity: ValidationSeverity.Error,
      message,
    });
  }

  get isPassed(): boolean {
    return this.status === ValidationStatus.Pass;
  }

  get isFailed(): boolean {
    return this.status === ValidationStatus.Fail;
  }
}
