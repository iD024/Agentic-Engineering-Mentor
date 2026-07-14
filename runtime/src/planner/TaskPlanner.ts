import type { SymbolTable } from '../symbols/SymbolTable.js';

export class TaskPlanner {
  constructor(private symbolTable: SymbolTable) {}

  planTask(taskDescription: string) {
    const keywords = taskDescription.toLowerCase().split(/\s+/);
    const likelySymbols = this.symbolTable.definitions.getAll().filter(def => {
      const name = def.name.toLowerCase();
      return keywords.some(k => name.includes(k) || k.includes(name));
    });

    return {
      likelySymbols,
      likelyModules: Array.from(new Set(likelySymbols.map(s => s.module))),
      likelyFiles: Array.from(new Set(likelySymbols.map(s => s.location.filePath)))
    };
  }
}
