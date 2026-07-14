# State Engine

## Why it exists

The State Engine is the most critical addition in Stage 2. Without it, any
code in the runtime — a service, an importer, a future AI agent — could
read or write the database directly. This creates invisible corruption risks:
stale caches, partial writes, concurrent modification without transactions,
and no way to roll back on failure.

The State Engine solves this with a single-gateway architecture:

**Only StateManager may touch persistence.**

## Components

| Component | Responsibility |
|---|---|
| `StateManager` | Sole gateway to persistence. Owns cache, events, snapshots. |
| `StateCache` | In-memory cache of frozen domain objects. |
| `StateSnapshot` | Immutable point-in-time capture for rollback and audit. |
| `StateVersion` | Tracks schema, workspace format, and runtime versions. |
| `StateTransitionGuard` | Validates runtime lifecycle state transitions. |
| `StateEvents` | Synchronous local event bus for state notifications. |

## StateTransitionGuard — Why it's critical

The guard enforces the runtime's finite state machine:

```
CREATED → BOOTING → READY → STOPPING → STOPPED
                  ANY STATE → FAILED
```

Without the guard, bugs can silently leave the runtime in an undefined state.
With it, invalid transitions throw descriptive errors immediately.

This is the foundation that makes the runtime safe for future AI agents and
MCP tools — no external caller can drive the runtime into an undefined state.

## API Design Principle

StateManager exposes a **command-oriented API**, not getters and setters:

```typescript
// Wrong — exposes mutable internals
stateManager.workspace.name = 'New';

// Right — named commands with explicit intent
stateManager.updateWorkspace('ws-1', { name: 'New' });
```

Every write is auditable, cacheable, and evented.

## Who may use what

| Component | May use |
|---|---|
| Services | StateManager |
| StateManager | Repositories, StateCache, StateSnapshot, StateEvents |
| Repositories | Database only |
| External agents (future) | Services only |
| MCP tools (future) | Services only |
