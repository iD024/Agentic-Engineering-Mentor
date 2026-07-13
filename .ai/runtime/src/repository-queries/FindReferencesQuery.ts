import type { IQuery, IQueryHandler } from '../core/cqrs/interfaces.js';
import type { SymbolTable } from '../symbols/SymbolTable.js';
import type { SymbolReference } from '../symbols/types.js';

export class FindReferencesQuery implements IQuery<SymbolReference[]> {
  readonly type = 'FindReferencesQuery';
  constructor(public symbolId: string) {}
}

export class FindReferencesQueryHandler implements IQueryHandler<FindReferencesQuery, SymbolReference[]> {
  readonly queryType = 'FindReferencesQuery';
  constructor(private symbolTable: SymbolTable) {}
  
  async execute(query: FindReferencesQuery): Promise<SymbolReference[]> {
    return this.symbolTable.references.get(query.symbolId);
  }
}
