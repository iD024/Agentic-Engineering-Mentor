import type { IAgent, AgentManifest, AgentResult } from '../agent-runtime/types.js';
import { AgentCapability } from '../agent-runtime/types.js';
import type { AgentContext } from '../agent-context/AgentContext.js';
import { ValidateSubmissionQuery } from '../../validation/index.js';
import { ValidationTargetKind } from '../../validation/types.js';
import type { ValidationReport } from '../../validation/index.js';

export class CodeDependencyValidator implements IAgent {
  public readonly manifest: AgentManifest = {
    id: 'code-dependency-validator',
    name: 'Code & Dependency Validator',
    version: '1.0.0',
    description: 'Verifies code correctness and dependencies via Engineering Validation Platform.',
    capabilities: [AgentCapability.CODE_ANALYSIS, AgentCapability.TESTING],
    executionMode: 'synchronous'
  };

  private context?: AgentContext;

  async initialize(): Promise<void> {}

  async start(context: unknown): Promise<void> {
    this.context = context as AgentContext;
    this.context.logger.info(`${this.manifest.name} started.`);
  }

  async pause(): Promise<void> {}
  async resume(): Promise<void> {}

  async stop(): Promise<void> {
    this.context = undefined;
  }

  async executeTask(taskId: string, input: unknown): Promise<AgentResult> {
    if (!this.context) throw new Error('Agent not started');
    
    this.context.logger.info(`Validator checking task: ${taskId}`);

    const payload = input as {
      target?: any;
      rubric?: any;
      overrideRuleIds?: string[];
    };

    // Default target & rubric for fallback
    const target = payload.target ?? { kind: ValidationTargetKind.Code, path: process.cwd() };
    const rubric = payload.rubric ?? { id: 'default', name: 'Default', version: '1', passingThreshold: 100, criteria: [] };

    const query = new ValidateSubmissionQuery(taskId, target, rubric, payload.overrideRuleIds);
    const report = await this.context.queryBus.execute(query) as ValidationReport;

    return {
      success: report.gradeReport.rubricScore.passed ?? (report.gradeReport.letter !== 'F'),
      data: {
        validated: true,
        reportId: report.id,
        grade: report.gradeReport.letter,
        score: report.gradeReport.rubricScore.percentage,
        markdownSummary: report.markdownSummary
      },
      capabilitiesUsed: [AgentCapability.CODE_ANALYSIS, AgentCapability.TESTING]
    };
  }
}
