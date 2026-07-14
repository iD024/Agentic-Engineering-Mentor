import type { ASTNode } from './ASTNode.js';

export class ASTSerializer {
  static serialize(node: ASTNode): string {
    return JSON.stringify(node);
  }

  static deserialize(data: string): ASTNode {
    return JSON.parse(data) as ASTNode;
  }
}
