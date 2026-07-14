/**
 * Defines the core interfaces and types for the Agent Platform.
 */

/**
 * Capabilities an agent can declare in its manifest.
 * Used for capability matching in the registry.
 */
export enum AgentCapability {
  CODE_ANALYSIS = 'CODE_ANALYSIS',
  CODE_GENERATION = 'CODE_GENERATION',
  PLANNING = 'PLANNING',
  REFLECTION = 'REFLECTION',
  KNOWLEDGE_RETRIEVAL = 'KNOWLEDGE_RETRIEVAL',
  WORKFLOW_ORCHESTRATION = 'WORKFLOW_ORCHESTRATION',
  PEDAGOGY = 'PEDAGOGY',
  TESTING = 'TESTING'
}

/**
 * Standardized output format for any agent task or step.
 */
export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
  capabilitiesUsed: AgentCapability[];
}

/**
 * The definition of an Agent Plugin.
 */
export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: AgentCapability[];
  /**
   * Defines whether this agent handles long-running workflows
   * or immediate query-response tasks.
   */
  executionMode: 'synchronous' | 'asynchronous' | 'workflow';
}

/**
 * Lifecycle hooks that an agent must implement.
 */
export interface AgentLifecycle {
  initialize(): Promise<void>;
  start(context: unknown): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}

/**
 * The base interface all Agent plugins must implement.
 */
export interface IAgent extends AgentLifecycle {
  readonly manifest: AgentManifest;
  executeTask(taskId: string, input: unknown): Promise<AgentResult>;
}
