import { IQueryHandler } from '../../core/cqrs/index.js';
import {
  SearchKnowledgeQuery,
  FindTopicQuery,
  FindCitationQuery,
  SummarizeKnowledgeQuery,
  RelatedTopicsQuery,
  DocumentSummaryQuery
} from './queries.js';
import { RetrievalResult, KnowledgeRetriever } from '../retrieval/KnowledgeRetriever.js';
import { KnowledgeGraph } from '../index/KnowledgeGraph.js';
import { CitationEngine } from '../citations/CitationEngine.js';
import { GraphNode, Citation } from '../types.js';
import { KnowledgeRanker } from '../ranking/KnowledgeRanker.js';
import { KnowledgeIndexer } from '../index/KnowledgeIndexer.js';

export class SearchKnowledgeHandler implements IQueryHandler<SearchKnowledgeQuery, RetrievalResult[]> {
  public readonly queryType = 'SearchKnowledgeQuery';
  constructor(
    private retriever: KnowledgeRetriever,
    private ranker: KnowledgeRanker
  ) {}

  public async execute(query: SearchKnowledgeQuery): Promise<RetrievalResult[]> {
    const results = await this.retriever.retrieve(query.query, query.topK * 2);
    return this.ranker.rank(results, query.query, { maxResults: query.topK });
  }
}

export class FindTopicHandler implements IQueryHandler<FindTopicQuery, GraphNode[]> {
  public readonly queryType = 'FindTopicQuery';
  constructor(private graph: KnowledgeGraph) {}

  public async execute(query: FindTopicQuery): Promise<GraphNode[]> {
    return this.graph.searchNodes(query.topicName, 'Topic');
  }
}

export class FindCitationHandler implements IQueryHandler<FindCitationQuery, Citation | undefined> {
  public readonly queryType = 'FindCitationQuery';
  constructor(private citations: CitationEngine) {}

  public async execute(query: FindCitationQuery): Promise<Citation | undefined> {
    return this.citations.getCitation(query.citationId);
  }
}

export class SummarizeKnowledgeHandler implements IQueryHandler<SummarizeKnowledgeQuery, string> {
  public readonly queryType = 'SummarizeKnowledgeQuery';
  constructor(private retriever: KnowledgeRetriever) {}

  public async execute(query: SummarizeKnowledgeQuery): Promise<string> {
    // Deterministic retrieval without LLM.
    // So "summarize" in this context just concatenates top exact chunks.
    const results = this.retriever.retrieveExact(query.query).slice(0, 3);
    if (results.length === 0) return 'No relevant knowledge found.';
    return results.map(r => r.chunk.content).join('\n...\n');
  }
}

export class RelatedTopicsHandler implements IQueryHandler<RelatedTopicsQuery, GraphNode[]> {
  public readonly queryType = 'RelatedTopicsQuery';
  constructor(private graph: KnowledgeGraph) {}

  public async execute(query: RelatedTopicsQuery): Promise<GraphNode[]> {
    const edges = this.graph.getEdges(query.topicId);
    const relatedIds = edges.map(e => e.source === query.topicId ? e.target : e.source);
    
    const nodes: GraphNode[] = [];
    for (const id of relatedIds) {
      const node = this.graph.getNode(id);
      if (node) nodes.push(node);
    }
    return nodes;
  }
}

export class DocumentSummaryHandler implements IQueryHandler<DocumentSummaryQuery, string> {
  public readonly queryType = 'DocumentSummaryQuery';
  constructor(private indexer: KnowledgeIndexer) {}

  public async execute(query: DocumentSummaryQuery): Promise<string> {
    const doc = this.indexer.getDocument(query.documentId);
    if (!doc) return 'Document not found.';
    
    // Deterministic summary: just returning title and first 200 chars.
    return `Title: ${doc.title}\nVersion: ${doc.version}\nContent Preview: ${doc.content.substring(0, 200)}...`;
  }
}
