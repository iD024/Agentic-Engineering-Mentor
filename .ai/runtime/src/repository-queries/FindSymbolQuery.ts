import type { IQuery, IQueryHandler } from '../core/cqrs/interfaces.js';
import type { SymbolTable } from '../symbols/SymbolTable.js';
import type { SymbolDef } from '../symbols/types.js';

export class FindSymbolQuery implements IQuery<SymbolDef[]> {
  readonly type = 'FindSymbolQuery';
  constructor(public namePattern: string) {}
}

export class FindSymbolQueryHandler implements IQueryHandler<FindSymbolQuery, SymbolDef[]> {
  readonly queryType = 'FindSymbolQuery';
  constructor(private symbolTable: SymbolTable) {}
  
  async execute(query: FindSymbolQuery): Promise<SymbolDef[]> {
    const pattern = query.namePattern.toLowerCase();
    return this.symbolTable.definitions.getAll().filter(def => def.name.toLowerCase().includes(pattern));
  }
}
