import { Event } from '../contracts/Event.js';
import { EventMiddleware, NextFunction } from './Middleware.js';

export class LoggingMiddleware implements EventMiddleware {
  async handle(event: Event, next: NextFunction): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [EVENT] Dispatched: ${event.type} (ID: ${event.eventId}, Source: ${event.source})`);
    
    try {
      await next();
      console.log(`[${timestamp}] [EVENT] Successfully handled: ${event.type}`);
    } catch (error) {
      console.error(`[${timestamp}] [EVENT] Error handling ${event.type}:`, error);
      throw error;
    }
  }
}
