import { Event } from '../contracts/Event.js';

export type NextFunction = () => Promise<void>;

export interface EventMiddleware {
  handle(event: Event, next: NextFunction): Promise<void>;
}
