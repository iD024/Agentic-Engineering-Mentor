import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/events/bus/EventBus.js';
import { EventMiddleware, NextFunction } from '../../src/events/middleware/Middleware.js';
import { Event } from '../../src/events/contracts/Event.js';
import { EventSubscriber } from '../../src/events/contracts/EventSubscriber.js';

describe('EventBus', () => {
  it('should execute middleware in order before dispatching', async () => {
    const bus = new EventBus();
    const executionOrder: string[] = [];

    const middleware1: EventMiddleware = {
      handle: async (event: Event, next: NextFunction) => {
        executionOrder.push('mw1-start');
        await next();
        executionOrder.push('mw1-end');
      }
    };

    const middleware2: EventMiddleware = {
      handle: async (event: Event, next: NextFunction) => {
        executionOrder.push('mw2-start');
        await next();
        executionOrder.push('mw2-end');
      }
    };

    bus.use(middleware1);
    bus.use(middleware2);

    const mockSubscriber: EventSubscriber = {
      supportedEvents: ['TestEvent'],
      getHandler: () => ({
        handle: async () => {
          executionOrder.push('handler');
        }
      })
    };

    bus.subscribe(mockSubscriber);

    const mockEvent: Event = {
      id: '1',
      type: 'TestEvent',
      timestamp: '2024-01-01T00:00:00Z',
      version: 1,
      payload: {},
      eventId: '1',
      source: 'test'
    };

    await bus.publish(mockEvent);

    expect(executionOrder).toEqual([
      'mw1-start',
      'mw2-start',
      'handler',
      'mw2-end',
      'mw1-end'
    ]);
  });

  it('should stop pipeline if middleware throws', async () => {
    const bus = new EventBus();
    
    bus.use({
      handle: async () => {
        throw new Error('Middleware Error');
      }
    });

    const mockHandler = vi.fn();
    bus.subscribe({
      supportedEvents: ['TestEvent'],
      getHandler: () => ({ handle: mockHandler })
    });

    const mockEvent: Event = {
      id: '1', type: 'TestEvent', timestamp: '', version: 1, payload: {}, eventId: '1', source: 'test'
    };

    await expect(bus.publish(mockEvent)).rejects.toThrow('Middleware Error');
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
