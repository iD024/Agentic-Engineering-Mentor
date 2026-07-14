---
name: Architecture Overview
description: High-level overview of the Antigravity Engineering Mentor v2 Architecture.
---

# Architecture Overview (v2)

The Antigravity Engineering Mentor is a **Workspace-Based Engineering Operating System**. 
It operates strictly as a prompt-only, workspace-centric ecosystem running inside an LLM with filesystem access.

## Core Tenets
- **The Workspace is Permanent**: Chats are temporary. State is saved into the `.ai/` directory.
- **Human Owns Vision**: The `Project Context` is immutable by the AI.
- **AI Owns Execution**: Architecture, debugging, and memory are managed by the AI.
- **Lazy Context Loading**: "Load only what is needed". Prompt budget is fiercely protected.
- **Event-Driven**: Infrastructure skills respond to `Workspace Events` rather than constantly executing.
- **Workspace Status First**: The `Workspace Status` is the lightweight runtime snapshot generated at startup, driving the `Workspace State Machine` and `Skill Index` routing.

## Major Components
- **Workspace Synchronizer**: Generates the `Workspace Status` and invalidates stale artifacts based on events.
- **Engineering Orchestrator**: The central router. Uses the `Skill Index` to lazily load `Active Skills` while leaving `Installed Skills` inactive.
- **Repository Knowledge Manager**: Maintains high-level architectural knowledge (never code summaries).
- **Project Memory Manager**: Compresses long-term engineering decisions.
- **Project Bootstrap Manager**: Initializes new workspaces and establishes the dependency graph.
