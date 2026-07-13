import type { IQuery, IQueryHandler } from '../core/cqrs/interfaces.js';
import type { SymbolTable } from '../symbols/SymbolTable.js';

export class ListModulesQuery implements IQuery<string[]> {
  readonly type = 'ListModulesQuery';
}

export class ListModulesQueryHandler implements IQueryHandler<ListModulesQuery, string[]> {
  readonly queryType = 'ListModulesQuery';
  constructor(private symbolTable: SymbolTable) {}
  
  async execute(query: ListModulesQuery): Promise<string[]> {
    const modules = new Set(this.symbolTable.definitions.getAll().map(s => s.module));
    return Array.from(modules);
  }
}
