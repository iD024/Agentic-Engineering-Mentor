# Subscribers

Subscribers react to events published on the Event Bus.

## Subscriber Interaction Diagram
```mermaid
graph TD
    Bus[EventBus / Dispatcher] -->|WorkspaceExported| Exporter[ExporterSubscriber]
    Bus -->|DatabaseDisconnected, RuntimeStopping| Health[HealthMonitorSubscriber]
    Bus -->|SessionStarted, WorkspaceLoaded| Metrics[MetricsSubscriber]
    Bus -->|All Domain Events| Logger[LoggerSubscriber]
    
    Logger --> Console/LogFile
    Metrics --> MetricsEngine
    Health --> AlertSystem
    Exporter --> ExporterService
```

## Contracts
Each subscriber must implement `EventSubscriber`:
```typescript
export interface EventSubscriber {
  readonly supportedEvents: string[];
  getHandler(eventType: string): EventHandler<Event> | undefined;
}
```

Subscribers do not know about publishers, and publishers do not know about subscribers.
