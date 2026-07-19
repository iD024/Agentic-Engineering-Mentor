# Pedagogical TUI Multiplexer - Design Document

## 1. Overview
The "Pedagogical TUI Multiplexer" is a local, CLI-based AI engineering mentor designed to combat "cognitive offloading" in software education. It acts strictly as a "Navigator" (Socratic mentor) and never as a "Driver" (it will never generate functional implementation code). The environment provides a zero-latency native editor experience while evaluating structural constraints on the user's code using an AST-based pedagogical engine.

## 2. Core Architecture & Data Flow

### 2.1 The Emulation Bridge (UI & Terminal)
- **UI Framework:** React Ink, utilizing a 3-pane Flexbox layout.
  - Pane 1 (60% W, 100% H): "Native Editor" (node-pty mapped to `$EDITOR`).
  - Pane 2 (40% W, 30% H): "Execution Shell" (node-pty mapped to `bash/zsh`).
  - Pane 3 (40% W, 70% H): "Socratic Mentor" (Native React Ink components).
- **Zero-Latency Input Routing:** `process.stdin.setRawMode(true)` is set globally. A singleton `InputRouter` intercepts all keystrokes.
  - A Tmux-style prefix chord (e.g., `Ctrl+B`) is used to toggle pane focus.
  - All other keystrokes are piped as raw Buffer streams directly to the active `node-pty` instance.
- **PTY to React Integration (`@xterm/headless`):** 
  - To prevent React's reconciler from breaking on raw ANSI escape codes, stdout from `node-pty` is piped into `@xterm/headless` instances.
  - `@xterm/headless` absorbs ANSI codes and maintains a clean 2D virtual grid of characters/colors.
  - A custom React hook (`useTerminalGrid`) polls this grid at ~60 FPS and renders it using basic Ink `<Text>` components.
- **Resize Handling:** On `SIGWINCH`, the 60fps React render loop pauses. New Flexbox boundaries are calculated, PTY and xterm instances are resized, and the render loop resumes.

### 2.2 The Pedagogical Engine (Backend Logic)
- **File Watching:** `chokidar` monitors the workspace. File saves are debounced (~300ms) to ensure atomic write compatibility (e.g., Neovim) before emitting a `FILE_SAVED` event.
- **AST Worker Isolation:** CST parsing is handled by `tree-sitter`. To avoid V8 memory leaks from native C++ bindings, parsing executes in a completely isolated Node.js child process (`child_process.fork`). The main thread sends the file path and S-expression AST constraints via IPC, receiving an asynchronous Pass/Fail payload.
- **State Management (XState + Zustand):**
  - **XState** acts as the strict "Socratic State Machine". It governs progression through course objectives (e.g., `IDLE` -> `VALIDATING` -> `SUCCESS` or `HINT_LEVEL`).
  - **Manifest-Driven:** AST constraints and Hint text are dynamically loaded from an external JSON/YAML course manifest (e.g., for "AssemblyLab").
  - **Hint Escalation:** If an AST constraint fails, XState increments a failure counter, logs the mistake to SQLite, and transitions to escalating hint levels (Inquiry -> Constraint Highlighting -> Analogical Mapping -> Direct Directive).
  - **Zustand:** XState syncs its snapshot (current objective, failure count, active hint) to a global Zustand store. React Ink (Pane 3) simply subscribes to this store to render mentor text.
- **Data Persistence:** A local SQLite database maintains schemas for Versions, Sessions, Socratic_Logs, and Metrics to ensure progression is saved and analytics are tracked.

## 3. Phase Rollout Strategy

1. **Phase 1: Input Routing & TUI Foundation** - Setup React Ink, Flexbox, and the `InputRouter` with global hotkeys.
2. **Phase 2: The Emulation Bridge** - Integrate `node-pty` and `@xterm/headless` with the React render loop and `SIGWINCH` resize handling.
3. **Phase 3: Deterministic Scanning Pipeline** - Implement `chokidar`, `child_process.fork`, `tree-sitter`, and IPC. Ensure all child processes are gracefully killed on exit.
4. **Phase 4: Socratic State Machine** - Initialize SQLite, build the XState progression logic, the Hint Escalation algorithm, and wire the manifest loader to Pane 3.
