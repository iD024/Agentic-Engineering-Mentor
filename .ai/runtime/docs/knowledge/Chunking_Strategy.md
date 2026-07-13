# Engineering Knowledge Platform - Chunking Strategy

## Objective
To ensure meaningful retrieval, documents must be split into logical chunks. The `Chunker` component acts entirely deterministically.

## Algorithms

### Standard Text Chunking
- **Parameters**: `maxChunkSize` (default 1000) and `overlapSize` (default 200).
- **Execution**: The algorithm slices strings mathematically based on character count. An overlap ensures that sentences or critical code snippets cut on a boundary are preserved fully in either the preceding or succeeding chunk.

### Markdown Chunking
- **Header Boundaries**: Markdown chunking splits text on headers `\n# ` to retain document structure.
- **Sub-chunking**: If a header section exceeds `maxChunkSize`, the algorithm recursively applies standard text chunking to that specific section, appending a metadata flag `markdownSection: true`.

## Future Improvements
- **Abstract Syntax Tree (AST)**: Code files (e.g., TS, JS, Python) will be chunked using Tree-sitter, splitting strictly on function, class, and interface boundaries.
- **Semantic Sentences**: Splitting exactly on punctuation marks `.?!` instead of raw character counts to prevent broken words.
