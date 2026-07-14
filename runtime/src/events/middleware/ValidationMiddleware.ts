import { Event } from '../contracts/Event.js';
import { EventMiddleware, NextFunction } from './Middleware.js';
import { EventSchema } from '../schemas/EventSchema.js';
import { z } from 'zod';
import * as Schemas from '../schemas/DomainEventSchemas.js';

const typeToSchemaMap: Record<string, z.ZodSchema> = {
  WorkspaceLoaded: Schemas.WorkspaceLoadedPayloadSchema,
  WorkspaceSaved: Schemas.WorkspaceSavedPayloadSchema,
  WorkspaceImported: Schemas.WorkspaceImportedPayloadSchema,
  WorkspaceExported: Schemas.WorkspaceExportedPayloadSchema,
  SessionStarted: Schemas.SessionStartedPayloadSchema,
  SessionEnded: Schemas.SessionEndedPayloadSchema,
  MilestoneCompleted: Schemas.MilestoneCompletedPayloadSchema,
  LearningProgressUpdated: Schemas.LearningProgressUpdatedPayloadSchema,
  DependencyUpdated: Schemas.DependencyUpdatedPayloadSchema,
  RuntimeReady: Schemas.RuntimeReadyPayloadSchema,
  RuntimeStopping: Schemas.RuntimeStoppingPayloadSchema,
  DatabaseConnected: Schemas.DatabaseConnectedPayloadSchema,
  DatabaseDisconnected: Schemas.DatabaseDisconnectedPayloadSchema,
};

export class ValidationMiddleware implements EventMiddleware {
  async handle(event: Event, next: NextFunction): Promise<void> {
    // Validate base event structure
    EventSchema.parse(event);

    // Validate payload structure if schema exists for this type
    const payloadSchema = typeToSchemaMap[event.type];
    if (payloadSchema) {
      payloadSchema.parse(event.payload);
    } else {
      throw new Error(`No schema found for event type: ${event.type}`);
    }

    await next();
  }
}
