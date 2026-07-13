import type { GradeReport } from '../grading/GradeReport.js';
import type { Diagnostic } from '../diagnostics/Diagnostic.js';
import type { ValidationReport } from './ValidationReport.js';
import { randomUUID } from 'node:crypto';

/**
 * Generates the final ValidationReport containing grade, diagnostics, and markdown summary.
 */
export class ReportGenerator {
  generate(grade: GradeReport, diagnostics: Diagnostic[]): ValidationReport {
    const markdown = this.buildMarkdown(grade, diagnostics);
    return {
      id: randomUUID(),
      gradeReport: grade,
      diagnostics,
      markdownSummary: markdown,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildMarkdown(grade: GradeReport, diagnostics: Diagnostic[]): string {
    const lines = [
      `# Validation Report for ${grade.submissionId}`,
      '',
      `**Grade:** ${grade.letter} (${grade.rubricScore.percentage}%)`,
      `**Rubric:** ${grade.rubricId}`,
      `**Date:** ${new Date(grade.timestamp).toLocaleString()}`,
      '',
      '## Feedback',
      ...grade.feedbackPoints.map(f => `- ${f}`),
      '',
    ];

    if (diagnostics.length > 0) {
      lines.push('## Diagnostics');
      for (const d of diagnostics) {
        const severity = d.severity === 'error' ? '❌ ERROR' : d.severity === 'warning' ? '⚠️ WARNING' : 'ℹ️ INFO';
        const loc = d.location ? `${d.location.file}:${d.location.line ?? '?'}` : 'Global';
        lines.push(`- **${severity}** [${loc}] ${d.message} (${d.ruleId})`);
        if (d.fix) {
          lines.push(`  - *Fix:* \`${d.fix}\``);
        }
      }
    } else {
      lines.push('## Diagnostics', 'No issues found.');
    }

    return lines.join('\n');
  }
}
