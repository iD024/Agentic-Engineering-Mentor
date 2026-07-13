export class GatewayError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends GatewayError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class PermissionError extends GatewayError {
  constructor(message: string, details?: unknown) {
    super(message, 'PERMISSION_DENIED', details);
  }
}

export class ToolExecutionError extends GatewayError {
  constructor(message: string, details?: unknown) {
    super(message, 'TOOL_EXECUTION_ERROR', details);
  }
}

export class ContextError extends GatewayError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONTEXT_ERROR', details);
  }
}

export class ProtocolError extends GatewayError {
  constructor(message: string, details?: unknown) {
    super(message, 'PROTOCOL_ERROR', details);
  }
}
