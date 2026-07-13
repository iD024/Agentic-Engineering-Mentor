# State Flow

## Runtime Lifecycle States

```
CREATED ──boot()──► BOOTING ──success──► READY
                        │                   │
                      error              shutdown()
                        │                   │
                        ▼                   ▼
                      FAILED ◄──error── STOPPING ──success──► STOPPED
```

All transitions are validated by `StateTransitionGuard`.
Invalid transitions throw immediately.

## Startup Sequence (Stage 2)

```
Bootstrap
  │
  ├─ Config + Logger + Container
  ├─ Lifecycle + Events + Kernel + Shutdown
  ├─ Database.open()
  ├─ MigrationRunner.run()
  ├─ Repositories (6)
  ├─ StateManager
  ├─ RuntimeContext (with stateManager)
  ├─ Runtime (registered with Lifecycle)
  ├─ HealthMonitor (Config + Logger + State + Database)
  ├─ ServiceContainer.registerAll()
  └─ Kernel.boot()
       │
       ├─ LifecycleManager.startAll()
       │    └─ Runtime.start()
       │         ├─ WorkspaceImporter.import()
       │         └─ Wire WorkspaceSaved → WorkspaceExporter
       └─ RuntimeState → READY
```

## Shutdown Sequence

```
SIGINT/SIGTERM
  │
  └─ ShutdownHandler → Kernel.shutdown()
       │
       ├─ RuntimeState → STOPPING
       ├─ LifecycleManager.stopAll()
       │    └─ Runtime.stop()
       │         ├─ WorkspaceExporter.export() (final snapshot)
       │         └─ StateManager.flushCache()
       └─ Database.close()
            └─ RuntimeState → STOPPED
```

## Data Flow

```
workspace.json ──import──► SQLite (authoritative)
                                │
                         StateManager
                                │
                         ┌──────┴──────┐
                      Services      Snapshots
                                │
                         WorkspaceExporter
                                │
                         workspace.json (git snapshot)
```

## Ownership

| What | Who owns it |
|---|---|
| Runtime state transitions | StateTransitionGuard |
| All persistence | StateManager |
| All SQL | Repositories |
| Business rules | Services |
| Service construction | Bootstrap |
| Service lifecycle | LifecycleManager |
| Import | WorkspaceImporter |
| Export | WorkspaceExporter |
