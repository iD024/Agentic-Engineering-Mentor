import type { ILogger } from '../../interfaces/ILogger.js';
import type { AgentManifest } from '../agent-runtime/types.js';

import type { IQueryBus } from '../../core/cqrs/interfaces.js';

export interface AgentContextOptions {
  sessionId: string;
  agentManifest: AgentManifest;
  logger: ILogger;
  workspaceRoot: string;
  queryBus: IQueryBus;
}

/**
 * Encapsulates the runtime context in which an agent executes.
 * Provides isolated contextual information without giving direct access
 * to core services, maintaining strict boundaries.
 */
export class AgentContext {
  public readonly sessionId: string;
  public readonly agentId: string;
  public readonly logger: ILogger;
  public readonly workspaceRoot: string;
  public readonly queryBus: IQueryBus;
  
  // Custom properties an agent can use during execution
  private readonly state: Map<string, unknown> = new Map();

  constructor(options: AgentContextOptions) {
    this.sessionId = options.sessionId;
    this.agentId = options.agentManifest.id;
    this.logger = options.logger;
    this.workspaceRoot = options.workspaceRoot;
    this.queryBus = options.queryBus;
  }

  setState(key: string, value: unknown): void {
    this.state.set(key, value);
  }

  getState<T>(key: string): T | undefined {
    return this.state.get(key) as T;
  }

  clearState(): void {
    this.state.clear();
  }
}
