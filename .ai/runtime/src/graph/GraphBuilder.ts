import { RepositoryGraph } from './RepositoryGraph.js';

export class GraphBuilder {
  static build(): RepositoryGraph {
    return new RepositoryGraph();
  }
}
