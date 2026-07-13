import { Event } from './Event.js';
import { EventHandler } from './EventHandler.js';

export interface EventSubscriber {
  readonly supportedEvents: string[];
  getHandler(eventType: string): EventHandler<Event> | undefined;
}
