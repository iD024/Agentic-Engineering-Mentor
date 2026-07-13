import type { IValidationRule } from './ValidationRule.js';
import type { ValidationTarget } from '../types.js';
import { ValidationTargetKind } from '../types.js';
import { ValidationResult, ValidationSeverity } from '../ValidationResult.js';
import { StaticAnalyzer } from '../analysis/StaticAnalyzer.js';
import { CompilerIntegration } from '../analysis/CompilerIntegration.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Validates that TypeScript code compiles cleanly (tsc --noEmit).
 */
export class CodeCompilerValidator implements IValidationRule {
  readonly id = 'code/compiler-clean';
  readonly name = 'Compiler: no errors';
  readonly targetKinds = [ValidationTargetKind.Code];
  private readonly compiler = new CompilerIntegration();

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    const result = this.compiler.compile(target.path);
    if (result.success) {
      return [ValidationResult.pass(this.id, 'Code compiles without errors')];
    }
    return result.errors.map(e =>
      ValidationResult.fail(this.id, e.message, ValidationSeverity.Error, { file: e.file, line: e.line }),
    );
  }
}

/**
 * Validates that code passes static analysis rules (no-console, no-any, etc.).
 */
export class CodeStaticAnalysisValidator implements IValidationRule {
  readonly id = 'code/static-clean';
  readonly name = 'Static Analysis: clean';
  readonly targetKinds = [ValidationTargetKind.Code];
  private readonly analyser = new StaticAnalyzer();

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    if (target.content) {
      const issues = this.analyser.analyseContent(target.content, target.path);
      if (issues.length === 0) {
        results.push(ValidationResult.pass(this.id, 'No static analysis issues found'));
      } else {
        for (const issue of issues) {
          const severity = issue.severity === 'error' ? ValidationSeverity.Error : ValidationSeverity.Warning;
          results.push(ValidationResult.fail(this.id, issue.message, severity, { file: issue.file, line: issue.line, column: issue.column }));
        }
      }
      return results;
    }

    const analysis = this.analyser.analyse(target.path);
    const errors = analysis.issues.filter(i => i.severity === 'error');
    if (errors.length === 0) {
      results.push(ValidationResult.pass(this.id, `Static analysis: ${analysis.warningCount} warnings, 0 errors`));
    } else {
      for (const issue of errors) {
        results.push(ValidationResult.fail(this.id, issue.message, ValidationSeverity.Error, { file: issue.file, line: issue.line }));
      }
    }
    return results;
  }
}

/**
 * Validates repository folder structure against a required set of paths.
 */
export class RepositoryStructureValidator implements IValidationRule {
  readonly id = 'repository/structure';
  readonly name = 'Repository Structure';
  readonly targetKinds = [ValidationTargetKind.Repository];

  constructor(private readonly requiredPaths: string[]) {}

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    for (const rel of this.requiredPaths) {
      const full = join(target.path, rel);
      if (existsSync(full)) {
        results.push(ValidationResult.pass(this.id, `Required path exists: ${rel}`));
      } else {
        results.push(ValidationResult.fail(this.id, `Missing required path: ${rel}`, ValidationSeverity.Error, { file: full }));
      }
    }
    return results;
  }
}

/**
 * Validates a course milestone by checking all required artifact files exist.
 */
export class MilestoneValidator implements IValidationRule {
  readonly id = 'milestone/artifacts';
  readonly name = 'Milestone Artifacts';
  readonly targetKinds = [ValidationTargetKind.Milestone];

  constructor(private readonly requiredArtifacts: string[]) {}

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    for (const artifact of this.requiredArtifacts) {
      const full = join(target.path, artifact);
      if (existsSync(full)) {
        results.push(ValidationResult.pass(this.id, `Artifact present: ${artifact}`));
      } else {
        results.push(ValidationResult.fail(this.id, `Missing milestone artifact: ${artifact}`, ValidationSeverity.Error, { file: full }));
      }
    }
    return results;
  }
}

/**
 * Validates course progress using a simple percentage threshold.
 */
export class CourseProgressValidator implements IValidationRule {
  readonly id = 'course/progress';
  readonly name = 'Course Progress';
  readonly targetKinds = [ValidationTargetKind.CourseProgress];

  constructor(private readonly requiredPercentage: number) {}

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    const meta = target.metadata as { completedModules?: number; totalModules?: number } | undefined;
    if (!meta?.totalModules || meta.totalModules === 0) {
      return [ValidationResult.skip(this.id, 'No course progress metadata available')];
    }
    const pct = Math.round(((meta.completedModules ?? 0) / meta.totalModules) * 100);
    if (pct >= this.requiredPercentage) {
      return [ValidationResult.pass(this.id, `Course ${pct}% complete (required: ${this.requiredPercentage}%)`)];
    }
    return [ValidationResult.fail(this.id, `Course ${pct}% complete — need ${this.requiredPercentage}%`, ValidationSeverity.Warning)];
  }
}

