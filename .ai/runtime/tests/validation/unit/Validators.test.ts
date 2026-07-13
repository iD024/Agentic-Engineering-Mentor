import { describe, it, expect } from 'vitest';
import {
  RepositoryStructureValidator,
  MilestoneValidator,
  CourseProgressValidator,
  ChangeValidator,
  DocumentValidator,
  ArchitectureValidator,
  DependencyRuleValidator,
  CodeStaticAnalysisValidator,
} from '../../../src/validation/validators/index.js';
import { ValidationStatus, ValidationSeverity } from '../../../src/validation/ValidationResult.js';
import { ValidationTargetKind } from '../../../src/validation/types.js';

describe('RepositoryStructureValidator', () => {
  it('passes when required path exists', async () => {
    const v = new RepositoryStructureValidator(['src']);
    const results = await v.validate({ kind: ValidationTargetKind.Repository, path: '/home/laksh/Projects/Antigravity-Engineering-Mentor/.ai/runtime' });
    expect(results.some(r => r.isPassed)).toBe(true);
  });

  it('fails when required path missing', async () => {
    const v = new RepositoryStructureValidator(['nonexistent-dir-xyz']);
    const results = await v.validate({ kind: ValidationTargetKind.Repository, path: '/home/laksh/Projects/Antigravity-Engineering-Mentor/.ai/runtime' });
    expect(results.some(r => r.isFailed)).toBe(true);
  });
});

describe('MilestoneValidator', () => {
  it('passes when artifact exists', async () => {
    const v = new MilestoneValidator(['src/validation/types.ts']);
    const results = await v.validate({ kind: ValidationTargetKind.Milestone, path: '/home/laksh/Projects/Antigravity-Engineering-Mentor/.ai/runtime' });
    expect(results[0]!.isPassed).toBe(true);
  });

  it('fails when artifact missing', async () => {
    const v = new MilestoneValidator(['nonexistent.ts']);
    const results = await v.validate({ kind: ValidationTargetKind.Milestone, path: '/home/laksh/Projects/Antigravity-Engineering-Mentor/.ai/runtime' });
    expect(results[0]!.isFailed).toBe(true);
  });
});

describe('CourseProgressValidator', () => {
  it('passes when at threshold', async () => {
    const v = new CourseProgressValidator(80);
    const results = await v.validate({
      kind: ValidationTargetKind.CourseProgress,
      path: '/fake',
      metadata: { completedModules: 8, totalModules: 10 },
    });
    expect(results[0]!.isPassed).toBe(true);
  });

  it('fails when below threshold', async () => {
    const v = new CourseProgressValidator(80);
    const results = await v.validate({
      kind: ValidationTargetKind.CourseProgress,
      path: '/fake',
      metadata: { completedModules: 5, totalModules: 10 },
    });
    expect(results[0]!.isFailed).toBe(true);
  });

  it('skips with no metadata', async () => {
    const v = new CourseProgressValidator(80);
    const results = await v.validate({ kind: ValidationTargetKind.CourseProgress, path: '/fake' });
    expect(results[0]!.status).toBe(ValidationStatus.Skip);
  });
});

describe('ChangeValidator', () => {
  it('passes when required file changed', async () => {
    const v = new ChangeValidator(['src/main.ts']);
    const results = await v.validate({
      kind: ValidationTargetKind.RepositoryChange,
      path: '/fake',
      metadata: { changedFiles: ['src/main.ts', 'README.md'] },
    });
    expect(results[0]!.isPassed).toBe(true);
  });

  it('fails when required file not changed', async () => {
    const v = new ChangeValidator(['src/main.ts']);
    const results = await v.validate({
      kind: ValidationTargetKind.RepositoryChange,
      path: '/fake',
      metadata: { changedFiles: ['README.md'] },
    });
    expect(results[0]!.isFailed).toBe(true);
  });
});

describe('DocumentValidator', () => {
  it('passes when section present in content', async () => {
    const v = new DocumentValidator(['## Requirements']);
    const results = await v.validate({
      kind: ValidationTargetKind.Document,
      path: '/fake',
      content: '# Doc\n\n## Requirements\n\nSome content.',
    });
    expect(results[0]!.isPassed).toBe(true);
  });

  it('fails when section missing', async () => {
    const v = new DocumentValidator(['## Requirements']);
    const results = await v.validate({
      kind: ValidationTargetKind.Document,
      path: '/fake',
      content: '# Doc\nNo requirements here.',
    });
    expect(results[0]!.isFailed).toBe(true);
  });
});

describe('ArchitectureValidator', () => {
  it('skips when no import metadata', async () => {
    const v = new ArchitectureValidator([{ fromLayer: 'data', toLayer: 'presentation', reason: 'forbidden' }]);
    const results = await v.validate({ kind: ValidationTargetKind.Architecture, path: '/fake' });
    expect(results[0]!.status).toBe(ValidationStatus.Skip);
  });

  it('fails on layer violation', async () => {
    const v = new ArchitectureValidator([{ fromLayer: 'data', toLayer: 'presentation', reason: 'no downward deps' }]);
    const results = await v.validate({
      kind: ValidationTargetKind.Architecture,
      path: '/fake',
      metadata: {
        imports: [{ from: 'data/repo.ts', to: 'ui/View.tsx', fromLayer: 'data', toLayer: 'presentation' }],
      },
    });
    expect(results[0]!.isFailed).toBe(true);
    expect(results[0]!.message).toContain('Layer violation');
  });
});

describe('DependencyRuleValidator', () => {
  it('fails for forbidden module', async () => {
    const v = new DependencyRuleValidator(undefined, ['eval-module']);
    const results = await v.validate({
      kind: ValidationTargetKind.Dependency,
      path: '/fake',
      metadata: { usedModules: ['eval-module'] },
    });
    expect(results[0]!.isFailed).toBe(true);
    expect(results[0]!.severity).toBe(ValidationSeverity.Error);
  });

  it('passes for allowed module', async () => {
    const v = new DependencyRuleValidator(['fs', 'path'], []);
    const results = await v.validate({
      kind: ValidationTargetKind.Dependency,
      path: '/fake',
      metadata: { usedModules: ['fs', 'path'] },
    });
    expect(results.every(r => r.isPassed)).toBe(true);
  });

  it('skips when no metadata provided', async () => {
    const v = new DependencyRuleValidator();
    const results = await v.validate({ kind: ValidationTargetKind.Dependency, path: '/fake' });
    expect(results[0]!.status).toBe(ValidationStatus.Skip);
  });
});

describe('CodeStaticAnalysisValidator', () => {
  it('passes for clean code content', async () => {
    const v = new CodeStaticAnalysisValidator();
    const results = await v.validate({
      kind: ValidationTargetKind.Code,
      path: 'clean.ts',
      content: 'export const PI = Math.PI;\n',
    });
    expect(results.some(r => r.isPassed)).toBe(true);
  });

  it('warns for console.log in content', async () => {
    const v = new CodeStaticAnalysisValidator();
    const results = await v.validate({
      kind: ValidationTargetKind.Code,
      path: 'dirty.ts',
      content: 'console.log("debug");\n',
    });
    expect(results.some(r => r.isFailed)).toBe(true);
    expect(results.some(r => r.message.includes('console'))).toBe(true);
  });
});
