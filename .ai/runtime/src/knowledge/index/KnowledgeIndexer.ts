import { KnowledgeDocument, KnowledgeChunk } from '../types.js';
import { IEmbeddingProvider } from '../embeddings/EmbeddingProvider.js';
import { KnowledgeGraph } from './KnowledgeGraph.js';

export class KnowledgeIndexer {
  private chunks: Map<string, KnowledgeChunk> = new Map();
  private documents: Map<string, KnowledgeDocument> = new Map();
  private embeddingProvider: IEmbeddingProvider;
  private graph: KnowledgeGraph;

  constructor(embeddingProvider: IEmbeddingProvider, graph: KnowledgeGraph) {
    this.embeddingProvider = embeddingProvider;
    this.graph = graph;
  }

  public async indexDocument(doc: KnowledgeDocument, chunks: KnowledgeChunk[]): Promise<void> {
    this.documents.set(doc.id, doc);

    // Create document node in graph
    this.graph.addNode({
      id: doc.id,
      type: 'Document',
      label: doc.title,
      metadata: doc.metadata
    });

    const textsToEmbed = chunks.map(c => c.content);
    const embeddings = await this.embeddingProvider.embedBatch(textsToEmbed);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      chunk.embedding = embeddings[i];
      this.chunks.set(chunk.id, chunk);
    }
  }

  public getDocument(id: string): KnowledgeDocument | undefined {
    return this.documents.get(id);
  }

  public getChunk(id: string): KnowledgeChunk | undefined {
    return this.chunks.get(id);
  }

  public getAllChunks(): KnowledgeChunk[] {
    return Array.from(this.chunks.values());
  }
}
