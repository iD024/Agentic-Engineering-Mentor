import { describe, it, expect } from 'vitest';
import { EventSchema } from '../../src/events/schemas/EventSchema.js';
import { ValidationMiddleware } from '../../src/events/middleware/ValidationMiddleware.js';
import { Event } from '../../src/events/contracts/Event.js';

describe('Validation', () => {
  describe('EventSchema', () => {
    it('should validate a correct base event', () => {
      const validEvent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TestEvent',
        timestamp: new Date().toISOString(),
        version: 1,
        payload: { foo: 'bar' },
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        source: 'TestSource'
      };
      
      expect(() => EventSchema.parse(validEvent)).not.toThrow();
    });

    it('should reject an event missing required fields', () => {
      const invalidEvent = {
        type: 'TestEvent'
      };
      
      expect(() => EventSchema.parse(invalidEvent)).toThrow();
    });
  });

  describe('ValidationMiddleware', () => {
    it('should pass valid domain events', async () => {
      const middleware = new ValidationMiddleware();
      const validEvent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'RuntimeReady',
        timestamp: new Date().toISOString(),
        version: 1,
        payload: {},
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        source: 'TestSource'
      };

      let nextCalled = false;
      const next = async () => { nextCalled = true; };

      await middleware.handle(validEvent as unknown as Event, next);
      expect(nextCalled).toBe(true);
    });

    it('should throw on valid base event but invalid payload', async () => {
      const middleware = new ValidationMiddleware();
      const invalidPayloadEvent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'WorkspaceLoaded', // Requires workspaceId and path
        timestamp: new Date().toISOString(),
        version: 1,
        payload: { workspaceId: '123' }, // Missing path
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        source: 'TestSource'
      };

      const next = async () => {};

      await expect(middleware.handle(invalidPayloadEvent as unknown as Event, next)).rejects.toThrow();
    });
  });
});
