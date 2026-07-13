# Incremental Scanning

## Ownership
Repository Layer (`IncrementalScanner`, `FileChangeDetector`, `RepositoryWatcher`).

## Responsibilities
- Use `chokidar` to detect file changes.
- Diff snapshots and only reparse changed files.
- Publish `RepositoryChanged` events to the EventBus.

## Future AI Integration
Allows the AI agent to maintain a perfectly up-to-date mental model of the codebase even as the user (or the AI itself) makes edits.
