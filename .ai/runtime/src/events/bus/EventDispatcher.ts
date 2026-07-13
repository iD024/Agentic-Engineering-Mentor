import { Event } from '../contracts/Event.js';
import { EventRegistry } from '../registry/EventRegistry.js';

export class EventDispatcher {
  constructor(private registry: EventRegistry) {}

  async dispatch(event: Event): Promise<void> {
    const handlers = this.registry.getHandlersForEvent(event.type);
    
    // Dispatch to all handlers concurrently
    // (Could also be configured for sequential execution if required)
    const promises = handlers.map(handler => handler.handle(event));
    
    await Promise.allSettled(promises);
  }
}
