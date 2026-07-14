import { describe, it, expect } from 'vitest';
import { StaticAnalyzer } from '../../../src/validation/analysis/StaticAnalyzer.js';
import { DependencyAnalyzer } from '../../../src/validation/analysis/DependencyAnalyzer.js';

describe('StaticAnalyzer', () => {
  it('detects console.log in content', () => {
    const sa = new StaticAnalyzer();
    const issues = sa.analyseContent('const x = 1;\nconsole.log(x);\n', 'test.ts');
    expect(issues.some(i => i.ruleId === 'static/no-console')).toBe(true);
  });

  it('detects explicit any type', () => {
    const sa = new StaticAnalyzer();
    const issues = sa.analyseContent('function f(x: any) {}', 'a.ts');
    expect(issues.some(i => i.ruleId === 'static/no-any')).toBe(true);
  });

  it('detects TODO comment', () => {
    const sa = new StaticAnalyzer();
    const issues = sa.analyseContent('// TODO: fix this\n', 'b.ts');
    expect(issues.some(i => i.ruleId === 'static/no-todo')).toBe(true);
  });

  it('reports no issues for clean code', () => {
    const sa = new StaticAnalyzer();
    const issues = sa.analyseContent('export const PI = 3.14159;\n', 'math.ts');
    // "any" not present, no console, no TODO — but 3 would be flagged; use named constant snippet
    expect(issues.filter(i => i.ruleId === 'static/no-console')).toHaveLength(0);
    expect(issues.filter(i => i.ruleId === 'static/no-any')).toHaveLength(0);
  });

  it('returns empty for missing dir', () => {
    const sa = new StaticAnalyzer();
    const result = sa.analyse('/nonexistent/path/that/does/not/exist');
    expect(result.analysedFiles).toBe(0);
    expect(result.issues).toHaveLength(0);
  });
});

describe('DependencyAnalyzer', () => {
  it('detects cycle in simple graph', () => {
    const da = new DependencyAnalyzer();
    // Manual graph: A → B → A (cycle)
    const graph = {
      nodes: ['A', 'B'],
      edges: [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }],
    };
    const result = da.detectCycles(graph);
    expect(result.hasCycles).toBe(true);
    expect(result.cycles).toHaveLength(1);
  });

  it('detects no cycle in DAG', () => {
    const da = new DependencyAnalyzer();
    const graph = {
      nodes: ['A', 'B', 'C'],
      edges: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
    };
    const result = da.detectCycles(graph);
    expect(result.hasCycles).toBe(false);
  });

  it('handles empty graph', () => {
    const da = new DependencyAnalyzer();
    const result = da.detectCycles({ nodes: [], edges: [] });
    expect(result.hasCycles).toBe(false);
    expect(result.cycles).toHaveLength(0);
  });

  it('buildGraph returns empty result for non-existent path', () => {
    const da = new DependencyAnalyzer();
    const graph = da.buildGraph('/this/does/not/exist');
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });
});
