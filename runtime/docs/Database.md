# Database Layer

## Why it exists

The database layer provides a clean boundary around SQLite. It isolates
connection management, migration application, and health reporting into
three focused classes.

## Components

### Database.ts
Opens, exposes, and closes a single SQLite connection.
Does NOT run queries. Does NOT know about the schema.

### DatabaseConfig.ts
Typed configuration: path, WAL mode, timeout, verbosity.

### MigrationRunner.ts
Executes versioned SQL migrations in order.
Idempotent: each migration runs at most once, tracked in `schema_version`.
Migration files live in `database/migrations/` and are numbered sequentially.

### DatabaseHealthCheck.ts
Implements `IHealthCheck` to integrate with Stage 1's HealthMonitor.
Executes `SELECT 1` to confirm the connection is live.

## Migration Strategy

Migrations are append-only. Never modify an existing migration.
If a schema change is needed, add a new migration file with the next version number.

## Schema Overview

| Table | Purpose |
|---|---|
| `schema_version` | Records applied migration versions |
| `workspaces` | Root workspace entity |
| `sessions` | Engineering sessions per workspace |
| `learning_progress` | Competency tracking per topic |
| `milestones` | Engineering milestone roadmap |
| `dependency_metrics` | Dependency health snapshot |
| `settings` | Runtime key-value configuration |
