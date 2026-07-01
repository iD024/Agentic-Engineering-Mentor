---
name: Context Flow
description: Explains how context flows downward from permanent goals to temporary sessions using Lazy Loading and Workspace Status.
---

# Context Flow

The Workspace OS v2 uses **Lazy Context Loading** and a strict **Artifact Dependency Graph** to ensure efficient context economy.

## Top-Down Flow
Context always flows downwards. Lower levels adapt to higher levels.

1. **Project Sources** / **Project Context**: The raw human input.
2. **Project Understanding**: The AI synthesized absolute truth.
3. **Repository Knowledge**: High-level structural architecture (never code summaries).
4. **Engineering Curriculum**: The learning roadmap.
5. **Project Memory**: Long-term finalized decisions and milestones.
6. **Engineering Session**: The temporary, active context.
7. **Workspace Status**: The compact runtime snapshot generated at every session start.

## Lazy Loading Rules
The `Engineering Orchestrator` avoids loading all these files at once.
- Only `Workspace Status` is loaded unconditionally to establish the State Machine phase and Session.
- Further artifacts are loaded on-demand depending on the user's request.
- `Repository Knowledge` is loaded for architectural queries.
- `Project Memory` is loaded for continuity and past decision queries.
