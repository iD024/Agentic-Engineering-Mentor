---
name: project-context-specification
description: >
  Specification for the Project Context, defining what it represents, who owns it, what it must contain,
  and what it must not contain. The AI must never modify Project Context without explicit user request.
---

# Project Context Specification

## Design Philosophy
The **Project Context** is the ONLY long-term document owned entirely by the human user.
It represents the user's intentions, goals, and constraints, not the AI's observations or current state of the codebase.

The human owns the project vision.
The AI owns the engineering process and repository state.
These must never be confused.

## Ownership Rules
- **Human Owned**: The user maintains the Project Context as the single source of truth for what the project is trying to achieve.
- **AI Read-Only**: The AI must **NEVER** automatically modify the Project Context. If the AI believes a goal or constraint should be updated based on new information, it must suggest the change to the user, never silently apply it.

## What Project Context MUST Contain
- **Project Name**: The formal name of the project.
- **Purpose**: Why does this project exist? What problem does it solve?
- **End Goal**: What does the final, successful state of this project look like?
- **Target Users**: Who is this built for?
- **Success Criteria**: Measurable or observable conditions that define success.
- **Learning Style**: The user's preferences for how they want to learn (e.g., first principles, high-level first, deep dives).
- **Preferred Mentoring Style**: How the user wants to be coached (e.g., strict, collaborative, hand-holding).
- **Technology Stack**: Hard choices regarding languages, frameworks, databases, and platforms.
- **Constraints**: Time, budget, performance, hardware, or API limitations.
- **Project Scope**: What features or functionalities are explicitly required.
- **Out of Scope**: What explicitly should NOT be built or addressed.
- **Estimated Difficulty**: The user's perceived complexity of the project.
- **Repository Status**: Brand-new, migrated, refactoring-phase, etc.
- **Expected Deliverable**: e.g., A production web app, embedded firmware, an SDK, a research paper, a hardware robot.
- **Project Type**: E.g., Web Application, Embedded Firmware, Compiler, Operating System, CLI Tool, Library, SDK, Robot, Game, Simulation, Desktop App, Mobile App, Research Project.

## What Project Context MUST NOT Contain
The Project Context must remain agnostic of transient state. It belongs elsewhere:
- **Repository structure**: Goes in Repository Context.
- **Architecture specifics**: Goes in Repository Context or Project Memory.
- **Current Milestone**: Goes in Engineering Curriculum / Session Manager.
- **Current Task**: Goes in Session Manager.
- **Current Files/Bugs**: Goes in Session Manager or Implementation Coach.
- **Current Decisions**: Goes in Project Memory.
