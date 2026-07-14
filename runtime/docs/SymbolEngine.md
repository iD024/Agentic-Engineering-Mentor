# Symbol Engine

## Ownership
Symbol Layer.

## Responsibilities
- Index definitions and references (Classes, Functions, etc.).
- Maintain a highly queryable `SymbolTable`.

## Incremental Updates
When a file changes, symbols from that file are removed and the new AST is re-indexed.

## Future AI Integration
Agents query `FindDefinitionQuery` and `FindReferencesQuery` to navigate code like an IDE, saving massive context window tokens.
