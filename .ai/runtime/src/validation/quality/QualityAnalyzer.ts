import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

export interface QualityMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  averageFunctionLength: number;
  /** Halstead-inspired complexity proxy: unique operators + operands per file. */
  averageComplexity: number;
  /** Files with more than MAX_LINES lines. */
  largeFiles: Array<{ file: string; lines: number }>;
  /** Functions with more than MAX_FN_LINES lines. */
  longFunctions: Array<{ file: string; name: string; lines: number }>;
}

const MAX_FILE_LINES = 300;
const MAX_FN_LINES = 50;

/**
 * Deterministic code quality metrics analyser.
 * Counts LOC, detects oversized files/functions, estimates complexity.
 */
export class QualityAnalyzer {
  analyse(rootPath: string): QualityMetrics {
    const files = this.collectFiles(rootPath);
    const metrics: QualityMetrics = {
      totalLines: 0,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      averageFunctionLength: 0,
      averageComplexity: 0,
      largeFiles: [],
      longFunctions: [],
    };

    let totalFnLengths = 0;
    let totalFnCount = 0;
    let totalComplexity = 0;

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        metrics.totalLines += lines.length;
        if (lines.length > MAX_FILE_LINES) {
          metrics.largeFiles.push({ file: resolve(file), lines: lines.length });
        }

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) metrics.blankLines++;
          else if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) metrics.commentLines++;
          else metrics.codeLines++;
        }

        // Function detection (simple heuristic)
        const fnMatches = [...content.matchAll(/(?:function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\()/g)];
        for (const match of fnMatches) {
          const fnName = match[1] ?? match[2] ?? 'anonymous';
          const startLine = content.slice(0, match.index ?? 0).split('\n').length;
          // Estimate function length by counting lines until the matching brace
          const fnContent = content.slice(match.index ?? 0);
          const fnLines = this.estimateFunctionLines(fnContent);
          totalFnLengths += fnLines;
          totalFnCount++;
          if (fnLines > MAX_FN_LINES) {
            metrics.longFunctions.push({ file: resolve(file), name: fnName, lines: fnLines });
          }
        }

        // Complexity proxy: count branching keywords
        const branchCount = (content.match(/\b(?:if|else|for|while|switch|catch|&&|\|\||\?)/g) ?? []).length;
        totalComplexity += branchCount;
      } catch {
        // skip unreadable
      }
    }

    metrics.averageFunctionLength = totalFnCount > 0 ? Math.round(totalFnLengths / totalFnCount) : 0;
    metrics.averageComplexity = files.length > 0 ? Math.round(totalComplexity / files.length) : 0;
    return metrics;
  }

  private estimateFunctionLines(content: string): number {
    let depth = 0;
    let started = false;
    let lineCount = 0;
    for (const line of content.split('\n')) {
      lineCount++;
      for (const ch of line) {
        if (ch === '{') { depth++; started = true; }
        else if (ch === '}') {
          depth--;
          if (started && depth <= 0) return lineCount;
        }
      }
      if (lineCount > 200) break; // guard
    }
    return lineCount;
  }

  private collectFiles(dir: string): string[] {
    if (!existsSync(dir)) return [];
    const results: string[] = [];
    const IGNORED = new Set(['node_modules', '.git', 'dist', 'build']);
    const EXTS = new Set(['.ts', '.js']);
    function walk(d: string) {
      for (const entry of readdirSync(d)) {
        if (IGNORED.has(entry)) continue;
        const full = join(d, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (EXTS.has(extname(entry))) results.push(full);
      }
    }
    walk(dir);
    return results;
  }
}
