# Business Logic Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic project bootstrapping, LLM-powered Socratic mentoring, and configure the agentic CLI Pane.

**Architecture:** We will extend the existing SQLite database to store Versions, Sessions, and Socratic Logs. A new Bootstrapper will read `project-context.md` (parsed via gray-matter) to seed the database and Zustand store. The XState machine will invoke a new `SocraticMentor` service leveraging `@google/genai` to generate hints instead of dummy text. Finally, Pane 2 will be reconfigured to spawn `agy` using a login shell.

**Tech Stack:** TypeScript, SQLite, `@google/genai`, `gray-matter`, node-pty, Jest.

## Global Constraints
- Use Google GenAI SDK (`@google/genai`) for LLM integration.
- Use `gray-matter` for parsing `project-context.md`.
- Socratic Mentor is explicitly forbidden from outputting functional code.
- Pane 2 PTY wrapper must be `['bash', ['-l', '-c', 'exec agy']]`.

---

### Task 1: Add Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**
```bash
npm install @google/genai gray-matter
npm install --save-dev @types/gray-matter
```

- [ ] **Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add @google/genai and gray-matter dependencies"
```

### Task 2: Database Schema Extensions

**Files:**
- Modify: `src/Database.ts`
- Create: `tests/Database.test.ts`

**Interfaces:**
- Produces: `Database.init()` creates `Versions`, `Sessions`, `Socratic_Logs` tables.
- Produces: `Database.createSession(versionId: number, objective: string)`
- Produces: `Database.logSocraticInteraction(sessionId: number, constraint: string, level: string, hint: string)`

- [ ] **Step 1: Write the failing test**
```typescript
// tests/Database.test.ts
import { Database } from '../src/Database';
import * as fs from 'fs';

