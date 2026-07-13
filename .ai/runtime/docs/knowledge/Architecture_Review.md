# Engineering Knowledge Platform - Architecture Review

## Overview
The Engineering Knowledge Platform (Stage 7) transforms the runtime into a deterministic source of engineering knowledge. It operates without Large Language Models (LLMs), relying instead on robust graph-based architectures, deterministic chunking, and deterministic vector embeddings.

## Components
1. **DocumentImporter**: Supports importing diverse document types (PDF, Markdown, TXT, HTML) deterministically. It tracks version changes and sources.
2. **Chunker**: Splits documents into manageable pieces using deterministic rules (e.g., maximum size, overlap). Markdown chunking respects header boundaries where possible.
3. **KnowledgeIndexer & EmbeddingProvider**: Employs a deterministic hashing-based vectorization strategy (`DeterministicEmbeddingProvider`) for testing and offline execution, indexing chunks deterministically.
4. **KnowledgeGraph**: Manages relationships between Topics, Concepts, Books, Repository Symbols, and Documents in an in-memory graph structure.
5. **KnowledgeRetriever & KnowledgeRanker**: Executes similarity searches (Cosine Similarity) over deterministic embeddings and term frequency for exact match fallback, retrieving and ranking results efficiently.
6. **CitationEngine**: Links retrieved chunks back to their originating source, ensuring deterministic citation and source tracking.
7. **KnowledgeCache & KnowledgeRepository**: Provides rapid caching and lifecycle tracking of document sources and owners.

## Integration
All components are wired into the `Bootstrap.ts` and registered with the CQRS `QueryBus`, enabling uniform access to knowledge through structured queries (`SearchKnowledgeQuery`, `FindTopicQuery`, etc.).

## Evaluation
The architecture cleanly isolates storage, retrieval, and graph relationships, resulting in highly testable, LLM-independent deterministic retrieval.
