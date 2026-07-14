import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export interface TestCase {
  name: string;
  passed: boolean;
  durationMs: number;
  errorMessage?: string;
}

export interface SimulationResult {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testCases: TestCase[];
  rawOutput: string;
  durationMs: number;
}

/**
 * Runs unit tests for a given project via its configured test runner (vitest/jest/mocha).
 * Deterministic — captures stdout/stderr, parses counts, returns structured result.
 */
export class SimulationRunner {
  run(projectPath: string, testCommand = 'npx vitest run --reporter=json'): SimulationResult {
    if (!existsSync(projectPath)) {
      return this.failResult(`Project path not found: ${projectPath}`);
    }

    const start = Date.now();
    let rawOutput = '';
    let success = false;

    try {
      rawOutput = execSync(testCommand, {
        cwd: projectPath,
        encoding: 'utf8',
        timeout: 120_000,
      });
      success = true;
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string };
      rawOutput = (execErr.stdout ?? '') + (execErr.stderr ?? '');
    }

    const durationMs = Date.now() - start;
    const parsed = this.parseVitestJson(rawOutput);

    return {
      success: success && parsed.failedTests === 0,
      ...parsed,
      rawOutput,
      durationMs,
    };
  }

  private parseVitestJson(raw: string): Pick<SimulationResult, 'totalTests' | 'passedTests' | 'failedTests' | 'testCases'> {
    try {
      // Vitest JSON reporter output
      const json = JSON.parse(raw) as {
        numTotalTests?: number;
        numPassedTests?: number;
        numFailedTests?: number;
        testResults?: Array<{
          assertionResults?: Array<{
            title: string;
            status: string;
            duration?: number;
            failureMessages?: string[];
          }>;
        }>;
      };

      const testCases: TestCase[] = [];
      for (const suite of json.testResults ?? []) {
        for (const t of suite.assertionResults ?? []) {
          testCases.push({
            name: t.title,
            passed: t.status === 'passed',
            durationMs: t.duration ?? 0,
            errorMessage: t.failureMessages?.[0],
          });
        }
      }

      return {
        totalTests: json.numTotalTests ?? testCases.length,
        passedTests: json.numPassedTests ?? testCases.filter(t => t.passed).length,
        failedTests: json.numFailedTests ?? testCases.filter(t => !t.passed).length,
        testCases,
      };
    } catch {
      // Fall back to regex parsing for non-JSON output
      const passMatch = raw.match(/(\d+)\s+passed/);
      const failMatch = raw.match(/(\d+)\s+failed/);
      const passed = parseInt(passMatch?.[1] ?? '0', 10);
      const failed = parseInt(failMatch?.[1] ?? '0', 10);
      return { totalTests: passed + failed, passedTests: passed, failedTests: failed, testCases: [] };
    }
  }

  private failResult(message: string): SimulationResult {
    return {
      success: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testCases: [],
      rawOutput: message,
      durationMs: 0,
    };
  }
}
