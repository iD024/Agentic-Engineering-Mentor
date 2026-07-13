import { Event } from '../contracts/Event.js';
import { z } from 'zod';
import * as Schemas from '../schemas/DomainEventSchemas.js';

export abstract class DomainEvent<T> implements Event<T> {
  public readonly id: string;
  public readonly timestamp: string;
  public readonly version: number = 1;

  constructor(
    public readonly type: string,
    public readonly payload: T,
    public readonly eventId: string,
    public readonly source: string,
    public readonly correlationId?: string,
    public readonly causationId?: string
  ) {
    this.id = eventId;
    this.timestamp = new Date().toISOString();
  }
}

export class WorkspaceLoadedEvent extends DomainEvent<z.infer<typeof Schemas.WorkspaceLoadedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.WorkspaceLoadedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('WorkspaceLoaded', payload, eventId, source, correlationId, causationId);
  }
}

export class WorkspaceSavedEvent extends DomainEvent<z.infer<typeof Schemas.WorkspaceSavedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.WorkspaceSavedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('WorkspaceSaved', payload, eventId, source, correlationId, causationId);
  }
}

export class WorkspaceImportedEvent extends DomainEvent<z.infer<typeof Schemas.WorkspaceImportedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.WorkspaceImportedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('WorkspaceImported', payload, eventId, source, correlationId, causationId);
  }
}

export class WorkspaceExportedEvent extends DomainEvent<z.infer<typeof Schemas.WorkspaceExportedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.WorkspaceExportedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('WorkspaceExported', payload, eventId, source, correlationId, causationId);
  }
}

export class SessionStartedEvent extends DomainEvent<z.infer<typeof Schemas.SessionStartedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.SessionStartedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('SessionStarted', payload, eventId, source, correlationId, causationId);
  }
}

export class SessionEndedEvent extends DomainEvent<z.infer<typeof Schemas.SessionEndedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.SessionEndedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('SessionEnded', payload, eventId, source, correlationId, causationId);
  }
}

export class MilestoneCompletedEvent extends DomainEvent<z.infer<typeof Schemas.MilestoneCompletedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.MilestoneCompletedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('MilestoneCompleted', payload, eventId, source, correlationId, causationId);
  }
}

export class LearningProgressUpdatedEvent extends DomainEvent<z.infer<typeof Schemas.LearningProgressUpdatedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.LearningProgressUpdatedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('LearningProgressUpdated', payload, eventId, source, correlationId, causationId);
  }
}

export class DependencyUpdatedEvent extends DomainEvent<z.infer<typeof Schemas.DependencyUpdatedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.DependencyUpdatedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('DependencyUpdated', payload, eventId, source, correlationId, causationId);
  }
}

export class RuntimeReadyEvent extends DomainEvent<z.infer<typeof Schemas.RuntimeReadyPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.RuntimeReadyPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('RuntimeReady', payload, eventId, source, correlationId, causationId);
  }
}

export class RuntimeStoppingEvent extends DomainEvent<z.infer<typeof Schemas.RuntimeStoppingPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.RuntimeStoppingPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('RuntimeStopping', payload, eventId, source, correlationId, causationId);
  }
}

export class DatabaseConnectedEvent extends DomainEvent<z.infer<typeof Schemas.DatabaseConnectedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.DatabaseConnectedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('DatabaseConnected', payload, eventId, source, correlationId, causationId);
  }
}

export class DatabaseDisconnectedEvent extends DomainEvent<z.infer<typeof Schemas.DatabaseDisconnectedPayloadSchema>> {
  constructor(payload: z.infer<typeof Schemas.DatabaseDisconnectedPayloadSchema>, eventId: string, source: string, correlationId?: string, causationId?: string) {
    super('DatabaseDisconnected', payload, eventId, source, correlationId, causationId);
  }
}
