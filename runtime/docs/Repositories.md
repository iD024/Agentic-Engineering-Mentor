# Repositories

## Why they exist

Repositories are the only place in the runtime where SQL is written.
This single-responsibility rule means:
- SQL is findable (always in `repositories/`)
- SQL is testable in isolation (just inject a test database)
- Services and StateManager are testable without any SQL knowledge
- Schema changes have a single blast radius (only repositories change)

## Rules

1. Repositories contain SQL. Nothing else.
2. No business logic. No validation. No caching. No events.
3. Use prepared statements for all parameterised queries.
4. Return domain models, never raw row objects.
5. Accept domain models for writes, never raw SQL parameters.

## Repository ↔ Table Map

| Repository | Table |
|---|---|
| `WorkspaceRepository` | `workspaces` |
| `SessionRepository` | `sessions` |
| `LearningRepository` | `learning_progress` |
| `MilestoneRepository` | `milestones` |
| `DependencyRepository` | `dependency_metrics` |
| `SettingsRepository` | `settings` |

## Dependency Rule

Repositories depend on `Database` only.
They are called by `StateManager` only.
Services must never call repositories directly.
