import { Citation, KnowledgeChunk, KnowledgeDocument } from '../types.js';
import * as crypto from 'crypto';

export class CitationEngine {
  private citations: Map<string, Citation> = new Map();

  public createCitation(chunk: KnowledgeChunk, document: KnowledgeDocument): Citation {
    const citationId = this.generateCitationId(chunk.id, document.id);
    
    if (this.citations.has(citationId)) {
      return this.citations.get(citationId)!;
    }

    const citation: Citation = {
      id: citationId,
      chunkId: chunk.id,
      documentId: document.id,
      sourceUri: document.sourceUri,
      version: document.version,
      // Provide a brief snippet for context
      context: chunk.content.substring(0, 100) + '...'
    };

    this.citations.set(citation.id, citation);
    return citation;
  }

  public getCitation(id: string): Citation | undefined {
    return this.citations.get(id);
  }

  public getCitationsForDocument(documentId: string): Citation[] {
    return Array.from(this.citations.values()).filter(c => c.documentId === documentId);
  }

  private generateCitationId(chunkId: string, documentId: string): string {
    const hash = crypto.createHash('sha256').update(`${chunkId}_${documentId}`).digest('hex');
    return `cit_${hash.substring(0, 12)}`;
  }
}
