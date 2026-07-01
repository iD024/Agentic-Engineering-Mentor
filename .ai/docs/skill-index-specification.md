---
name: Skill Index Specification
description: Defines the categorization and lazy-loading mechanics for skills.
---

# Skill Index Specification

The `Skill Index` categorizes all installed skills within the workspace to prevent the Engineering Orchestrator from unnecessarily inspecting or loading every available skill. This optimization significantly reduces prompt bloat and improves scalability.

## Purpose
- Categorize skills into logical domains.
- Distinguish explicitly between **Installed Skills** and **Active Skills**.
- Enable the Orchestrator to load only the skills required for the current task.

## Categories

Skills are grouped into the following categories (but not limited to):
- Web
- Embedded
- Robotics
- Backend
- AI
- Game Development
- Workflow
- Infrastructure
- Quality
- Planning

## Mechanics: Installed vs Active
- **Installed Skills**: Everything available inside the workspace (`.ai/core/`, `.ai/profiles/`, `.ai/skills/`, etc.). Installed skills are indexed but not loaded into the context by default.
- **Active Skills**: Only the skills currently participating in reasoning. The Orchestrator chooses categories based on the user's request and loads only the required skills. Inactive skills consume zero prompt budget.

## Usage
- Upon receiving a user request, the Orchestrator consults the Skill Index.
- Categories relevant to the request are identified.
- Skills within those categories are transitioned from Installed to Active state and loaded into context.
- Once the task concludes, skills that are no longer needed are deactivated.
