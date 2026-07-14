import { KnowledgeDocument } from '../types.js';

export interface SourceMetadata {
  owner: string;
  sourceUri: string;
  createdAt: Date;
  lastModifiedAt: Date;
  version: string;
}

export class KnowledgeRepository {
  private sources: Map<string, SourceMetadata> = new Map();

  public trackSource(document: KnowledgeDocument, owner: string = 'system'): void {
    const metadata: SourceMetadata = {
      owner,
      sourceUri: document.sourceUri,
      createdAt: new Date(),
      lastModifiedAt: document.lastUpdated,
      version: document.version
    };

    this.sources.set(document.sourceUri, metadata);
  }

  public getSource(uri: string): SourceMetadata | undefined {
    return this.sources.get(uri);
  }

  public getAllSources(): SourceMetadata[] {
    return Array.from(this.sources.values());
  }
}
