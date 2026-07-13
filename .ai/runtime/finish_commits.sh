#!/bin/bash
set -e

cd /home/laksh/Projects/Antigravity-Engineering-Mentor

# 10. Bootstrap & Main (avoiding README.md explicitly in case it doesn't exist/match)
git add .ai/runtime/src/bootstrap/ .ai/runtime/src/main.ts .ai/runtime/src/interfaces/index.ts .ai/runtime/docs/Architecture.md || true
git commit -m "feat(bootstrap): wire core services and establish composition root" || true

# 11. Catch-all for any missed files (this will grab README.md and anything else)
git add .ai/runtime/
git commit -m "chore(runtime): finalize stage 1 implementation" || true

echo "Remaining commits created successfully!"
