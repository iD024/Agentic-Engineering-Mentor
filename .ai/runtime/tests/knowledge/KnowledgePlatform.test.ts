import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentImporter } from '../../src/knowledge/documents/DocumentImporter.js';
import { Chunker } from '../../src/knowledge/chunking/Chunker.js';
import { DeterministicEmbeddingProvider } from '../../src/knowledge/embeddings/EmbeddingProvider.js';
import { KnowledgeGraph } from '../../src/knowledge/index/KnowledgeGraph.js';
import { KnowledgeIndexer } from '../../src/knowledge/index/KnowledgeIndexer.js';
import { KnowledgeRetriever } from '../../src/knowledge/retrieval/KnowledgeRetriever.js';
import { KnowledgeRanker } from '../../src/knowledge/ranking/KnowledgeRanker.js';
import { CitationEngine } from '../../src/knowledge/citations/CitationEngine.js';
import { KnowledgeCache } from '../../src/knowledge/knowledge-cache/KnowledgeCache.js';
import { KnowledgeRepository } from '../../src/knowledge/sources/KnowledgeRepository.js';
import { KnowledgeDocument } from '../../src/knowledge/types.js';

describe('Stage 7: Engineering Knowledge Platform', () => {
  let importer: DocumentImporter;
  let chunker: Chunker;
  let embeddingProvider: DeterministicEmbeddingProvider;
  let graph: KnowledgeGraph;
  let indexer: KnowledgeIndexer;
  let retriever: KnowledgeRetriever;
  let ranker: KnowledgeRanker;
  let citations: CitationEngine;
  let cache: KnowledgeCache;
  let repo: KnowledgeRepository;

  const testDir = path.join(__dirname, 'test_data');

  beforeAll(() => {
    importer = new DocumentImporter();
    chunker = new Chunker();
    embeddingProvider = new DeterministicEmbeddingProvider(10); // Small dim for fast test
    graph = new KnowledgeGraph();
    indexer = new KnowledgeIndexer(embeddingProvider, graph);
    retriever = new KnowledgeRetriever(indexer, embeddingProvider);
    ranker = new KnowledgeRanker();
    citations = new CitationEngine();
    cache = new KnowledgeCache();
    repo = new KnowledgeRepository();

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should import a Markdown document deterministically', async () => {
    const mdPath = path.join(testDir, 'test.md');
    fs.writeFileSync(mdPath, '# Title\n\nThis is a deterministically testable markdown file for the engineering platform.');

    const doc = await importer.importDocument(mdPath);
    expect(doc.type).toBe('markdown');
    expect(doc.content).toContain('deterministically testable');

    repo.trackSource(doc, 'test-user');
    const source = repo.getSource(mdPath);
    expect(source?.owner).toBe('test-user');
  });

  it('should chunk documents', async () => {
    const doc: KnowledgeDocument = {
      id: 'doc1',
      sourceUri: 'test.txt',
      type: 'txt',
      title: 'Test',
      content: 'A'.repeat(2000), // 2000 chars
      version: '1',
      lastUpdated: new Date(),
      metadata: {}
    };

    const chunks = chunker.chunkDocument(doc, { maxChunkSize: 1000, overlapSize: 0 });
    expect(chunks.length).toBe(2);
    expect(chunks[0].content.length).toBe(1000);
  });

  it('should embed, index, retrieve, and rank knowledge', async () => {
    const doc: KnowledgeDocument = {
      id: 'doc2',
      sourceUri: 'test2.txt',
      type: 'txt',
      title: 'Test2',
      content: 'The architectural decision requires scaling deterministic retrieval across chunks.',
      version: '1',
      lastUpdated: new Date(),
      metadata: {}
    };

    const chunks = chunker.chunkDocument(doc);
    await indexer.indexDocument(doc, chunks);

    // Retrieve
    const results = await retriever.retrieve('deterministic retrieval');
    expect(results.length).toBeGreaterThan(0);

    // Rank
    const ranked = ranker.rank(results, 'deterministic retrieval');
    expect(ranked.length).toBeGreaterThan(0);
    
    // Citation
    const citation = citations.createCitation(ranked[0].chunk, doc);
    expect(citation.documentId).toBe('doc2');
    expect(citation.context).toContain('architectural decision');
  });

  it('should manipulate KnowledgeGraph', () => {
    graph.addNode({ id: 'topic1', type: 'Topic', label: 'Retrieval', metadata: {} });
    graph.addNode({ id: 'concept1', type: 'Concept', label: 'Cosine Similarity', metadata: {} });
    graph.addEdge({ id: 'e1', source: 'topic1', target: 'concept1', relationship: 'uses', weight: 1 });

    const found = graph.searchNodes('retrieval');
    expect(found.length).toBe(1);
    expect(found[0].id).toBe('topic1');

    const edges = graph.getEdges('topic1', 'out');
    expect(edges.length).toBe(1);
    expect(edges[0].target).toBe('concept1');
  });

  it('should cache and retrieve from cache', () => {
    cache.set('testKey', { score: 99 });
    const val = cache.get<{ score: number }>('testKey');
    expect(val?.score).toBe(99);

    cache.invalidate('testKey');
    expect(cache.get('testKey')).toBeUndefined();
  });
});
