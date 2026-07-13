# TreeSitter Integration

## Ownership
Parser Layer.

## Responsibilities
- Loads WASM language definitions.
- Provides robust, error-tolerant ASTs.
- Avoids regex-based parsing.

## Lifecycle
Loaded once during bootstrap (`TreeSitterManager.init()`). Language parsers are loaded lazily or upfront.

## Incremental Parsing
Tree-sitter supports incremental parsing by feeding in edits. Future iterations will map file changes directly to tree edits.
