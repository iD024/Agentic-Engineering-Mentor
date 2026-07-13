import { KnowledgeDocument, KnowledgeChunk, DocumentType } from '../types.js';
import * as crypto from 'crypto';

export interface ChunkingOptions {
  maxChunkSize: number;
  overlapSize: number;
}

export class Chunker {
  private defaultOptions: ChunkingOptions = {
    maxChunkSize: 1000,
    overlapSize: 200,
  };

  public chunkDocument(doc: KnowledgeDocument, options?: Partial<ChunkingOptions>): KnowledgeChunk[] {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    switch (doc.type) {
      case 'markdown':
        return this.chunkMarkdown(doc, finalOptions);
      default:
        return this.chunkText(doc, finalOptions);
    }
  }

  private chunkText(doc: KnowledgeDocument, options: ChunkingOptions): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    const text = doc.content;
    let i = 0;
    
    while (i < text.length) {
      const end = Math.min(i + options.maxChunkSize, text.length);
      const chunkText = text.substring(i, end);
      
      chunks.push({
        id: this.generateChunkId(doc.id, i, end),
        documentId: doc.id,
        content: chunkText,
        startIndex: i,
        endIndex: end,
        metadata: {
          ...doc.metadata,
        }
      });
      
      i += (options.maxChunkSize - options.overlapSize);
      // prevent infinite loops if overlap >= maxChunkSize
      if (options.maxChunkSize - options.overlapSize <= 0) {
        break;
      }
    }
    
    return chunks;
  }

  private chunkMarkdown(doc: KnowledgeDocument, options: ChunkingOptions): KnowledgeChunk[] {
    // Basic Markdown chunking: split by headers, then by size if needed
    // For simplicity, falling back to text chunking for now, 
    // but in a fully operational system, we'd parse AST or split by `\n# `
    const sections = doc.content.split(/\n(?=# )/);
    const chunks: KnowledgeChunk[] = [];
    let currentIndex = 0;

    for (const section of sections) {
      const sectionLength = section.length;
      if (sectionLength <= options.maxChunkSize) {
        chunks.push({
          id: this.generateChunkId(doc.id, currentIndex, currentIndex + sectionLength),
          documentId: doc.id,
          content: section,
          startIndex: currentIndex,
          endIndex: currentIndex + sectionLength,
          metadata: {
            ...doc.metadata,
            markdownSection: true
          }
        });
      } else {
        // Section too big, sub-chunk it
        const subDoc = { ...doc, content: section };
        const subChunks = this.chunkText(subDoc, options);
        for (const sc of subChunks) {
          sc.startIndex += currentIndex;
          sc.endIndex += currentIndex;
          sc.id = this.generateChunkId(doc.id, sc.startIndex, sc.endIndex);
          chunks.push(sc);
        }
      }
      currentIndex += sectionLength + 1; // +1 for the newline that was split
    }

    return chunks;
  }

  private generateChunkId(docId: string, start: number, end: number): string {
    const hash = crypto.createHash('sha256').update(`${docId}_${start}_${end}`).digest('hex');
    return `chunk_${hash.substring(0, 12)}`;
  }
}
