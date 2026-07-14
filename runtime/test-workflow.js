import { Bootstrap } from './dist/src/bootstrap/Bootstrap.js';
import { CreateWorkspaceCommand, ImportRepositoryCommand, ImportKnowledgeCommand, GetWorkspaceSummaryQuery } from './dist/src/core/cqrs/index.js';
import { ServiceContainer } from './dist/src/core/di/ServiceContainer.js';
import { TOKENS } from './dist/src/core/di/ServiceTokens.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';

async function run() {
  await fs.rm('../.ai', { recursive: true, force: true }).catch(() => {});
  console.log("Deleted .ai");

  // Bootstrap will create things and initialize DB
  await Bootstrap.run();

  // Since Bootstrap is static and sets up everything, but it doesn't return the container, 
  // wait, Bootstrap does run the server. We might not want to start the server.
}

run().catch(console.error);
