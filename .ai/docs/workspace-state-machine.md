---
name: Workspace State Machine Specification
description: Defines the explicit Workspace State Machine and its phases.
---

# Workspace State Machine Specification

The `Workspace State Machine` provides an explicit lifecycle model for engineering tasks and milestones. By tracking the active state of the workspace, the system can dynamically adjust session behavior, workflow orchestration, engineering curriculum focus, review style, and engineering guidance.

## Purpose
- Provide deterministic context for where the user is in the development lifecycle.
- Tailor the Orchestrator's behavior to the current phase of work.
- Influence which skills are categorized as Active or Installed.

## States

The Workspace State Machine follows this general flow:

1. **Planning**: Defining requirements, architecture, and task breakdowns.
2. **Bootstrapping**: Setting up initial boilerplate, repositories, and dependencies.
3. **Architecture**: Establishing patterns, core modules, and system design.
4. **Development**: Active coding and feature implementation.
5. **Debugging**: Investigating issues, reading logs, and testing hypotheses.
6. **Testing**: Running unit, integration, and end-to-end tests to ensure quality.
7. **Refactoring**: Improving code structure and efficiency without changing external behavior.
8. **Release**: Preparing artifacts, updating documentation, and deploying.
9. **Maintenance**: Monitoring, fixing minor bugs, and applying updates.
10. **Completed**: Goal achieved; winding down the session or milestone.

## Usage
- The `Workspace Status` holds the current active state.
- The Orchestrator reads the state to determine context loading strategies (e.g., loading Architecture context during the Architecture phase, but skipping it during active Debugging).
- State transitions are triggered by Workspace Events (e.g., `Milestone Started` moves state to Planning).
