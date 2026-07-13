import type { IQuery, IQueryHandler } from '../core/cqrs/interfaces.js';
import type { SymbolTable } from '../symbols/SymbolTable.js';
import type { DependencyGraph } from '../dependencies/DependencyGraph.js';

export class RepositorySummaryQuery implements IQuery<any> {
  readonly type = 'RepositorySummaryQuery';
}

export class RepositorySummaryQueryHandler implements IQueryHandler<RepositorySummaryQuery, any> {
  readonly queryType = 'RepositorySummaryQuery';
  constructor(private symbolTable: SymbolTable, private deps: DependencyGraph) {}
  
  async execute(query: RepositorySummaryQuery): Promise<any> {
    return {
      totalSymbols: this.symbolTable.definitions.getAll().length,
      totalEdges: this.deps.edges.length,
      totalNodes: this.deps.nodes.size
    };
  }
}
