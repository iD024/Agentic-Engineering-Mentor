import type { ImpactAnalyzer } from '../dependencies/ImpactAnalyzer.js';

export class ImpactPlanner {
  constructor(private analyzer: ImpactAnalyzer) {}

  planImpact(changedFiles: string[]) {
    const allAffected = new Set<string>();
    for (const file of changedFiles) {
      const affected = this.analyzer.analyze(file);
      affected.forEach(f => allAffected.add(f));
    }
    return {
      affectedFiles: Array.from(allAffected),
      riskLevel: allAffected.size > 10 ? 'HIGH' : 'LOW'
    };
  }
}
