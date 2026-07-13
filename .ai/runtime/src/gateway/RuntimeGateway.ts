import type { ILogger } from '../interfaces/ILogger.js';
import type { Transport, TransportHandler, TransportMessage } from '../transport/Transport.js';
import type { ProtocolHandler, ProtocolMessage } from '../protocol/ProtocolHandler.js';
import { ExecutionContext } from '../core/execution/ExecutionContext.js';
import { ProtocolError } from '../errors/GatewayErrors.js';
// We'll import ToolRegistry, SessionManager etc later once built

export interface GatewayOptions {
  logger: ILogger;
  workspaceRoot: string;
  runtimeVersion: string;
}

/**
 * Main entry point for all AI requests.
 * Transport-agnostic.
 */
export class RuntimeGateway implements TransportHandler {
  private readonly logger: ILogger;
  private readonly workspaceRoot: string;
  private readonly runtimeVersion: string;
  private transport?: Transport;
  private protocol?: ProtocolHandler;
  
  constructor(options: GatewayOptions) {
    this.logger = options.logger;
    this.workspaceRoot = options.workspaceRoot;
    this.runtimeVersion = options.runtimeVersion;
  }

  registerTransport(transport: Transport, protocol: ProtocolHandler): void {
    this.transport = transport;
    this.protocol = protocol;
    transport.setHandler(this);
  }

  async start(): Promise<void> {
    if (this.transport) {
      await this.transport.start();
      this.logger.info('Runtime Gateway started on transport');
    }
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.stop();
      this.logger.info('Runtime Gateway stopped');
    }
  }

  async handleMessage(message: TransportMessage): Promise<void> {
    if (!this.protocol || !this.transport) return;
    
    let parsed: ProtocolMessage;
    try {
      parsed = this.protocol.parse(message);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Protocol parse error: ${errorMsg}`);
      // Send parse error back if we can
      await this.transport.send(this.protocol.formatError(null, -32700, 'Parse error', errorMsg));
      return;
    }

    const context = new ExecutionContext({
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
      logger: this.logger,
      workspaceRoot: this.workspaceRoot,
      runtimeVersion: this.runtimeVersion
    });

    try {
      // Routing logic (MCPRouter will handle this if we extract it)
      // For now, we will just echo back a result as a placeholder
      if (parsed.method) {
        // Handle Request/Notification
        const result = await this.routeRequest(parsed, context);
        if (parsed.id !== undefined && parsed.id !== null) {
          await this.transport.send(this.protocol.formatResponse(parsed.id, result));
        }
      } else {
        // Handle Response to our request (if any)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (parsed.id !== undefined && parsed.id !== null) {
        await this.transport.send(this.protocol.formatError(parsed.id, -32000, errorMsg));
      }
    }
  }

  handleError(error: Error): void {
    this.logger.error(`Transport error: ${error.message}`, { stack: error.stack });
  }

  private async routeRequest(request: ProtocolMessage, context: ExecutionContext): Promise<any> {
    // This will route to MCPRouter initially
    return { status: 'ok', method: request.method };
  }

  async listTools(context: ExecutionContext): Promise<any> {
    // Placeholder for calling ToolRegistry
    return { tools: [] };
  }

  async executeTool(name: string, args: Record<string, any>, context: ExecutionContext): Promise<any> {
    // Placeholder for calling ToolExecutionPipeline
    return { result: `Executed ${name}` };
  }
}
