# Events

Events represent immutable facts that have occurred in the system.

## Philosophy
Services publish facts. Subscribers react. Never directly call unrelated services. Events must be immutable and validated before entering the runtime.

## Core Contract

```typescript
export interface Event<T = any> {
  id: string;
  type: string;
  timestamp: string;
  version: number;
  payload: T;
  // Event Sourcing Readiness
  eventId: string;
  correlationId?: string;
  causationId?: string;
  source: string;
}
```

Every event contains Event Sourcing Readiness fields to track the flow of multi-agent and system-wide processes. 

## Domain Events Available
- `WorkspaceLoaded`
- `WorkspaceSaved`
- `WorkspaceImported`
- `WorkspaceExported`
- `SessionStarted`
- `SessionEnded`
- `MilestoneCompleted`
- `LearningProgressUpdated`
- `DependencyUpdated`
- `RuntimeReady`
- `RuntimeStopping`
- `DatabaseConnected`
- `DatabaseDisconnected`

All events are strictly validated by Zod schemas found in `DomainEventSchemas.ts`.
