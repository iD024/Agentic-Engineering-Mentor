# Parser Architecture

## Ownership
Parser Layer.

## Responsibilities
- Abstract Tree-sitter away from the rest of the application.
- `ParserRegistry` holds available languages.
- `ParserFactory` instantiates `LanguageParser` instances.

## Future AI Integration
Agents just ask for the AST or Symbols; they never need to know Tree-sitter exists or how to instantiate it.
