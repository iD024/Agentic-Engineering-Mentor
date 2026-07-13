import { z } from 'zod';

export const EventSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  timestamp: z.string().datetime(),
  version: z.number().int().min(1),
  payload: z.any(),
  // Event Sourcing Readiness
  eventId: z.string().uuid(),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
  source: z.string().min(1),
});
