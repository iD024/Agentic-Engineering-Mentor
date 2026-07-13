import { KnowledgeChunk } from '../types.js';
import { IEmbeddingProvider } from '../embeddings/EmbeddingProvider.js';
import { KnowledgeIndexer } from '../index/KnowledgeIndexer.js';

export interface RetrievalResult {
  chunk: KnowledgeChunk;
  score: number;
}

export class KnowledgeRetriever {
  private indexer: KnowledgeIndexer;
  private embeddingProvider: IEmbeddingProvider;

  constructor(indexer: KnowledgeIndexer, embeddingProvider: IEmbeddingProvider) {
    this.indexer = indexer;
    this.embeddingProvider = embeddingProvider;
  }

  public async retrieve(query: string, topK: number = 10): Promise<RetrievalResult[]> {
    const queryEmbedding = await this.embeddingProvider.embedText(query);
    const chunks = this.indexer.getAllChunks();
    const results: RetrievalResult[] = [];

    for (const chunk of chunks) {
      if (!chunk.embedding) continue;
      
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      results.push({ chunk, score });
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  public retrieveExact(query: string): RetrievalResult[] {
    const chunks = this.indexer.getAllChunks();
    const results: RetrievalResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const chunk of chunks) {
      if (chunk.content.toLowerCase().includes(lowerQuery)) {
        // Simple score based on term frequency
        const matches = (chunk.content.toLowerCase().match(new RegExp(lowerQuery, 'g')) || []).length;
        results.push({ chunk, score: matches });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
