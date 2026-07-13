import type { ValidationResult } from '../ValidationResult.js';
import { ValidationStatus, ValidationSeverity } from '../types.js';
import type { Diagnostic } from './Diagnostic.js';
import { DiagnosticSeverity } from './Diagnostic.js';
import { createHash } from 'node:crypto';

function severityMap(s: ValidationSeverity): DiagnosticSeverity {
  switch (s) {
    case ValidationSeverity.Error:
      return DiagnosticSeverity.Error;
    case ValidationSeverity.Warning:
      return DiagnosticSeverity.Warning;
    default:
      return DiagnosticSeverity.Info;
  }
}

function makeId(ruleId: string, message: string, file: string, line: string): string {
  const key = `${ruleId}:${message}:${file}:${line}`;
  return createHash('sha1').update(key).digest('hex').slice(0, 12);
}

/**
 * Collects, deduplicates, and annotates Diagnostics produced by ValidationResults.
 * LLMs may read toAnnotations() output — they do not produce it.
 */
export class DiagnosticEngine {
  private diagnostics: Diagnostic[] = [];

  addFromResults(results: ValidationResult[], source: string): void {
    for (const r of results) {
      if (r.status !== ValidationStatus.Fail && r.status !== ValidationStatus.Error) continue;
      const partial = {
        ruleId: r.ruleId,
        severity: severityMap(r.severity),
        message: r.message,
        location: r.location,
        fix: r.fix,
        source,
      };
      const id = makeId(
        partial.ruleId,
        partial.message,
        partial.location?.file ?? '',
        String(partial.location?.line ?? ''),
      );
      this.diagnostics.push({ id, ...partial });
    }
  }

  add(diagnostic: Diagnostic): void {
    this.diagnostics.push(diagnostic);
  }

  getErrors(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Error);
  }

  getWarnings(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Warning);
  }

  getAll(): Diagnostic[] {
    return [...this.diagnostics];
  }

  deduplicate(): void {
    const seen = new Set<string>();
    this.diagnostics = this.diagnostics.filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }

  toAnnotations(): string {
    return this.diagnostics
      .map(d => {
        const loc = d.location ? `${d.location.file}:${d.location.line ?? '?'}` : 'unknown';
        return `[${d.severity.toUpperCase()}] ${loc} — ${d.message} (${d.ruleId})`;
      })
      .join('\n');
  }
}
