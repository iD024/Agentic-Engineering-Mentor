/**
 * Shared types for the Engineering Validation Platform.
 * All validators, rubrics, diagnostics, and reports use these primitives.
 */

export enum ValidationTargetKind {
  Code = 'code',
  Architecture = 'architecture',
  Repository = 'repository',
  Dependency = 'dependency',
  Document = 'document',
  Milestone = 'milestone',
  CourseProgress = 'courseProgress',
  RepositoryChange = 'repositoryChange',
}

export enum ValidationSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export enum ValidationStatus {
  Pass = 'pass',
  Fail = 'fail',
  Skip = 'skip',
  Error = 'error',
}

export interface ValidationLocation {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

/** The subject of a validation run. */
export interface ValidationTarget {
  kind: ValidationTargetKind;
  /** Absolute path to the root being validated (file, dir, or repo root). */
  path: string;
  language?: string;
  /** Inline content (for small files or virtual submissions). */
  content?: string;
  metadata?: Record<string, unknown>;
}