/**
 * Validates that required files exist in a repository change set.
 */
export class ChangeValidator implements IValidationRule {
  readonly id = 'change/required-files';
  readonly name = 'Change Set: required files';
  readonly targetKinds = [ValidationTargetKind.RepositoryChange];

  constructor(private readonly requiredChangedFiles: string[]) {}

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    const meta = target.metadata as { changedFiles?: string[] } | undefined;
    const changed = new Set(meta?.changedFiles ?? []);
    const results: ValidationResult[] = [];
    for (const req of this.requiredChangedFiles) {
      if (changed.has(req)) {
        results.push(ValidationResult.pass(this.id, `Required change present: ${req}`));
      } else {
        results.push(ValidationResult.fail(this.id, `Expected change not found: ${req}`, ValidationSeverity.Error));
      }
    }
    return results;
  }
}

/**
 * Validates engineering documents (Markdown) for required section headings.
 */
export class DocumentValidator implements IValidationRule {
  readonly id = 'document/required-sections';
  readonly name = 'Document: required sections';
  readonly targetKinds = [ValidationTargetKind.Document];

  constructor(private readonly requiredSections: string[]) {}

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    let content = target.content ?? '';
    if (!content && target.path && existsSync(target.path)) {
      content = readFileSync(target.path, 'utf8');
    }
    const results: ValidationResult[] = [];
    for (const section of this.requiredSections) {
      if (content.includes(section)) {
        results.push(ValidationResult.pass(this.id, `Section found: "${section}"`));
      } else {
        results.push(ValidationResult.fail(this.id, `Missing required section: "${section}"`, ValidationSeverity.Error));
      }
    }
    return results;
  }
}

/**
 * Validates architectural layering rules.
 * Each rule defines: source layer may NOT import from target layer.
 */
export class ArchitectureValidator implements IValidationRule {
  readonly id = 'architecture/layering';
  readonly name = 'Architecture: layer rules';
  readonly targetKinds = [ValidationTargetKind.Architecture];

  constructor(
    private readonly forbidden: Array<{ fromLayer: string; toLayer: string; reason: string }>,
  ) {}

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    const meta = target.metadata as {
      imports?: Array<{ from: string; to: string; fromLayer?: string; toLayer?: string }>;
    } | undefined;

    if (!meta?.imports) {
      return [ValidationResult.skip(this.id, 'No import metadata provided')];
    }

    const results: ValidationResult[] = [];
    for (const imp of meta.imports) {
      const violation = this.forbidden.find(
        f => imp.fromLayer === f.fromLayer && imp.toLayer === f.toLayer,
      );
      if (violation) {
        results.push(
          ValidationResult.fail(
            this.id,
            `Layer violation: ${imp.from} (${imp.fromLayer}) → ${imp.to} (${imp.toLayer}): ${violation.reason}`,
            ValidationSeverity.Error,
            { file: imp.from },
          ),
        );
      } else {
        results.push(ValidationResult.pass(this.id, `Import OK: ${imp.from} → ${imp.to}`));
      }
    }
    return results;
  }
}

/**
 * Validates that imports satisfy allowed/forbidden dependency rules.
 */
export class DependencyRuleValidator implements IValidationRule {
  readonly id = 'dependency/rules';
  readonly name = 'Dependency Rules';
  readonly targetKinds = [ValidationTargetKind.Dependency];

  constructor(
    private readonly allowedModules?: string[],
    private readonly forbiddenModules?: string[],
  ) {}

  async validate(target: ValidationTarget): Promise<ValidationResult[]> {
    const meta = target.metadata as { usedModules?: string[] } | undefined;
    const used = meta?.usedModules ?? [];
    const results: ValidationResult[] = [];

    for (const mod of used) {
      if (this.forbiddenModules?.includes(mod)) {
        results.push(ValidationResult.fail(this.id, `Forbidden dependency: ${mod}`, ValidationSeverity.Error));
      } else if (this.allowedModules && !this.allowedModules.includes(mod)) {
        results.push(ValidationResult.fail(this.id, `Unlisted dependency: ${mod}`, ValidationSeverity.Warning));
      } else {
        results.push(ValidationResult.pass(this.id, `Allowed dependency: ${mod}`));
      }
    }
    if (results.length === 0) {
      results.push(ValidationResult.skip(this.id, 'No module usage metadata provided'));
    }
    return results;
  }
}
