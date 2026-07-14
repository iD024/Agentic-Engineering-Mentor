import type { IQuery, IQueryHandler } from '../core/cqrs/interfaces.js';
import type { SymbolTable } from '../symbols/SymbolTable.js';
import type { SymbolDef } from '../symbols/types.js';

export class FindDefinitionQuery implements IQuery<SymbolDef | undefined> {
  readonly type = 'FindDefinitionQuery';
  constructor(public symbolId: string) {}
}

export class FindDefinitionQueryHandler implements IQueryHandler<FindDefinitionQuery, SymbolDef | undefined> {
  readonly queryType = 'FindDefinitionQuery';
  constructor(private symbolTable: SymbolTable) {}
  
  async execute(query: FindDefinitionQuery): Promise<SymbolDef | undefined> {
    return this.symbolTable.definitions.get(query.symbolId);
  }
}
