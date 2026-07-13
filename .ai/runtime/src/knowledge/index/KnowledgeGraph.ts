import { GraphNode, GraphEdge } from '../types.js';

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();

  public addNode(node: GraphNode): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
    }
  }

  public addEdge(edge: GraphEdge): void {
    if (!this.edges.has(edge.id)) {
      this.edges.set(edge.id, edge);
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getEdges(nodeId: string, direction: 'in' | 'out' | 'both' = 'both'): GraphEdge[] {
    const result: GraphEdge[] = [];
    for (const edge of this.edges.values()) {
      if ((direction === 'out' || direction === 'both') && edge.source === nodeId) {
        result.push(edge);
      }
      if ((direction === 'in' || direction === 'both') && edge.target === nodeId) {
        result.push(edge);
      }
    }
    return result;
  }

  public searchNodes(query: string, type?: GraphNode['type']): GraphNode[] {
    const q = query.toLowerCase();
    const result: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (type && node.type !== type) continue;
      if (node.label.toLowerCase().includes(q)) {
        result.push(node);
      }
    }
    return result;
  }

  public export(): { nodes: GraphNode[], edges: GraphEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }

  public import(data: { nodes: GraphNode[], edges: GraphEdge[] }): void {
    data.nodes.forEach(n => this.addNode(n));
    data.edges.forEach(e => this.addEdge(e));
  }
}
