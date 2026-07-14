# Dependency Graph

## Ownership
Dependencies Layer.

## Responsibilities
- Track imports, exports, and call graphs.
- Calculate impact via `ImpactAnalyzer`.

## Lifecycle
Built after symbols are resolved. Updated incrementally when edges (imports/calls) change.

## Future AI Integration
Agents use `ImpactAnalysisQuery` before modifying code to see what else might break.
