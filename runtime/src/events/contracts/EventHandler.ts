import { Event } from './Event.js';

export interface EventHandler<T extends Event = Event> {
  handle(event: T): Promise<void> | void;
}
