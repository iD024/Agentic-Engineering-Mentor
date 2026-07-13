import type { Tool, ToolContext } from '../tool-registry/Tool.js';
import type { ToolResult } from '../tool-registry/ToolModels.js';
import type { ExecutionContext } from '../core/execution/ExecutionContext.js';
import { ToolExecutionError } from '../errors/GatewayErrors.js';
// Context Engine
import { ContextBuilder, ContextOptimizer } from '../context/index.js';
// Telemetry
import { ExecutionTracer, MetricsCollector } from '../telemetry/index.js';

export interface PipelineOptions {
  tracer: ExecutionTracer;
  metrics: MetricsCollector;
  contextBuilder: ContextBuilder;
  contextOptimizer: ContextOptimizer;
}

export class ToolExecutionPipeline {
  constructor(private readonly options: PipelineOptions) {}

  async execute(tool: Tool, params: unknown, context: ExecutionContext): Promise<ToolResult> {
    const span = this.options.tracer.startSpan(context, `ToolPipeline:${tool.descriptor.name}`);
    
    try {
      // 1. Validation (Schema validation could go here)
      this.validate(tool, params);

      // 2. Permission Check
      this.checkPermissions(tool, context);

      // 3. Context Build
      const rawContext = await this.options.contextBuilder.build(context);

      // 4. Context Optimization
      this.options.contextOptimizer.optimize(rawContext);

      // 5. Execution
      const toolContext: ToolContext = {
        ...context,
        toolName: tool.descriptor.name
        // Add optimized context if needed by tool
      } as ToolContext;
      
      const result = await tool.execute(params, toolContext);

      // 6. Event Publication (Done via EventBus later)
      
      // 7. Metrics Collection
      this.options.metrics.increment('tool.execution', { tool: tool.descriptor.name, success: result.success ? 'true' : 'false' });

      // 8. Response Building & Serialization happens downstream

      this.options.tracer.endSpan(span.id);
      return result;

    } catch (err) {
      this.options.tracer.endSpan(span.id, err instanceof Error ? err : new Error(String(err)));
      this.options.metrics.increment('tool.execution', { tool: tool.descriptor.name, success: 'false' });
      throw new ToolExecutionError(`Failed to execute tool ${tool.descriptor.name}`, err);
    }
  }

  private validate(_tool: Tool, _params: unknown): void {
    // Validate against tool.descriptor.parameters
  }

  private checkPermissions(_tool: Tool, _context: ExecutionContext): void {
    // Permission checks
  }
}
