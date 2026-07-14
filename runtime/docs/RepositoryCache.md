# Repository Cache

## Ownership
Cache Layer.

## Responsibilities
- Store expensive-to-compute data (ASTs, graphs) into SQLite using the standard `Database` connection from Stage 2.

## Lifecycle
Loaded on startup to avoid re-parsing unchanged files.

## Future AI Integration
Makes the runtime ultra-fast so AI agents don't have to wait for repository analysis on every start.
