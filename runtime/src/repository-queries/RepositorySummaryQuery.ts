import type { IQuery, IQueryHandler } from '../core/cqrs/interfaces.js';
import type { SymbolTable } from '../symbols/SymbolTable.js';
import type { DependencyGraph } from '../dependencies/DependencyGraph.js';

export class RepositorySummaryQuery implements IQuery<unknown> {
  readonly type = 'RepositorySummaryQuery';
}

export class RepositorySummaryQueryHandler implements IQueryHandler<RepositorySummaryQuery, unknown> {
  readonly queryType = 'RepositorySummaryQuery';
  constructor(private symbolTable: SymbolTable, private deps: DependencyGraph) {}
  
  async execute(_query: RepositorySummaryQuery): Promise<unknown> {
    return {
      totalSymbols: this.symbolTable.definitions.getAll().length,
      totalEdges: this.deps.edges.length,
      totalNodes: this.deps.nodes.size
    };
  }
}
