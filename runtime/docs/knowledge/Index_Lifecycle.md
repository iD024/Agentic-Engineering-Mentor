# Engineering Knowledge Platform - Index Lifecycle

## Overview
The `KnowledgeIndexer` manages the lifecycle of all chunks and documents in the system. Because it operates completely in-memory for Stage 7 (determinism and speed), managing memory boundaries and invalidations is critical.

## Lifecycle States
1. **Unindexed**: File exists on disk but has not been processed.
2. **Indexing**: Document is in memory; vectors are being computed deterministically.
3. **Active**: Document and chunks are present in `KnowledgeIndexer` maps. The document is registered as a node in the `KnowledgeGraph`.
4. **Cached (`KnowledgeCache`)**: Commonly accessed queries or rank results can be cached with a TTL or direct invalidation tag to save processing on deterministic vector matching.
5. **Invalidated/Updated**:
   - When a source file changes, the `DocumentImporter` generates a new deterministic ID (due to changed modified timestamp).
   - The system drops the old document node and chunk mappings in favor of the new ones.

## Graph Synchronization
- Adding a document to the index automatically injects a `Document` node into the `KnowledgeGraph`.
- If related topics or symbols are extracted, edges are created pointing back to this Document node.
- Dropping a document requires pruning all incoming and outgoing edges from the graph.
