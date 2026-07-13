export interface TransportMessage {
  type: string;
  payload: unknown;
}

export interface TransportHandler {
  handleMessage(message: TransportMessage): Promise<void>;
  handleError(error: Error): void;
}

export abstract class Transport {
  protected handler?: TransportHandler;

  setHandler(handler: TransportHandler): void {
    this.handler = handler;
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract send(message: TransportMessage): Promise<void>;
}
