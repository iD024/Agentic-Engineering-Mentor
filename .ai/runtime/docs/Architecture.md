# Architecture

## Overview
The Engineering Workspace Runtime v2 is built on a structured three-layer architecture emphasizing strict inversion of control and separation of concerns.

### 1. Bootstrap Layer
- **Responsibility**: Initialization and composition.
- **Components**: `Bootstrap.ts`
- **Details**: This is the only place in the application where concrete services are constructed. It creates the `ServiceContainer`, instantiates core services, wires dependencies, and registers them. It ultimately hands control to the Kernel.

### 2. Kernel Layer
- **Responsibility**: Orchestration and lifecycle management.
- **Components**: `Kernel.ts`, `RuntimeState.ts`, `LifecycleManager.ts`, `RuntimeEvents.ts`
- **Details**: The Kernel represents the "operating system" layer. It coordinates the deterministic startup and graceful shutdown sequences. It manages the global `RuntimeState` and emits lifecycle events, but delegates the actual running logic to the Runtime. The Kernel receives its dependencies via constructor injection.

### 3. Runtime Layer
- **Responsibility**: Application execution.
- **Components**: `Runtime.ts`
- **Details**: Represents the running application itself. It receives all dependencies via the `RuntimeContext` injected into its constructor. It contains no construction logic, implementing `ILifecycle` so the Kernel can manage its start and stop routines.

## Dependency Injection (DI)
- **Container**: `ServiceContainer.ts` provides a lightweight, lazy-singleton DI container.
- **Tokens**: `ServiceTokens.ts` provides strongly typed symbols (e.g., `TOKENS.Kernel`) for safe resolution.
- **Inversion of Control**: Core services depend only on interfaces (e.g., `ILogger`, `IConfigProvider`, `IKernel`). Concrete classes are never referenced directly outside the `bootstrap/` composition root, ensuring maximum testability and decoupling.

## Extensibility
- **Health Checks**: The `HealthMonitor` uses the Open/Closed Principle. New checks can be added by implementing `IHealthCheck` and calling `register()` without modifying the monitor itself.
- **Context Injection**: `RuntimeContext` bundles core dependencies (Logger, Config, Container) into a single object, allowing future expansion without breaking constructor signatures across the codebase.
