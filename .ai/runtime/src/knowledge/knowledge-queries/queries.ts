import { IQuery } from '../../core/cqrs/index.js';
import { RetrievalResult } from '../retrieval/KnowledgeRetriever.js';
import { GraphNode, Citation } from '../types.js';

export class SearchKnowledgeQuery implements IQuery<RetrievalResult[]> {
  public readonly type = 'SearchKnowledgeQuery';
  constructor(public readonly query: string, public readonly topK: number = 10) {}
}

export class FindTopicQuery implements IQuery<GraphNode[]> {
  public readonly type = 'FindTopicQuery';
  constructor(public readonly topicName: string) {}
}

export class FindCitationQuery implements IQuery<Citation | undefined> {
  public readonly type = 'FindCitationQuery';
  constructor(public readonly citationId: string) {}
}

export class SummarizeKnowledgeQuery implements IQuery<string> {
  public readonly type = 'SummarizeKnowledgeQuery';
  constructor(public readonly query: string) {}
}

export class RelatedTopicsQuery implements IQuery<GraphNode[]> {
  public readonly type = 'RelatedTopicsQuery';
  constructor(public readonly topicId: string) {}
}

export class DocumentSummaryQuery implements IQuery<string> {
  public readonly type = 'DocumentSummaryQuery';
  constructor(public readonly documentId: string) {}
}
