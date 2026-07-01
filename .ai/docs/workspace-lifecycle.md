---
name: workspace-lifecycle
description: High-level overview of how the workspace initializes, evolves, and concludes using the Workspace State Machine.
---

# Workspace Lifecycle

The Workspace OS v2 lifecycle is governed explicitly by the **Workspace State Machine** and driven by **Workspace Events**.

1. **Bootstrapping**: Initiated on a blank project or uninitialized repository. The `Project Bootstrap Manager` runs, triggers the `Project Understanding Engine` (drafting a `Project Context` if no sources exist), scaffolds the initial structure, and emits the `Project Created` event.
2. **Planning**: Triggered by `Milestone Started`. The goals are broken down.
3. **Architecture**: Focuses on structuring `Repository Knowledge` and making core design choices.
4. **Development**: Active feature implementation, heavily relying on Active Skills from the `Skill Index`.
5. **Debugging**: Focuses on resolving issues with high-priority domain skills.
6. **Testing**: Validating the implementation.
7. **Refactoring**: Improving code without changing behavior.
8. **Release & Maintenance**: Finalizing artifacts and stabilizing.
9. **Completed**: Reaching the end of the `Project Understanding` vision.

State transitions are communicated via events (e.g., `Feature Completed`, `Session Ended`), causing the infrastructure skills to incrementally update dependencies in the `Artifact Dependency Graph` without full system refreshes.
