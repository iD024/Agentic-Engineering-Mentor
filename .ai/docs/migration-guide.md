---
name: Migration Guide (v1 to v2)
description: Instructions for migrating an existing Antigravity Engineering Mentor workspace from v1 to v2.
---

# Migration Guide: v1 to v2

Workspace OS v2 introduces Lazy Context Loading, Workspace Events, and a strict Skill Index to reduce prompt bloat and improve context economy. Follow these steps to migrate an existing `.ai/` workspace.

## 1. Replace Repository Context with Repository Knowledge
- **Action**: Delete `.ai/context/repository-context.md`.
- **Action**: The system will automatically generate `repository-knowledge.md` when the `Repository Changed` event is fired.
- **Why**: v2 avoids summarizing source code. Repository Knowledge strictly maps architecture and major modules.

## 2. Update Skill Metadata
- **Action**: Open any custom skills you have created in `.ai/skills/` or `.ai/profiles/`.
- **Action**: Add the `Category: [Domain]` field to the frontmatter.
- **Why**: The `Engineering Orchestrator` now uses the `Skill Index` to lazily load active skills based on Category. Skills without a category may not be routed correctly.

## 3. Embrace Workspace Status
- **Action**: Do not assume all context documents are loaded in every prompt.
- **Why**: v2 relies on `Workspace Status` as the primary runtime anchor. Ensure your custom skills explicitly request the `Engineering Orchestrator` to load Project Memory or Curriculum if they strictly depend on them.

## 4. Familiarize with Workspace Events
- v2 is event-driven. If you write new infrastructure skills, they should listen for events (e.g., `Feature Completed`, `Session Ended`) rather than constantly executing on every user message.

---

# Migration Guide: Project Understanding System

The Workspace OS has upgraded to use the **Project Understanding System**. This means the AI now relies on a synthesized `Project Understanding` artifact rather than relying solely on a human-written `Project Context`.

## For Existing Workspaces

**You do not need to do anything.**

Existing projects that rely entirely on `.ai/context/project-context.md` will continue to work seamlessly. 

Here is what happens under the hood during the first synchronization after this upgrade:
1. The **Workspace Synchronizer** will boot up and notice `project-understanding.md` is missing.
2. It will look for `Project Sources` and legacy `Project Context`.
3. Finding your existing `project-context.md`, it will treat it as a primary source.
4. The **Project Understanding Engine** will run in the background, read your `project-context.md`, and generate `.ai/context/project-understanding.md`.
5. The workspace will then resume normally, using the newly generated understanding.

## For New Workspaces

You now have three ways to start a project:

1. **Provide a complete `project-context.md`**: The legacy way. It still works perfectly.
2. **Upload existing documents**: Create `.ai/context/project-sources/` and drop in your PDFs, READMEs, diagrams, specifications, etc. The AI will build `Project Understanding` automatically.
3. **Start with nothing**: The AI will notice there are no sources and guide you through an initialization conversation to draft a context for you.

## Why this change?
To reduce onboarding friction. The human provides information in whatever format they have (the AI learns from it), and the AI builds understanding. You should never be forced to rewrite existing documentation just for the AI.
