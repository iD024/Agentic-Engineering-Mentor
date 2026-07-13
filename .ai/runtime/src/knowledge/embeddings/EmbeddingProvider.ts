export interface IEmbeddingProvider {
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * A deterministic embedding provider for testing and deterministic retrieval without LLM.
 * This simulates an embedding by creating a simplistic frequency vector or hashing based vector,
 * just to allow the architecture to be fully operational deterministically.
 */
export class DeterministicEmbeddingProvider implements IEmbeddingProvider {
  private dimensions: number;

  constructor(dimensions: number = 256) {
    this.dimensions = dimensions;
  }

  public async embedText(text: string): Promise<number[]> {
    const vector = new Array(this.dimensions).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = normalized.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      
      let hash = 0;
      for (let c = 0; c < word.length; c++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(c);
        hash |= 0; 
      }
      
      const index = Math.abs(hash) % this.dimensions;
      vector[index] += 1;
    }

    // Normalize vector to length 1
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embedText(text)));
  }
}
