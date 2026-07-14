import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

export interface StaticAnalysisIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  ruleId: string;
  message: string;
}

export interface StaticAnalysisResult {
  analysedFiles: number;
  issues: StaticAnalysisIssue[];
  errorCount: number;
  warningCount: number;
}

/** Deterministic static analysis rules applied per line. */
const RULES: Array<{
  id: string;
  severity: 'error' | 'warning' | 'info';
  pattern: RegExp;
  message: (m: RegExpMatchArray) => string;
}> = [
  {
    id: 'static/no-console',
    severity: 'warning',
    pattern: /\bconsole\.(log|warn|error|debug)\b/,
    message: () => 'Unexpected console statement',
  },
  {
    id: 'static/no-any',
    severity: 'warning',
    pattern: /:\s*any\b/,
    message: () => 'Avoid explicit `any` type',
  },
  {
    id: 'static/no-todo',
    severity: 'info',
    pattern: /\bTODO\b|\bFIXME\b|\bHACK\b/,
    message: () => 'TODO/FIXME/HACK comment found',
  },
  {
    id: 'static/no-magic-numbers',
    severity: 'info',
    pattern: /(?<!['\".#\w])\b(?!0\b|1\b|2\b|100\b)\d{2,}\b/,
    message: m => `Magic number ${m[0]} — consider a named constant`,
  },
];

/**
 * Deterministic line-by-line static analyser for TypeScript/JavaScript.
 * No external tooling — operates on raw source text.
 */
export class StaticAnalyzer {
  analyse(rootPath: string, extensions = ['.ts', '.js']): StaticAnalysisResult {
    const files = this.collectFiles(rootPath, extensions);
    const issues: StaticAnalysisIssue[] = [];

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          for (const rule of RULES) {
            const m = line.match(rule.pattern);
            if (m) {
              issues.push({
                file,
                line: i + 1,
                column: (m.index ?? 0) + 1,
                severity: rule.severity,
                ruleId: rule.id,
                message: rule.message(m),
              });
            }
          }
        }
      } catch {
        // Unreadable files are silently skipped
      }
    }

    return {
      analysedFiles: files.length,
      issues,
      errorCount: issues.filter(i => i.severity === 'error').length,
      warningCount: issues.filter(i => i.severity === 'warning').length,
    };
  }

  analyseContent(content: string, filePath: string): StaticAnalysisIssue[] {
    const issues: StaticAnalysisIssue[] = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      for (const rule of RULES) {
        const m = line.match(rule.pattern);
        if (m) {
          issues.push({
            file: filePath,
            line: i + 1,
            column: (m.index ?? 0) + 1,
            severity: rule.severity,
            ruleId: rule.id,
            message: rule.message(m),
          });
        }
      }
    }
    return issues;
  }

  private collectFiles(dir: string, exts: string[]): string[] {
    if (!existsSync(dir)) return [];
    const results: string[] = [];
    const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', '.next']);

    function walk(current: string) {
      for (const entry of readdirSync(current)) {
        if (IGNORED.has(entry)) continue;
        const full = join(current, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (exts.includes(extname(entry))) {
          results.push(full);
        }
      }
    }
    walk(dir);
    return results;
  }
}
