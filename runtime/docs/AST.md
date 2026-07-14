# Abstract Syntax Tree (AST)

## Ownership
AST Layer.

## Responsibilities
- Provide a unified JSON-serializable representation of code.
- `ASTBuilder` converts tree-sitter nodes into generic `ASTNode`.
- `ASTCache` prevents redundant parsing.

## Lifecycle
Created during file parsing. Cached in SQLite. Invalidated on file change.

## Future AI Integration
AI will use this to accurately extract function bounds, classes, and variables without guessing from raw text.
