---
name: Workspace Status Specification
description: Defines the compact runtime snapshot of the workspace.
---

# Workspace Status Specification

The `Workspace Status` is a lightweight runtime artifact designed to provide a compact snapshot of the engineering workspace. It is always generated during the atomic Workspace Initialization sequence and becomes the canonical runtime snapshot for all future operations. Instead of loading every context document during startup, the workspace synchronizer first generates or refreshes the Workspace Status. This serves as the primary runtime object, ensuring lower context usage and faster synchronization.

## Purpose
- Provide the minimum information required to resume work.
- Act as the entry point for determining which additional context files (if any) need to be lazily loaded.
- Capture the current state of the workspace explicitly.

## Structure

The Workspace Status must include the following elements:

1. **Workspace Initialized**: Boolean indicating if the atomic initialization transaction is fully committed (`workspace.initialized`).
2. **Project Name**: The identifier for the current project.
3. **Current Version**: The active version or iteration being developed.
4. **Current Milestone**: The current high-level goal being worked towards.
5. **Current Task**: The specific objective for the current session.
6. **Workspace State**: The current phase in the Workspace State Machine (e.g., Planning, Development, Debugging).
7. **Active Profiles**: The mentor profiles currently participating in the session.
8. **Active Skills**: The subset of skills from the Skill Index currently loaded and active.
9. **Current Session Status**: Summary of what is happening in the current session.
10. **Repository Status**: High-level indicator of repository health or recent changes.
11. **Context Freshness**: Timestamps or indicators denoting when context artifacts (e.g., Project Understanding) were last verified.
12. **Current Learning Stage**: The user's active stage in the Engineering Curriculum.
13. **Pending Events**: Any unresolved Workspace Events awaiting action.

## Usage
- **Synchronization**: Generated or refreshed before any other context is loaded.
- **Lazy Loading**: Examined to determine if deeper context (like Project Memory or Curriculum) is required based on the user's prompt.
- **Dependency**: Depended upon by the Engineering Session; depends on higher-level artifacts like Project Understanding and Project Memory.
