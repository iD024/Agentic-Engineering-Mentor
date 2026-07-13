#!/bin/bash
set -e

# Ensure we are in the project root
cd /home/laksh/Projects/Antigravity-Engineering-Mentor

# Initialize git if not already
if [ ! -d ".git" ]; then
  git init
fi

# 1. Project config
git add .ai/runtime/package.json .ai/runtime/package-lock.json .ai/runtime/tsconfig.json .ai/runtime/vitest.config.ts .ai/runtime/eslint.config.js .ai/runtime/.prettierrc .ai/runtime/.gitignore .ai/runtime/.env.example .ai/runtime/docs/FolderStructure.md
git commit -m "chore(runtime): initialize project configuration and structure"

# 2. Config module
git add .ai/runtime/src/core/config/ .ai/runtime/tests/core/config/ .ai/runtime/src/types/RuntimeConfig.ts .ai/runtime/src/types/LogLevel.ts .ai/runtime/src/interfaces/IConfigProvider.ts
git commit -m "feat(core): add robust configuration loader and zod validator"

# 3. Logger module
git add .ai/runtime/src/core/logger/ .ai/runtime/tests/core/logger/ .ai/runtime/src/interfaces/ILogger.ts
git commit -m "feat(core): implement structured console logger and factory"

# 4. DI Container
git add .ai/runtime/src/core/di/ .ai/runtime/tests/core/di/ .ai/runtime/src/interfaces/IServiceContainer.ts
git commit -m "feat(core): implement dependency injection container with caching"

# 5. Lifecycle Manager
git add .ai/runtime/src/core/lifecycle/ .ai/runtime/tests/core/lifecycle/ .ai/runtime/src/interfaces/ILifecycle.ts .ai/runtime/docs/Startup.md
git commit -m "feat(core): add deterministic lifecycle manager and graceful shutdown"

# 6. Health Monitor
git add .ai/runtime/src/core/health/ .ai/runtime/tests/core/health/ .ai/runtime/src/interfaces/IHealthCheck.ts
git commit -m "feat(core): create extensible health monitor"

# 7. Events
git add .ai/runtime/src/core/events/ .ai/runtime/src/interfaces/IRuntimeEvents.ts
git commit -m "feat(core): add synchronous runtime lifecycle events"

# 8. Kernel
git add .ai/runtime/src/kernel/ .ai/runtime/tests/kernel/ .ai/runtime/src/interfaces/IKernel.ts
git commit -m "feat(kernel): implement state machine and runtime orchestrator"

# 9. Runtime
git add .ai/runtime/src/runtime/ .ai/runtime/src/types/RuntimeContext.ts .ai/runtime/src/types/index.ts .ai/runtime/src/shared/
git commit -m "feat(runtime): add foundational application layer and context"

# 10. Bootstrap & Main
git add .ai/runtime/src/bootstrap/ .ai/runtime/src/main.ts .ai/runtime/src/interfaces/index.ts .ai/runtime/docs/Architecture.md .ai/runtime/README.md
git commit -m "feat(bootstrap): wire core services and establish composition root"

# 11. Catch-all for any missed files
git add .ai/runtime/
# Use || true to prevent failure if there's nothing left to commit
git commit -m "chore(runtime): finalize stage 1 implementation" || true

echo "All commits created successfully!"
