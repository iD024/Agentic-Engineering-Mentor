import type { ExecutionContext } from '../core/execution/ExecutionContext.js';

export interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  tags: Record<string, string>;
  error?: Error;
}

/**
 * Traces internal execution flow across the runtime deterministically.
 */
export class ExecutionTracer {
  private spans: Map<string, TraceSpan> = new Map();

  startSpan(context: ExecutionContext, name: string, tags?: Record<string, string>): TraceSpan {
    const span: TraceSpan = {
      id: crypto.randomUUID(),
      name,
      startTime: Date.now(),
      tags: {
        ...tags,
        requestId: context.requestId,
        correlationId: context.correlationId,
        traceId: context.traceId
      }
    };
    this.spans.set(span.id, span);
    context.logger.debug(`Span started: ${name}`, { spanId: span.id });
    return span;
  }

  endSpan(spanId: string, error?: Error): void {
    const span = this.spans.get(spanId);
    if (!span) return;
    
    span.endTime = Date.now();
    if (error) {
      span.error = error;
    }
    
    // In a real system, you might dispatch this to a sink or event bus.
  }

  getSpans(): TraceSpan[] {
    return Array.from(this.spans.values());
  }
}
