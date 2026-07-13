import type { ILogger } from '../../interfaces/ILogger.js';

export interface ExecutionMetadata {
  [key: string]: unknown;
}

export class CancellationToken {
  private _isCancellationRequested = false;

  get isCancellationRequested(): boolean {
    return this._isCancellationRequested;
  }

  cancel(): void {
    this._isCancellationRequested = true;
  }

  throwIfCancelled(): void {
    if (this._isCancellationRequested) {
      throw new Error('Execution was cancelled');
    }
  }
}

export interface ExecutionContextOptions {
  requestId: string;
  correlationId: string;
  traceId: string;
  logger: ILogger;
  workspaceRoot: string;
  sessionId?: string;
  runtimeVersion: string;
  metadata?: ExecutionMetadata;
}

/**
 * Shared execution context propagated through Commands, Queries, Tools, 
 * Pipelines, Events, Responses, Logs, and Sessions.
 */
export class ExecutionContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly logger: ILogger;
  readonly workspaceRoot: string;
  readonly sessionId?: string;
  readonly runtimeVersion: string;
  readonly cancellationToken: CancellationToken;
  private readonly metadata: ExecutionMetadata;

  constructor(options: ExecutionContextOptions) {
    this.requestId = options.requestId;
    this.correlationId = options.correlationId;
    this.traceId = options.traceId;
    this.logger = options.logger;
    this.workspaceRoot = options.workspaceRoot;
    this.sessionId = options.sessionId;
    this.runtimeVersion = options.runtimeVersion;
    this.cancellationToken = new CancellationToken();
    this.metadata = options.metadata ?? {};
  }

  getMetadata(key: string): unknown | undefined {
    return this.metadata[key];
  }

  setMetadata(key: string, value: unknown): void {
    this.metadata[key] = value;
  }
}
