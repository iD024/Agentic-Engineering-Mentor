import type { ValidationTarget } from './types.js';
import type { Rubric } from './rubrics/types.js';
import type { ValidationReport } from './reports/ValidationReport.js';
import { ValidationPipeline } from './ValidationPipeline.js';
import { DiagnosticEngine } from './diagnostics/DiagnosticEngine.js';
import { GradingEngine } from './grading/GradingEngine.js';
import { ReportGenerator } from './reports/ReportGenerator.js';
import { ValidationRegistry } from './ValidationRegistry.js';

/**
 * The facade and orchestrator for the Engineering Validation Platform.
 * Executes the full validation flow: Pipeline → Diagnostics + Grading → Report.
 */
export class ValidationRuntime {
  constructor(
    private readonly registry: ValidationRegistry,
    private readonly gradingEngine: GradingEngine,
    private readonly reportGenerator: ReportGenerator,
  ) {}

  /**
   * Validates a target against a rubric and generates a final report.
   * Deterministic process.
   *
   * @param submissionId Unique ID for this submission run
   * @param target The target (e.g. Code, Repository, etc.) to validate
   * @param rubric The rubric to score against
   * @param overrideRuleIds Optional list of specific rule IDs to run. If omitted, runs all rules for target kind.
   */
  async validateSubmission(
    submissionId: string,
    target: ValidationTarget,
    rubric: Rubric,
    overrideRuleIds?: string[],
  ): Promise<ValidationReport> {
    // 1. Run Pipeline
    const pipeline = new ValidationPipeline(this.registry);
    const pipelineResult = await pipeline.run(target, overrideRuleIds);

    // 2. Collect Diagnostics
    const diagEngine = new DiagnosticEngine();
    diagEngine.addFromResults(pipelineResult.results, 'ValidationPipeline');
    diagEngine.deduplicate();

    // 3. Grade
    const gradeReport = this.gradingEngine.grade(submissionId, rubric, pipelineResult);

    // 4. Generate Report
    return this.reportGenerator.generate(gradeReport, diagEngine.getAll());
  }

  getRegistry(): ValidationRegistry {
    return this.registry;
  }
}
