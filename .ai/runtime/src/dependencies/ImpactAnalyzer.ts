import type { DependencyGraph } from './DependencyGraph.js';

export class ImpactAnalyzer {
  constructor(private graph: DependencyGraph) {}

  analyze(changedFilePath: string): string[] {
    const affected = new Set<string>();
    const queue = [changedFilePath];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!affected.has(current)) {
        affected.add(current);
        const incoming = this.graph.getIncomingEdges(current);
        for (const edge of incoming) {
          queue.push(edge.sourceId);
        }
      }
    }

    return Array.from(affected);
  }
}
