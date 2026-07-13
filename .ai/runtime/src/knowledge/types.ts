export type DocumentType = 'pdf' | 'markdown' | 'txt' | 'html';

export interface KnowledgeDocument {
  id: string;
  sourceUri: string;
  type: DocumentType;
  title: string;
  content: string;
  author?: string;
  version: string;
  lastUpdated: Date;
  metadata: Record<string, any>;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  content: string;
  startIndex: number;
  endIndex: number;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface Citation {
  id: string;
  chunkId: string;
  documentId: string;
  sourceUri: string;
  version: string;
  context: string;
}

export interface GraphNode {
  id: string;
  type: 'Topic' | 'Concept' | 'Book' | 'RepositorySymbol' | 'LearningMilestone' | 'Document';
  label: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight: number;
}
