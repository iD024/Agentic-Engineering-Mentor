import type { GraphNode, GraphEdge } from '../graph/index.js';

export class DependencyGraph {
  public nodes = new Map<string, GraphNode>();
  public edges: GraphEdge[] = [];

  addNode(node: GraphNode) {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: GraphEdge) {
    this.edges.push(edge);
  }

  getIncomingEdges(nodeId: string): GraphEdge[] {
    return this.edges.filter(e => e.targetId === nodeId);
  }

  getOutgoingEdges(nodeId: string): GraphEdge[] {
    return this.edges.filter(e => e.sourceId === nodeId);
  }
}
