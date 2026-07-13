import { describe, it, expect, vi } from 'vitest';
import { EventDispatcher } from '../../src/events/bus/EventDispatcher.js';
import { EventRegistry } from '../../src/events/registry/EventRegistry.js';
import { Event } from '../../src/events/contracts/Event.js';

describe('EventDispatcher', () => {
  it('should dispatch event to all registered handlers', async () => {
    const registry = new EventRegistry();
    const dispatcher = new EventDispatcher(registry);

    const mockHandler1 = { handle: vi.fn().mockResolvedValue(undefined) };
    const mockHandler2 = { handle: vi.fn().mockResolvedValue(undefined) };

    registry.register({
      supportedEvents: ['TestEvent'],
      getHandler: () => mockHandler1,
    });
    registry.register({
      supportedEvents: ['TestEvent'],
      getHandler: () => mockHandler2,
    });

    const mockEvent: Event = {
      id: '1',
      type: 'TestEvent',
      timestamp: '2024-01-01T00:00:00Z',
      version: 1,
      payload: {},
      eventId: '1',
      source: 'test'
    };

    await dispatcher.dispatch(mockEvent);

    expect(mockHandler1.handle).toHaveBeenCalledWith(mockEvent);
    expect(mockHandler2.handle).toHaveBeenCalledWith(mockEvent);
  });

  it('should not throw if no handlers are found', async () => {
    const registry = new EventRegistry();
    const dispatcher = new EventDispatcher(registry);

    const mockEvent: Event = {
      id: '1',
      type: 'TestEvent',
      timestamp: '2024-01-01T00:00:00Z',
      version: 1,
      payload: {},
      eventId: '1',
      source: 'test'
    };

    await expect(dispatcher.dispatch(mockEvent)).resolves.not.toThrow();
  });
});
