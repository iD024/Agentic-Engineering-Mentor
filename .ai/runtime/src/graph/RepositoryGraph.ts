import type { GraphNode } from './GraphNode.js';
import type { GraphEdge } from './GraphEdge.js';
import type { ASTNode } from '../ast/ASTNode.js';
import type { SymbolTable } from '../symbols/SymbolTable.js';
import type { DependencyGraph } from '../dependencies/DependencyGraph.js';

export class RepositoryGraph {
  public nodes = new Map<string, GraphNode>();
  public edges = new Map<string, GraphEdge>();

  addNode(node: GraphNode) {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: GraphEdge) {
    this.edges.set(edge.id, edge);
  }

  mergeAST(filePath: string, ast: ASTNode) {
    // Merge AST nodes into graph
    const id = `ast:${filePath}`;
    this.addNode({ id, type: 'ast_root', payload: ast });
  }

  mergeSymbols(table: SymbolTable) {
    // Merge symbols into graph
    for (const def of table.definitions.getAll()) {
      this.addNode({ id: `symbol:${def.id}`, type: 'symbol_def', payload: def });
    }
  }

  mergeDependencies(deps: DependencyGraph) {
    // Merge dependency edges
    for (const edge of deps.edges) {
      this.addEdge({ id: `dep:${edge.sourceId}->${edge.targetId}`, sourceId: edge.sourceId, targetId: edge.targetId, type: 'dependency' });
    }
  }
}
