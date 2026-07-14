import { describe, it, expect, vi } from 'vitest';
import { LoggingMiddleware } from '../../src/events/middleware/LoggingMiddleware.js';
import { MetricsMiddleware } from '../../src/events/middleware/MetricsMiddleware.js';
import { Event } from '../../src/events/contracts/Event.js';

describe('Middleware', () => {
  describe('LoggingMiddleware', () => {
    it('should call next and log', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const middleware = new LoggingMiddleware();
      let nextCalled = false;
      const next = async () => { nextCalled = true; };

      const mockEvent: Event = {
        id: '1', type: 'Test', timestamp: '', version: 1, payload: {}, eventId: '1', source: 'test'
      };

      await middleware.handle(mockEvent, next);
      expect(nextCalled).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('MetricsMiddleware', () => {
    it('should increment metrics count for event type', async () => {
      const middleware = new MetricsMiddleware();
      const mockEvent: Event = {
        id: '1', type: 'TestEvent', timestamp: '', version: 1, payload: {}, eventId: '1', source: 'test'
      };

      await middleware.handle(mockEvent, async () => {});
      await middleware.handle(mockEvent, async () => {});

      const metrics = middleware.getMetrics();
      expect(metrics['TestEvent']).toBe(2);
    });
  });
});
