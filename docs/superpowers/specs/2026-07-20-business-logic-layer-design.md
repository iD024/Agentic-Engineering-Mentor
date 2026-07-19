# Business Logic Layer Design

## Overview
This document outlines the architecture and implementation details for the Business Logic Layer of the Pedagogical TUI Multiplexer. The goal is to bring the "empty shell" UI to life by implementing dynamic project bootstrapping, LLM-powered Socratic mentoring, and a properly configured agentic CLI Pane.

## Components

### 1. Database Schema Extensions
The SQLite database (`Database.ts`) will be expanded to include tables for tracking project progress and AI interactions:
- **`Versions`**: Tracks the overall project versions (`id`, `project_name`).
- **`Sessions`**: Tracks active learning milestones (`id`, `version_id`, `objective_text`, `status`).
- **`Socratic_Logs`**: Stores the interactions with the LLM (`id`, `session_id`, `ast_constraint`, `escalation_level`, `hint_text`).

### 2. Project Bootstrapper
A new initialization script (`Bootstrapper.ts`) will run when the application starts.
- It will read a local `project-context.md` file.
- We will use YAML frontmatter (parsed via `gray-matter`) to strictly define milestones and AST constraints, while allowing standard markdown for description.
- Upon parsing, it seeds the `Versions` and `Sessions` tables.
- It will automatically fetch the first active objective and push it to the Zustand store so Pane 3 displays the actual project goal.

### 3. Socratic LLM Integration
We will integrate the Google GenAI SDK (`@google/genai`) to act as the Socratic Mentor.
- **Service (`SocraticMentor.ts`)**: Exports an async function that accepts the current objective, the failed AST constraint, and the Escalation Level.
- **System Prompt**: The LLM is strictly instructed to act as a mentor, generating short text hints based *only* on the Escalation Level. It is explicitly forbidden from outputting functional code.
- **XState Wiring**: In `SocraticMachine.ts`, the `hint` state will invoke this LLM service. The generated hint will be logged in `Socratic_Logs` and pushed to the Zustand store for rendering in Pane 3.

### 4. AI-CLI Auto-Launcher (Pane 2)
The raw bash shell in Pane 2 will be replaced with an auto-launching AI agent (e.g., `agy`).
- The `node-pty` spawn configuration in `App.tsx` will be updated to: `['bash', ['-l', '-c', 'exec agy']]`.
- Using a login shell wrapper ensures that nested AI tools inherit the user's environment variables (like `npm` or `brew`).
- The `exec` command replaces the shell process entirely, guaranteeing that the pane closes cleanly when the AI tool exits.

## Trade-offs & Decisions
- **gray-matter vs Regex**: We chose YAML frontmatter parsing for `project-context.md` to ensure robust, deterministic extraction of AST constraints rather than brittle markdown regex parsing.
- **Google GenAI SDK**: Selected for reliable system instructions and seamless integration in the current environment.
- **PTY Login Shell**: Opted to wrap the execution in `bash -l` rather than directly spawning the binary to prevent missing environment path issues.

## Testing Strategy
For initial validation, we will create a sample `project-context.md` defining the requirements for a standard "Todo App". We will verify that:
1. The UI boots with the correct objective.
2. Saving an invalid AST triggers a Socratic hint from the LLM.
3. Pane 2 successfully spawns the AI CLI with full environment access.
