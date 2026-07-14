# Engineering Knowledge Platform - Retrieval Flow

## Overview
The retrieval flow describes how a user query translates into relevant chunks of engineering knowledge, sorted by relevance and strictly mapped to their original sources.

## Query Execution Lifecycle
1. **Query Dispatch**:
   - A `SearchKnowledgeQuery` is dispatched onto the `QueryBus` with the search string and `topK` parameter.
   - The `SearchKnowledgeHandler` intercepts the request.

2. **Vectorization**:
   - The `KnowledgeRetriever` utilizes the `DeterministicEmbeddingProvider` to convert the raw query string into a query vector using the exact same hashing algorithm employed during ingestion.

3. **Similarity Search**:
   - A cosine similarity function computes the distance between the query vector and all chunk vectors in the `KnowledgeIndexer`.
   - Optionally, an exact text match fallback (term frequency) can be employed for direct keyword lookups.

4. **Ranking (`KnowledgeRanker`)**:
   - Preliminary results (typically `topK * 2`) are passed to the `KnowledgeRanker`.
   - The ranker refines the score and trims the array to the requested `topK`.

5. **Citation Generation (`CitationEngine`)**:
   - Using the retrieved chunk and its parent document, the `CitationEngine` generates a rigorous context citation linking directly to the origin file and version.

6. **Response**:
   - The `RetrievalResult[]` array is returned to the caller, fully self-contained and deterministic.
