import { ImpactPlanner } from './ImpactPlanner.js';
import { TaskPlanner } from './TaskPlanner.js';
import type { ImpactAnalyzer } from '../dependencies/ImpactAnalyzer.js';
import type { SymbolTable } from '../symbols/SymbolTable.js';

export class RepositoryPlanner {
  public impact: ImpactPlanner;
  public task: TaskPlanner;

  constructor(analyzer: ImpactAnalyzer, symbolTable: SymbolTable) {
    this.impact = new ImpactPlanner(analyzer);
    this.task = new TaskPlanner(symbolTable);
  }
}
