# Middleware

Middleware forms a sequential pipeline through which all events must pass before being dispatched to subscribers.

## Middleware Execution Flow
```mermaid
sequenceDiagram
    participant Publisher
    participant Bus as EventBus
    participant Validation as ValidationMiddleware
    participant Logging as LoggingMiddleware
    participant Metrics as MetricsMiddleware
    participant Dispatcher as EventDispatcher

    Publisher->>Bus: publish(event)
    Bus->>Validation: handle(event, next)
    
    alt is invalid
        Validation--xBus: throws Error
        Bus--xPublisher: throws Error
    else is valid
        Validation->>Logging: next()
        Logging->>Metrics: next()
        Metrics->>Dispatcher: next()
        Dispatcher-->>Metrics: done
        Metrics-->>Logging: done
        Logging-->>Validation: done
        Validation-->>Bus: done
        Bus-->>Publisher: done
    end
```

## Built-in Middleware
1. **ValidationMiddleware:** Ensures the event conforms to the base EventSchema and its specific domain payload schema using Zod. Rejects invalid events immediately.
2. **LoggingMiddleware:** Logs the source, type, and IDs of every event entering the system.
3. **MetricsMiddleware:** Tracks processing time and event counts.
