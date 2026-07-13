import type { ProtocolMessage } from '../protocol/ProtocolHandler.js';
import type { ExecutionContext } from '../core/execution/ExecutionContext.js';
import type { RuntimeGateway } from '../gateway/RuntimeGateway.js';

export class MCPRouter {
  constructor(private readonly gateway: RuntimeGateway) {}

  /**
   * Translates MCP specific requests into generic RuntimeGateway calls.
   */
  async route(request: ProtocolMessage, context: ExecutionContext): Promise<unknown> {
    switch (request.method) {
      case 'tools/list':
        // Map to Gateway listing tools
        return this.gateway.listTools(context);
      case 'tools/call': {
        // Map to Gateway executing tool
        const callParams = request.params as Record<string, unknown>;
        if (!callParams || typeof callParams.name !== 'string') {
          throw new Error('Invalid params for tools/call');
        }
        return this.gateway.executeTool(callParams.name, (callParams.arguments as Record<string, unknown>) || {}, context);
      }
      default:
        throw new Error(`Method not supported: ${request.method}`);
    }
  }
}
