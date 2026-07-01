---
name: Artifact Dependency Graph
description: Defines the explicit dependencies between workspace artifacts.
---

# Artifact Dependency Graph

The `Artifact Dependency Graph` explicitly defines the hierarchical dependencies between workspace artifacts. This ensures that context flows predictably from high-level, permanent concepts down to temporary, session-level details.

## Rule of Dependency

Every artifact must depend **only** on higher-level artifacts. Circular dependencies are strictly forbidden to maintain a clear synchronization path.

## The Hierarchy (Top to Bottom)

1. **Project Sources** & **Project Context** (Raw human inputs, vision, constraints)
   ↓
2. **Project Understanding** (Highest level AI synthesized truth)
   ↓
3. **Repository Knowledge** (Architecture, constraints, major modules)
   ↓
4. **Engineering Curriculum** (Learning paths guided by project goals)
   ↓
5. **Project Memory** (Learnings, past decisions, consolidated history)
   ↓
6. **Engineering Session** (Current temporary context, active tasks)
   ↓
7. **Workspace Status** (Lowest level: compiled runtime snapshot)

## Dependency Flow Examples

- **Project Sources/Context changes**: Invalidates Project Understanding.
- **Project Understanding changes**: Invalidates Repository Knowledge, Curriculum, and Project Memory.
- **Repository changes**: Updates Repository Knowledge. Does not strictly invalidate Project Understanding.
- **Session ends**: Updates Project Memory. Invalidates the Engineering Session.
- **Workspace Status Generation**: Pulls from all necessary higher-level artifacts to form the current runtime snapshot.

## Usage
- The `Workspace Synchronizer` uses this graph to propagate invalidations. If a higher-level artifact changes, the synchronizer knows exactly which downstream artifacts need to be refreshed or marked stale based on Workspace Events.
