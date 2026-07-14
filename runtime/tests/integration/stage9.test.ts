import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ValidationTargetKind } from '../../src/validation/types.js';
import { ValidationRuntime } from '../../src/validation/ValidationRuntime.js';
import { ValidationRegistry } from '../../src/validation/ValidationRegistry.js';
import { RubricEngine } from '../../src/validation/rubrics/RubricEngine.js';
import { GradingEngine } from '../../src/validation/grading/GradingEngine.js';
import { ReportGenerator } from '../../src/validation/reports/ReportGenerator.js';
import { CodeCompilerValidator, CodeStaticAnalysisValidator } from '../../src/validation/validators/index.js';
import type { Rubric } from '../../src/validation/rubrics/types.js';

import { fileURLToPath } from 'node:url';

const __dirname = import.meta.dirname || fileURLToPath(new URL('.', import.meta.url));
const TEST_DIR = join(__dirname, '.test-workspace-stage9');

describe('Stage 9: Engineering Validation Platform Integration', () => {
  let runtime: ValidationRuntime;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
    
    writeFileSync(join(TEST_DIR, 'index.ts'), 'export const greeting = "Hello World";\n');
    writeFileSync(join(TEST_DIR, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { target: "es2022", module: "nodenext" }
    }));

    const registry = new ValidationRegistry();
    registry.register(new CodeCompilerValidator());
    registry.register(new CodeStaticAnalysisValidator());
    
    runtime = new ValidationRuntime(registry, new GradingEngine(new RubricEngine()), new ReportGenerator());
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('runs end-to-end validation through ValidationRuntime', async () => {
    const rubric: Rubric = {
      id: 'integration-rubric',
      name: 'Integration Test Rubric',
      version: '1',
      passingThreshold: 100,
      criteria: [
        {
          id: 'compile',
          name: 'Code Compiles',
          description: 'No TSC errors',
          weight: 50,
          ruleIds: ['code/compiler-clean'],
          requiredPassCount: 1,
        },
        {
          id: 'static',
          name: 'Static Clean',
          description: 'No lint issues',
          weight: 50,
          ruleIds: ['code/static-clean'],
          requiredPassCount: 1,
        }
      ],
    };

    const target = {
      kind: ValidationTargetKind.Code,
      path: TEST_DIR,
    };

    const report = await runtime.validateSubmission('sub-e2e', target, rubric, ['code/compiler-clean', 'code/static-clean']);

    expect(report.gradeReport.letter).toBe('A');
    expect(report.gradeReport.rubricScore.percentage).toBe(100);
    expect(report.gradeReport.rubricScore.passed).toBe(true);
    expect(report.markdownSummary).toContain('**Grade:** A (100%)');
  }, 30000);
});
