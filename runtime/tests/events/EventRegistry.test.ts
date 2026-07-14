import { describe, it, expect, vi } from 'vitest';
import { EventRegistry } from '../../src/events/registry/EventRegistry.js';
import { EventSubscriber } from '../../src/events/contracts/EventSubscriber.js';
import { Event } from '../../src/events/contracts/Event.js';
import { EventHandler } from '../../src/events/contracts/EventHandler.js';

describe('EventRegistry', () => {
  it('should register and retrieve subscriber handlers', () => {
    const registry = new EventRegistry();
    const mockHandler: EventHandler<Event> = { handle: vi.fn() };
    const mockSubscriber: EventSubscriber = {
      supportedEvents: ['TestEvent'],
      getHandler: () => mockHandler,
    };

    registry.register(mockSubscriber);
    const handlers = registry.getHandlersForEvent('TestEvent');
    
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBe(mockHandler);
  });

  it('should unregister subscriber', () => {
    const registry = new EventRegistry();
    const mockHandler: EventHandler<Event> = { handle: vi.fn() };
    const mockSubscriber: EventSubscriber = {
      supportedEvents: ['TestEvent'],
      getHandler: () => mockHandler,
    };

    registry.register(mockSubscriber);
    registry.unregister(mockSubscriber);
    const handlers = registry.getHandlersForEvent('TestEvent');
    
    expect(handlers).toHaveLength(0);
  });

  it('should return empty array for unregistered event type', () => {
    const registry = new EventRegistry();
    const handlers = registry.getHandlersForEvent('UnknownEvent');
    expect(handlers).toHaveLength(0);
  });
});
