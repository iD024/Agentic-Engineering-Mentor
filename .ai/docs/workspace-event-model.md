---
name: Workspace Event Model Specification
description: Defines the Workspace Events for event-driven orchestration.
---

# Workspace Event Model Specification

The `Workspace Event Model` transforms the architecture from a continuous execution loop into an Event-Driven Architecture. Skills should react to events instead of constantly executing, minimizing unnecessary work and improving scalability.

## Purpose
- Prevent prompt bloat from running checks that haven't changed.
- Decouple components (e.g., memory updates trigger independently of curriculum checks).
- Provide explicit hooks for skills and orchestrators to respond to.

## Core Events

- **Workspace Loaded**: Fired when the workspace initializes. Triggers generation of Workspace Status.
- **Project Created**: Fired when a new project is bootstrapped.
- **Project Context Updated**: Fired when core goals or principles change.
- **Repository Changed**: Fired upon significant file structure or architectural changes. Triggers Repository Knowledge updates.
- **Profile Added**: Fired when a new mentor profile is loaded.
- **Milestone Started**: Fired when work begins on a new milestone. Triggers Planning state.
- **Milestone Completed**: Fired when all milestone goals are verified.
- **Feature Completed**: Fired when a specific feature ticket is closed.
- **Architecture Changed**: Fired when design patterns or major dependencies shift.
- **Session Started**: Fired at the beginning of an engineering session.
- **Session Ended**: Fired when the session is closed out. Triggers session memory updates.
- **Memory Updated**: Fired when project memory consolidates new learnings.
- **Learning Progress Updated**: Fired when the user completes a curriculum step.

## Usage
- The `Workspace Synchronizer` relies on these events to determine what actually requires updating.
- Infrastructure skills listen for specific events to trigger their prompt logic.
