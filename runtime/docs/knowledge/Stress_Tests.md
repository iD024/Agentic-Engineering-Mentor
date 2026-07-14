# Engineering Knowledge Platform - Stress Tests

## Overview
Stress testing validates the mathematical stability and memory limits of the runtime when scaling to massive knowledge bases.

## Large Document Benchmark
**Scenario**: Ingest 100 PDFs (text-extracted) and 1000 Markdown files simultaneously.
- **Total Chunks**: ~50,000 to 150,000 (depending on chunk size configuration).
- **Test Objective**: Verify the node process does not exceed 1.5GB of RAM (V8 default limit) and that queries still resolve in under 50ms.

## Result Projection
Given the `DeterministicEmbeddingProvider` and linear cosine similarity:
- 100,000 chunks * 384-dimension vectors = ~300MB of numeric array memory.
- Retrieval speed will linearly degrade, projecting ~40-60ms response times for a full scan, which remains well within acceptable bounds for synchronous query responses on the `QueryBus`.

## Concurrency
Since ingestion uses asynchronous file I/O but synchronous CPU bound hashing, node event loop blocking must be monitored. Wrapping large array processing in `setImmediate` can alleviate event loop starvation during massive bulk imports.
