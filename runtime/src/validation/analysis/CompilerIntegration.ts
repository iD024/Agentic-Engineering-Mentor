import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface CompilerResult {
  success: boolean;
  errorCount: number;
  warningCount: number;
  /** Raw compiler output lines. */
  output: string[];
  /** Parsed [file, line, message] tuples for errors. */
  errors: Array<{ file: string; line: number; message: string }>;
}

/**
 * Invokes the TypeScript compiler (tsc --noEmit) deterministically.
 * Returns a structured CompilerResult — no LLM.
 */
export class CompilerIntegration {
  compile(projectPath: string, tsconfigName = 'tsconfig.json'): CompilerResult {
    const configPath = join(projectPath, tsconfigName);
    if (!existsSync(configPath)) {
      return {
        success: false,
        errorCount: 1,
        warningCount: 0,
        output: [`tsconfig not found: ${configPath}`],
        errors: [{ file: configPath, line: 0, message: 'tsconfig.json not found' }],
      };
    }

    let rawOutput = '';
    let exitCode = 0;
    try {
      rawOutput = execSync(`npx tsc --noEmit -p "${configPath}" 2>&1`, {
        cwd: projectPath,
        encoding: 'utf8',
        timeout: 60_000,
      });
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string; status?: number };
      rawOutput = (execErr.stdout ?? '') + (execErr.stderr ?? '');
      exitCode = execErr.status ?? 1;
    }

    const lines = rawOutput.split('\n').filter(Boolean);
    const errors: Array<{ file: string; line: number; message: string }> = [];

    for (const line of lines) {
      // Match: path/to/file.ts(line,col): error TSxxxx: message
      const m = line.match(/^(.+?)\((\d+),\d+\): error TS\d+: (.+)$/);
      if (m) {
        errors.push({ file: m[1]!, line: parseInt(m[2]!, 10), message: m[3]! });
      }
    }

    return {
      success: exitCode === 0,
      errorCount: errors.length,
      warningCount: 0,
      output: lines,
      errors,
    };
  }
}
