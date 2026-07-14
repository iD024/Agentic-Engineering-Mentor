import type { RuntimeGateway } from '../gateway/RuntimeGateway.js';
import { MCPTransport } from '../transport/MCPTransport.js';
import { MCPProtocol } from '../protocol/MCPProtocol.js';

export class MCPServer {
  private transport: MCPTransport;
  private protocol: MCPProtocol;
  
  constructor(private readonly gateway: RuntimeGateway) {
    this.transport = new MCPTransport();
    this.protocol = new MCPProtocol();
    // Register the MCP transport to the gateway
    this.gateway.registerTransport(this.transport, this.protocol);
  }

  async start(): Promise<void> {
    await this.gateway.start();
  }

  async stop(): Promise<void> {
    await this.gateway.stop();
  }
}
