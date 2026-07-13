import type { ValidationLocation } from '../types.js';

export enum DiagnosticSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface Diagnostic {
  /** Stable SHA1 hash key for deduplication. */
  id: string;
  ruleId: string;
  severity: DiagnosticSeverity;
  message: string;
  location?: ValidationLocation;
  /** Suggested automated fix text. */
  fix?: string;
  /** Which validator/tool produced this diagnostic. */
  source: string;
}
