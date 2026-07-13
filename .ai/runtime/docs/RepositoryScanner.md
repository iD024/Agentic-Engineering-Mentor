# RepositoryScanner

## Ownership
Belongs to the Repository Intelligence Engine.

## Responsibilities
- Coordinates the complete scanning of the workspace.
- Emits events when scanning is complete.
- Bridges FileScanner, LanguageDetector, and ParserFactory.

## Lifecycle
Instantiated at startup. Performs initial full scan, then hands off to IncrementalScanner and RepositoryWatcher.

## Future AI Integration
AI agents will use the resulting `RepositorySnapshot` to understand the state of the repository at a given time without manually reading all files.
