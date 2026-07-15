import { Event } from '../contracts/Event.js';
import { EventMiddleware, NextFunction } from './Middleware.js';

export class LoggingMiddleware implements EventMiddleware {
  async handle(event: Event, next: NextFunction): Promise<void> {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] [EVENT] Dispatched: ${event.type} (ID: ${event.eventId}, Source: ${event.source})\n`);
    
    try {
      await next();
      process.stderr.write(`[${timestamp}] [EVENT] Successfully handled: ${event.type}\n`);
    } catch (error) {
      process.stderr.write(`[${timestamp}] [EVENT] Error handling ${event.type}: ${error instanceof Error ? error.stack : error}\n`);
      throw error;
    }
  }
}
