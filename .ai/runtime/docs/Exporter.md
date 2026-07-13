# Export Pipeline

## Why it exists

SQLite is the authoritative source of truth, but the Engineering Workspace
contract requires a human-readable `.ai/workspace.json` for Git history,
human inspection, and external tooling. The exporter bridges these two.

## Design

### WorkspaceExporter
Reads the current workspace from StateManager and writes `.ai/workspace.json`.

### JsonExporter
Serializes JSON to disk with pretty-printing. Separating this concern from
WorkspaceExporter means future exporters (YAML, TOML) can reuse the same
directory-creation logic.

## When export runs

- Automatically: on every `WorkspaceSaved` event (wired in `Runtime.start()`)
- On shutdown: `Runtime.stop()` triggers a final export before closing

## Important

workspace.json is a SNAPSHOT, not a source of truth.
The runtime never reads workspace.json after the initial import.
workspace.json exists for Git history and human operators only.
