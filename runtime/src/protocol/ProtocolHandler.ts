import type { TransportMessage } from '../transport/Transport.js';

export interface ProtocolMessage {
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
}

export abstract class ProtocolHandler {
  abstract parse(message: TransportMessage): ProtocolMessage;
  abstract formatRequest(id: string | number, method: string, params: unknown): TransportMessage;
  abstract formatResponse(id: string | number, result: unknown): TransportMessage;
  abstract formatError(id: string | number | null, code: number, message: string, data?: unknown): TransportMessage;
}
