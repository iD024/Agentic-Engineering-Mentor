# Folder Structure

The Engineering Workspace Runtime v2 is isolated entirely within the `.ai/runtime/` directory to ensure it is self-contained and independent from the surrounding repository workspace.

```text
.ai/runtime/
├── src/
│   ├── bootstrap/
│   │   └── Bootstrap.ts            # Entry orchestrator — composition root
│   ├── core/
│   │   ├── config/                 # Env loading, Zod validation, immutable access
│   │   ├── di/                     # Service container and typed tokens
│   │   ├── events/                 # Synchronous lifecycle events
│   │   ├── health/                 # Extensible health monitoring
│   │   ├── lifecycle/              # Startup/shutdown ordering, signal handling
│   │   └── logger/                 # LoggerFactory and ConsoleLogger implementations
│   ├── interfaces/                 # Abstractions (ILogger, IKernel, etc.)
│   ├── kernel/                     # Kernel coordinator and RuntimeState enum
│   ├── runtime/                    # The application entry logic (Runtime.ts)
│   ├── shared/                     # Shared utilities across domains
│   ├── types/                      # Data models (RuntimeConfig, Context, etc.)
│   └── main.ts                     # Executable entry point
├── tests/                          # Vitest test suites mirroring src/ structure
├── docs/                           # Runtime documentation (Architecture, Startup, etc.)
├── package.json                    # Scoped runtime dependencies
├── tsconfig.json                   # TypeScript compiler configuration
├── vitest.config.ts                # Test runner configuration
├── eslint.config.js                # Linting rules
├── .prettierrc                     # Formatting rules
└── .env.example                    # Template environment variables
```

## Key Principles
- **Interfaces over implementations**: The `interfaces/` folder is the primary integration point. Domains depend on abstractions defined here.
- **No root leakage**: No runtime-specific configuration (like `.prettierrc` or `tsconfig.json`) leaks into the parent workspace root.
- **Future independent publication**: By remaining isolated in this structure, `.ai/runtime` is positioned to be easily extracted into an independent npm package or CLI tool in later stages.
