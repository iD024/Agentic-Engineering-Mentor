import type { ILogger } from '../interfaces/ILogger.js';
import type { Transport, TransportHandler, TransportMessage } from '../transport/Transport.js';
import type { ProtocolHandler, ProtocolMessage } from '../protocol/ProtocolHandler.js';
import { ExecutionContext } from '../core/execution/ExecutionContext.js';
import { ProtocolError } from '../errors/GatewayErrors.js';
// We'll import ToolRegistry, SessionManager etc later once built

import type { ToolRegistry } from '../tool-registry/ToolRegistry.js';

export interface GatewayOptions {
  logger: ILogger;
  workspaceRoot: string;
  runtimeVersion: string;
  toolRegistry: ToolRegistry;
}

/**
 * Main entry point for all AI requests.
 * Transport-agnostic.
 */
export class RuntimeGateway implements TransportHandler {
  private readonly logger: ILogger;
  private readonly workspaceRoot: string;
  private readonly runtimeVersion: string;
  private readonly toolRegistry: ToolRegistry;
  private transport?: Transport;
  private protocol?: ProtocolHandler;
  
  constructor(options: GatewayOptions) {
    this.logger = options.logger;
    this.workspaceRoot = options.workspaceRoot;
    this.runtimeVersion = options.runtimeVersion;
    this.toolRegistry = options.toolRegistry;
  }

  registerTransport(transport: Transport, protocol: ProtocolHandler): void {
    this.transport = transport;
    this.protocol = protocol;
    this.transport.setHandler(this);
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
    if (request.method === 'initialize') {
      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {} // We will list tools when tools/list is called
        },
        serverInfo: {
          name: 'antigravity-mcp-server',
          version: this.runtimeVersion
        }
      };
    }

    if (request.method === 'tools/list') {
      const tools = this.toolRegistry.getAll().map(t => ({
        name: t.descriptor.name,
        description: t.descriptor.description,
        inputSchema: t.descriptor.parameters
      }));
      return { tools };
    }

    if (request.method === 'tools/call') {
      const params = request.params as { name: string; arguments?: Record<string, unknown> };
      const tool = this.toolRegistry.get(params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${params.name}`);
      }

      const result = await tool.execute(params.arguments || {}, Object.assign(context, { toolName: params.name }) as any);
      
      if (!result.success) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error}` }],
          isError: true
        };
      }

      const responseText = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
      return {
        content: [{ type: 'text', text: responseText }]
      };
    }

    // This will route to MCPRouter initially
    return { status: 'ok', method: request.method };
  }

  async listTools(context: ExecutionContext): Promise<any> {
    const tools = this.toolRegistry.getAll().map(t => ({
      name: t.descriptor.name,
      description: t.descriptor.description,
      inputSchema: t.descriptor.parameters
    }));
    return { tools };
  }

  async executeTool(name: string, args: Record<string, any>, context: ExecutionContext): Promise<any> {
    const tool = this.toolRegistry.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const result = await tool.execute(args, Object.assign(context, { toolName: name }) as any);
    
    if (!result.success) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error}` }],
        isError: true
      };
    }

    const responseText = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
    return {
      content: [{ type: 'text', text: responseText }]
    };
  }
}
