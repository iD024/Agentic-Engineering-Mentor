import { Event } from '../contracts/Event.js';
import { EventMiddleware, NextFunction } from './Middleware.js';

export class MetricsMiddleware implements EventMiddleware {
  private metrics: Map<string, number> = new Map();

  async handle(event: Event, next: NextFunction): Promise<void> {
    const startTime = performance.now();
    
    // Increment count for event type
    const currentCount = this.metrics.get(event.type) || 0;
    this.metrics.set(event.type, currentCount + 1);

    try {
      await next();
    } finally {
      const endTime = performance.now();
      const _duration = endTime - startTime;
      // In a real system, send this to a metrics service
      // console.log(`[METRICS] Event ${event.type} processed in ${_duration.toFixed(2)}ms`);
    }
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}
