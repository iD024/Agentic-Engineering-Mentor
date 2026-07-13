# Import Pipeline

## Why it exists

The v1 workspace stores state in `.ai/workspace.json` and Markdown files.
Stage 2 makes SQLite the authoritative source of truth, but must not lose
the existing workspace data. The importer bridges the two worlds.

## Design

The import pipeline runs once during `Runtime.start()`. After import,
the runtime reads exclusively from SQLite. The legacy files are not deleted —
they remain as human-readable references.

### WorkspaceImporter
Orchestrates the full import:
1. Reads `.ai/workspace.json`
2. Converts to domain models
3. Persists via StateManager

### MarkdownImporter
Parses legacy Markdown files in `.ai/core/`.
Focused parser — no database, no orchestration.

## Idempotency

Re-running the importer updates the existing workspace rather than creating a
duplicate. The primary workspace id is stored in the `settings` table under
`workspace.primaryId` after the first import.

## Extensibility

Adding support for a new import format (YAML, TOML) means:
1. Create a new `*Importer.ts` class focused on parsing that format
2. Call it from `WorkspaceImporter` as an additional `import*` method

No existing code changes.
