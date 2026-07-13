export interface ResponseMetadata {
  executionTimeMs: number;
  warnings?: string[];
  [key: string]: unknown;
}

export interface ResponseEnvelope<T = unknown> {
  requestId: string;
  sessionId?: string;
  runtimeVersion: string;
  workspaceVersion?: string;
  toolVersion?: string;
  metadata: ResponseMetadata;
  payload: T;
  errors?: unknown[];
}

export class ResponseBuilder {
  static build<T>(
    payload: T,
    requestId: string,
    runtimeVersion: string,
    executionTimeMs: number,
    sessionId?: string
  ): ResponseEnvelope<T> {
    return {
      requestId,
      sessionId,
      runtimeVersion,
      metadata: {
        executionTimeMs
      },
      payload
    };
  }
}
