import { Transport, TransportMessage } from './Transport.js';

/**
 * Implements MCP communication over stdio.
 * This is a foundational stub for the actual stdio JSON-RPC.
 */
export class MCPTransport extends Transport {
  async start(): Promise<void> {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', this.onData.bind(this));
    process.stdin.on('error', this.onError.bind(this));
    // In actual implementation, we would parse JSON-RPC messages from stdin buffers
  }

  async stop(): Promise<void> {
    process.stdin.pause();
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('error');
  }

  async send(message: TransportMessage): Promise<void> {
    // Stringify only the payload and write to stdout
    const payload = JSON.stringify(message.payload) + '\n';
    process.stdout.write(payload);
  }

  private onData(chunk: string): void {
    if (!this.handler) return;
    try {
      // Very naive implementation. Real one handles streaming JSON parsing.
      const msgs = chunk.split('\n').filter(Boolean);
      for (const msg of msgs) {
        const parsed = JSON.parse(msg);
        const transportMsg: TransportMessage = {
          type: 'mcp',
          payload: parsed
        };
        this.handler.handleMessage(transportMsg).catch(err => {
          this.handler?.handleError(err instanceof Error ? err : new Error(String(err)));
        });
      }
    } catch (err) {
      this.handler.handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private onError(err: Error): void {
    if (this.handler) {
      this.handler.handleError(err);
    }
  }
}
