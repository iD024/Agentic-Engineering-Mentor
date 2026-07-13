import { EventSubscriber } from '../contracts/EventSubscriber.js';
import { EventHandler } from '../contracts/EventHandler.js';
import { Event } from '../contracts/Event.js';

export class EventRegistry {
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();

  register(subscriber: EventSubscriber): void {
    for (const eventType of subscriber.supportedEvents) {
      if (!this.subscribers.has(eventType)) {
        this.subscribers.set(eventType, new Set());
      }
      this.subscribers.get(eventType)!.add(subscriber);
    }
  }

  unregister(subscriber: EventSubscriber): void {
    for (const eventType of subscriber.supportedEvents) {
      const typeSubscribers = this.subscribers.get(eventType);
      if (typeSubscribers) {
        typeSubscribers.delete(subscriber);
      }
    }
  }

  getHandlersForEvent(eventType: string): EventHandler<Event>[] {
    const typeSubscribers = this.subscribers.get(eventType);
    if (!typeSubscribers) {
      return [];
    }

    const handlers: EventHandler<Event>[] = [];
    for (const subscriber of typeSubscribers) {
      const handler = subscriber.getHandler(eventType);
      if (handler) {
        handlers.push(handler);
      }
    }

    return handlers;
  }
}
