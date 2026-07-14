# Engineering Knowledge Platform - Knowledge Flow

## Overview
This document outlines how knowledge enters the Engineering Knowledge Platform, is processed, and becomes retrievable in a deterministic, LLM-free manner.

## Ingestion Pipeline
1. **Document Import (`DocumentImporter`)**:
   - Accepts paths to raw files (`.md`, `.pdf`, `.txt`, `.html`).
   - Identifies the document type via extension.
   - Extracts raw textual content using parsers like `pdf-parse` or `cheerio` (for HTML).
   - Generates a deterministic ID (base64 hash of path + modified timestamp).

2. **Chunking (`Chunker`)**:
   - The document is segmented into `KnowledgeChunk` units.
   - The strategy relies on a sliding window approach with a predefined `maxChunkSize` (e.g., 1000 characters) and `overlapSize` (e.g., 200 characters) to ensure context boundary preservation.

3. **Embedding (`DeterministicEmbeddingProvider`)**:
   - Each chunk’s textual content is transformed into a fixed-length numeric vector (e.g., 384 dimensions).
   - Instead of an LLM embedding, a deterministic character-frequency hashing algorithm produces a consistent normalized vector for similarity comparisons.

4. **Indexing (`KnowledgeIndexer`)**:
   - The document and its constituent chunks are stored in memory.
   - A `Document` node is simultaneously appended to the `KnowledgeGraph`.

5. **Source Tracking (`KnowledgeRepository`)**:
   - Connects the generated document ID to a source owner and origin system for traceability.
