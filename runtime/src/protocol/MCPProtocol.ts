import { ProtocolHandler, ProtocolMessage } from './ProtocolHandler.js';
import type { TransportMessage } from '../transport/Transport.js';
import { ProtocolError } from '../errors/GatewayErrors.js';

/**
 * MCP Protocol implementation (JSON-RPC 2.0).
 */
export class MCPProtocol extends ProtocolHandler {
  parse(message: TransportMessage): ProtocolMessage {
    const raw = message.payload as Record<string, unknown>;
    if (typeof raw !== 'object' || raw === null) {
      throw new ProtocolError('Invalid message format: expected object');
    }
    
    if (raw.jsonrpc !== '2.0') {
      throw new ProtocolError('Invalid JSON-RPC version');
    }

    return {
      id: raw.id as string | number,
      method: raw.method as string,
      params: raw.params,
      result: raw.result,
      error: raw.error
    };
  }

  formatRequest(id: string | number, method: string, params: unknown): TransportMessage {
    return {
      type: 'mcp',
      payload: {
        jsonrpc: '2.0',
        id,
        method,
        params
      }
    };
  }

  formatResponse(id: string | number, result: unknown): TransportMessage {
    return {
      type: 'mcp',
      payload: {
        jsonrpc: '2.0',
        id,
        result
      }
    };
  }

  formatError(id: string | number | null, code: number, message: string, data?: unknown): TransportMessage {
    return {
      type: 'mcp',
      payload: {
        jsonrpc: '2.0',
        id,
        error: {
          code,
          message,
          data
        }
      }
    };
  }
}
