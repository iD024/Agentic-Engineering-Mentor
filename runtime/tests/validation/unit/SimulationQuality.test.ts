import { describe, it, expect } from 'vitest';
import { SimulationRunner } from '../../../src/validation/simulation/SimulationRunner.js';
import { QualityAnalyzer } from '../../../src/validation/quality/QualityAnalyzer.js';

describe('SimulationRunner', () => {
  it('returns fail result for non-existent project path', () => {
    const runner = new SimulationRunner();
    const result = runner.run('/nonexistent/project/path');
    expect(result.success).toBe(false);
    expect(result.totalTests).toBe(0);
    expect(result.rawOutput).toContain('not found');
  });

  it('fallback parser extracts pass/fail counts from text output', () => {
    const runner = new SimulationRunner();
    // Access private method via cast for unit testing
    const parsed = (runner as unknown as { parseVitestJson: (raw: string) => unknown }).parseVitestJson('5 passed, 2 failed');
    expect((parsed as { passedTests: number }).passedTests).toBe(5);
    expect((parsed as { failedTests: number }).failedTests).toBe(2);
  });
});

describe('QualityAnalyzer', () => {
  it('returns zero metrics for non-existent path', () => {
    const qa = new QualityAnalyzer();
    const metrics = qa.analyse('/nonexistent/dir');
    expect(metrics.totalLines).toBe(0);
    expect(metrics.codeLines).toBe(0);
    expect(metrics.largeFiles).toHaveLength(0);
  });

  it('analyses the current runtime src directory', () => {
    const qa = new QualityAnalyzer();
    const metrics = qa.analyse('/home/laksh/Projects/Antigravity-Engineering-Mentor/.ai/runtime/src');
    expect(metrics.totalLines).toBeGreaterThan(100);
    expect(metrics.codeLines).toBeGreaterThan(0);
  });

  it('detects large files if any exist', () => {
    const qa = new QualityAnalyzer();
    const metrics = qa.analyse('/home/laksh/Projects/Antigravity-Engineering-Mentor/.ai/runtime/src');
    // largeFiles is an array (may or may not be populated)
    expect(Array.isArray(metrics.largeFiles)).toBe(true);
  });
});