describe('Database', () => {
    let db: Database;
    
    beforeEach(async () => {
        if (fs.existsSync('test.sqlite')) fs.unlinkSync('test.sqlite');
        db = new Database();
        await db.init('test.sqlite');
    });

    afterEach(async () => {
        if (fs.existsSync('test.sqlite')) fs.unlinkSync('test.sqlite');
    });

    it('should create session and log socratic interaction', async () => {
        await (db as any).db.run('INSERT INTO Versions (project_name) VALUES (?)', ['Test Project']);
        const versionId = 1;
        const sessionId = await db.createSession(versionId, 'Test Objective');
        expect(sessionId).toBe(1);
        
        await db.logSocraticInteraction(sessionId, 'AST constraint', 'Inquiry', 'Test hint');
        const count = await (db as any).db.get('SELECT COUNT(*) as count FROM Socratic_Logs');
        expect(count.count).toBe(1);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest tests/Database.test.ts`
Expected: FAIL with "db.createSession is not a function"

- [ ] **Step 3: Write minimal implementation**
```typescript
// src/Database.ts
import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';

export class Database {
    public db: SqliteDatabase | null = null; // Changed to public for testing access

    async init(filename: string = 'pedagogy.sqlite') {
        this.db = await open({
            filename,
            driver: sqlite3.Database
        });

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS failure_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_path TEXT,
                error_msg TEXT
            );
            CREATE TABLE IF NOT EXISTS Versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_name TEXT
            );
            CREATE TABLE IF NOT EXISTS Sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id INTEGER,
                objective_text TEXT,
                status TEXT DEFAULT 'ACTIVE',
                FOREIGN KEY(version_id) REFERENCES Versions(id)
            );
            CREATE TABLE IF NOT EXISTS Socratic_Logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER,
                ast_constraint TEXT,
                escalation_level TEXT,
                hint_text TEXT,
                FOREIGN KEY(session_id) REFERENCES Sessions(id)
            );
        `);
    }

    async logFailure(filePath: string, errorMsg: string) {
        if (!this.db) return;
        await this.db.run(
            'INSERT INTO failure_logs (file_path, error_msg) VALUES (?, ?)',
            [filePath, errorMsg]
        );
    }

    async getFailureCount(filePath: string): Promise<number> {
        if (!this.db) return 0;
        const result = await this.db.get(
            'SELECT COUNT(*) as count FROM failure_logs WHERE file_path = ?',
            [filePath]
        );
        return result?.count || 0;
    }

    async createSession(versionId: number, objective: string): Promise<number> {
        if (!this.db) throw new Error('DB not initialized');
        const result = await this.db.run(
            'INSERT INTO Sessions (version_id, objective_text) VALUES (?, ?)',
            [versionId, objective]
        );
        return result.lastID!;
    }

    async logSocraticInteraction(sessionId: number, constraint: string, level: string, hint: string) {
        if (!this.db) return;
        await this.db.run(
            'INSERT INTO Socratic_Logs (session_id, ast_constraint, escalation_level, hint_text) VALUES (?, ?, ?, ?)',
            [sessionId, constraint, level, hint]
        );
    }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest tests/Database.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/Database.ts tests/Database.test.ts
git commit -m "feat: add Versions, Sessions, and Socratic_Logs tables to Database"
```

### Task 3: Socratic Mentor Service

**Files:**
- Create: `src/SocraticMentor.ts`
- Create: `tests/SocraticMentor.test.ts`

**Interfaces:**
- Produces: `async function generateHint(objective: string, constraint: string, level: string): Promise<string>`

- [ ] **Step 1: Write the failing test**
```typescript
// tests/SocraticMentor.test.ts
import { generateHint } from '../src/SocraticMentor';
import { GoogleGenAI } from '@google/genai';

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: jest.fn().mockResolvedValue({ text: 'Mock hint generated' })
        }
      };
    })
  };
});

describe('SocraticMentor', () => {
    it('should generate a hint based on objective, constraint and level', async () => {
        const hint = await generateHint('Fix Syntax', 'Missing bracket', 'Inquiry');
        expect(hint).toBe('Mock hint generated');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx jest tests/SocraticMentor.test.ts`
Expected: FAIL with "generateHint is not a function"

- [ ] **Step 3: Write minimal implementation**
```typescript
// src/SocraticMentor.ts
import { GoogleGenAI } from '@google/genai';

export async function generateHint(objective: string, constraint: string, level: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        return \`[Fallback] Hint for \${level}: Please review \${constraint}\`;
    }

    const ai = new GoogleGenAI({});
    const prompt = \`Objective: \${objective}\\nFailed Constraint: \${constraint}\\nEscalation Level: \${level}\\nProvide a hint.\`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: "You are a Socratic Mentor. You must generate a short text hint based ONLY on the Escalation Level. It is strictly forbidden from outputting actual functional application code. Keep it brief."
        }
    });

    return response.text || "Hint generation failed.";
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npx jest tests/SocraticMentor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/SocraticMentor.ts tests/SocraticMentor.test.ts
git commit -m "feat: add SocraticMentor service for LLM hints"
```

### Task 4: SocraticMachine Wiring

**Files:**
- Modify: `src/SocraticMachine.ts`

**Interfaces:**
- Consumes: `generateHint` from `SocraticMentor.ts`
- Consumes: `logSocraticInteraction` from `Database.ts`

- [ ] **Step 1: Write minimal implementation**
```typescript
// In src/SocraticMachine.ts:
// 1. Add import at the top
import { generateHint } from './SocraticMentor';

// 2. Locate the 'hint' state and replace its invoke and onDone blocks with:
            hint: {
                invoke: {
                    id: 'generateAndLogHint',
                    src: async (context) => {
                        await db.logFailure(context.filePath, context.errorMsg || 'Unknown Error');
                        const failureCount = await db.getFailureCount(context.filePath);
                        
                        let level = 'Inquiry';
                        if (failureCount === 2) level = 'Highlighting';
                        else if (failureCount === 3) level = 'Analogy';
                        else if (failureCount >= 4) level = 'Directive';

                        const objective = usePedagogicalStore.getState().objective;
                        const hintText = await generateHint(objective, context.errorMsg || 'Syntax Error', level);
                        
                        // Assume session ID 1 for now
                        await db.logSocraticInteraction(1, context.errorMsg || 'Syntax Error', level, hintText);

                        return { failureCount, hintText };
                    },
                    onDone: {
                        actions: [
                            assign({ failureCount: (_, event: any) => event.data.failureCount }),
                            (_, event: any) => usePedagogicalStore.getState().setActiveHint(event.data.hintText)
                        ]
                    }
                },
                entry: () => usePedagogicalStore.getState().setStatus('HINT'),
                on: { 
                    FILE_SAVED: {
                        target: 'validating',
                        actions: assign({ filePath: (_, event: any) => event.filePath })
                    }
                }
            },

// 3. Locate the service.onTransition block. Remove the logic inside 'if (state.matches('hint'))'.
// Change it to:
    service.onTransition((state) => {
        const store = usePedagogicalStore.getState();
        if (state.matches('idle')) store.setStatus('IDLE');
        if (state.matches('validating')) store.setStatus('VALIDATING');
        
        if (state.matches('success')) {
            store.setActiveHint("Great job! You fixed it.");
        } else if (!state.matches('hint')) { 
            // Clear hint only when transitioning away from hint
            store.setActiveHint(null);
        }
    });
```

- [ ] **Step 2: Commit**
```bash
git add src/SocraticMachine.ts
git commit -m "feat: wire SocraticMachine to use LLM hints via SocraticMentor"
```

### Task 5: Project Bootstrapper

**Files:**
- Create: `project-context.md`
- Create: `src/Bootstrapper.ts`
- Modify: `src/index.tsx`

**Interfaces:**
- Produces: `async function bootstrapProject(db: Database)`

- [ ] **Step 1: Write the `project-context.md` file**
```bash
cat << 'EOF' > project-context.md
---
milestones:
  - objective: "Create a Todo model"
    constraint: "Must export interface Todo"
  - objective: "Implement Todo list"
    constraint: "Must have ul element"
---
# Todo App Requirements

Build a standard Todo App using React.
EOF
```

- [ ] **Step 2: Write minimal implementation for Bootstrapper**
```typescript
// src/Bootstrapper.ts
import * as fs from 'fs';
import matter from 'gray-matter';
import { Database } from './Database';
import { usePedagogicalStore } from './store';

export async function bootstrapProject(db: Database) {
    if (!fs.existsSync('project-context.md')) return;

    const fileContent = fs.readFileSync('project-context.md', 'utf-8');
    const parsed = matter(fileContent);
    const milestones = parsed.data.milestones || [];

    await db.db!.run('INSERT INTO Versions (project_name) VALUES (?)', ['Todo App']);
    const result = await db.db!.get('SELECT last_insert_rowid() as id');
    const versionId = result.id;

    for (const ms of milestones) {
        await db.createSession(versionId, ms.objective);
    }

    if (milestones.length > 0) {
        usePedagogicalStore.getState().setObjective(milestones[0].objective);
    }
}
```

- [ ] **Step 3: Wire into index.tsx**
```typescript
// In src/index.tsx
// Add import:
import { bootstrapProject } from './Bootstrapper';

// In bootstrap() after await db.init();
    await bootstrapProject(db);
```

- [ ] **Step 4: Commit**
```bash
git add project-context.md src/Bootstrapper.ts src/index.tsx
git commit -m "feat: implement Bootstrapper to parse project-context.md"
```

### Task 6: AI-CLI Auto-Launcher (Pane 2)

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Node OS and PTY APIs

- [ ] **Step 1: Update minimal implementation**
```typescript
// In src/App.tsx, locate the executionPty setup:
const executionPty = pty.spawn(shell, [], { cols: 40, rows: 10, name: 'xterm-256color', env: process.env as any });

// Change it to:
const executionArgs = os.platform() === 'win32' ? [] : ['-l', '-c', 'exec agy'];
const executionPty = pty.spawn(shell, executionArgs, { cols: 40, rows: 10, name: 'xterm-256color', env: process.env as any });
```

- [ ] **Step 2: Commit**
```bash
git add src/App.tsx
git commit -m "feat: update Pane 2 to auto-launch agy via login shell"
```
