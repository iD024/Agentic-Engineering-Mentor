# Pedagogical TUI Multiplexer Design Spec

## Overview
A local, CLI-based engineering mentor designed to combat "cognitive offloading" by acting strictly as a "Navigator" (Socratic mentor). It will use a deterministic, "Debug-First" terminal multiplexer approach that parses structural constraints and provides Socratic hints when structural requirements are unmet.

## Core Purpose & User Workflow
- The user launches the app and sees a 3-pane terminal UI.
- **Pane 1 (Native Editor)**: User writes code natively using their preferred `$EDITOR`.
- **Pane 2 (Execution Shell)**: Standard shell commands or external AI agents (like Claude Code or Antigravity CLI). Must be perfectly sandboxed to handle alternate buffer modes and keybindings without corrupting the parent UI.
- **Pane 3 (Socratic Mentor)**: Displays session objectives, AST diagnostic states, and text-based hints using a state machine.
- An atomic file watcher triggers on file save.
- AST is parsed in an isolated background process against pedagogical constraints.
- If constraints fail, an XState-driven state machine logs the mistake to a local SQLite DB and escalates a Socratic hint in Pane 3.

## Architecture & Technical Stack

### Runtime & Core UI
- **Runtime**: Node.js (TypeScript)
- **UI Framework**: React Ink (for declarative Flexbox terminal rendering).
- **Terminal Embedding**: `node-pty` (OS processes) bridged with `@xterm/headless` (ingests ANSI bytes, maintains virtual grid state to prevent UI corruption).

### Input Routing
- **Approach**: Raw Stdin Interception (Recommended). 
- `process.stdin.setRawMode(true)` will be set globally.
- A central `InputRouter` will intercept raw bytes from `stdin`.
- A Tmux-style prefix chord (e.g., `Ctrl+B` + `[1,2,3]`) will cycle focus between panes.
- If a PTY pane has focus, the raw hex bytes are piped directly to `ptyProcess.write()`, ensuring native tools receive their exact keybindings without Ink swallowing them.

### State Management & Persistence
- **Global UI State**: Zustand (synchronizes the current objective and active hint to the React frontend).
- **Pedagogical Loops**: XState (machine with states: `IDLE` -> `VALIDATING` -> `HINT/SUCCESS`).
- **Persistence**: Local SQLite DB tracking mistake logs, milestones, and hint escalation rates.

### AST Validation Pipeline
- **AST Parsing**: `tree-sitter` for incremental CST parsing.
- **Isolation**: Will run in isolated child processes (`child_process.fork`) to prevent V8 memory leaks.
- **Eventing/Watching**: `chokidar` for file watching, coupled with a local IPC Pub/Sub Event Bus to decouple backend logic from the React Ink frontend.

## Implementation Phases

### Phase 1: Input Routing & TUI Foundation
- Initialize Node.js TypeScript project.
- Global `process.stdin.setRawMode(true)`.
- Centralized `InputRouter` for `Ctrl+B` prefix chords.
- React Ink Layout Matrix (60/40 split with 3 Panes).

### Phase 2: The Emulation Bridge & Nested TUI Support
- `node-pty` + `@xterm/headless` integration.
- Throttled React rendering hook (`useTerminalGrid`) pulling virtual grid state at ~60 FPS.
- Handle Alt-Screen mode and hotkey sandboxing.
- `SIGWINCH` listener for recalculating Flexbox boundaries.

### Phase 3: Deterministic Scanning Pipeline
- `chokidar` file watcher.
- `child_process.fork` worker for `tree-sitter`.
- IPC bridge for AST validation via S-expression queries. Graceful teardown on `SIGINT`.

### Phase 4: Socratic State Machine
- SQLite DB schema for tracking milestones, metrics, failure logs.
- XState machine (`IDLE` -> `VALIDATING` -> `HINT/SUCCESS`).
- Hint Escalation algorithm (Level 1: Inquiry -> 2: Highlighting -> 3: Analogy -> 4: Directive).
- Zustand store sync to trigger reactive updates in Pane 3.
