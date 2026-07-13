import type { IQuery, IQueryHandler } from '../core/cqrs/interfaces.js';
import type { ImpactPlanner } from '../planner/ImpactPlanner.js';

export class ImpactAnalysisQuery implements IQuery<any> {
  readonly type = 'ImpactAnalysisQuery';
  constructor(public changedFiles: string[]) {}
}

export class ImpactAnalysisQueryHandler implements IQueryHandler<ImpactAnalysisQuery, any> {
  readonly queryType = 'ImpactAnalysisQuery';
  constructor(private impactPlanner: ImpactPlanner) {}
  
  async execute(query: ImpactAnalysisQuery): Promise<any> {
    return this.impactPlanner.planImpact(query.changedFiles);
  }
}
