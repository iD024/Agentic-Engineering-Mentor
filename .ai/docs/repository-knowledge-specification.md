---
name: Repository Knowledge Specification
description: Defines the high-level architectural knowledge of the repository.
---

# Repository Knowledge Specification

`Repository Knowledge` replaces the old Repository Context. It is explicitly NOT a code summary. Instead, it captures the high-level architecture, modules, and strategies of the repository. When implementation details are required, the AI must inspect source files directly rather than relying on summaries.

## Purpose
- Maintain a high-level map of the repository's architecture.
- Prevent duplication of source code in prompt context.
- Provide clear boundaries and entry points for engineering tasks.

## Structure

Repository Knowledge contains the following elements:
1. **Repository Map**: High-level structure of the workspace.
2. **Major Modules**: The primary logical components of the system.
3. **Folder Responsibilities**: What each directory is responsible for.
4. **Entry Points**: The main execution paths or application entry files.
5. **Important Files**: Critical configuration, schema, or core logic files.
6. **Architectural Style**: The overarching design pattern (e.g., MVC, Microservices, Event-Driven).
7. **Naming Conventions**: Established rules for naming variables, files, and classes.
8. **Build System**: How the project is compiled or built.
9. **Testing Strategy**: How quality is assured (e.g., unit tests, integration tests).
10. **Known Integration Points**: Where the system interacts with external services or APIs.

## Usage
- Loaded lazily when architectural or structural understanding is required.
- Refreshed only when a Workspace Event indicates a significant repository change.
- **Dependency**: Depends on the Project Context.
