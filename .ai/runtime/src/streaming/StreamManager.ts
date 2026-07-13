export interface ResponseChunk {
  index: number;
  content: string;
  isFinal: boolean;
}

export class StreamWriter {
  constructor(private readonly writeCallback: (chunk: ResponseChunk) => void) {}

  write(content: string, isFinal = false): void {
    this.writeCallback({ index: Date.now(), content, isFinal });
  }
}

export class StreamManager {
  createStream(callback: (chunk: ResponseChunk) => void): StreamWriter {
    return new StreamWriter(callback);
  }
}
