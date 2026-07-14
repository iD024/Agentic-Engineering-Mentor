import type { ASTNode, ASTLocation } from './ASTNode.js';

export class ASTBuilder {
  /**
   * Converts a Tree-sitter SyntaxNode into our runtime ASTNode.
   */
  static build(node: any): ASTNode {
    return {
      type: node.type,
      text: node.text,
      location: {
        startRow: node.startPosition.row,
        startColumn: node.startPosition.column,
        endRow: node.endPosition.row,
        endColumn: node.endPosition.column,
      },
      children: node.namedChildren.map((child: any) => this.build(child)),
    };
  }
}
