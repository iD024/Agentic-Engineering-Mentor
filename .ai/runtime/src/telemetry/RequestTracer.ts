import type { ExecutionContext } from '../core/execution/ExecutionContext.js';

/**
 * Traces high-level requests entering the Gateway.
 */
export class RequestTracer {
  private requests: Map<string, { startTime: number, path: string }> = new Map();

  startRequest(context: ExecutionContext, path: string): void {
    this.requests.set(context.requestId, {
      startTime: Date.now(),
      path
    });
    context.logger.info(`Request started: ${path}`, { 
      requestId: context.requestId,
      correlationId: context.correlationId 
    });
  }

  endRequest(context: ExecutionContext, statusCode: number, error?: Error): void {
    const req = this.requests.get(context.requestId);
    if (!req) return;
    
    const duration = Date.now() - req.startTime;
    context.logger.info(`Request ended: ${req.path}`, {
      requestId: context.requestId,
      durationMs: duration,
      statusCode,
      error: error?.message
    });
    this.requests.delete(context.requestId);
  }
}
