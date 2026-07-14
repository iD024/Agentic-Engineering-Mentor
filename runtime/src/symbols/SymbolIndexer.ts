import type { ASTNode } from '../ast/ASTNode.js';
import type { SymbolTable } from './SymbolTable.js';

export class SymbolIndexer {
  constructor(private table: SymbolTable) {}

  indexFile(filePath: string, moduleName: string, ast: ASTNode, language: string) {
    this.table.removeByFile(filePath);
    this.traverse(ast, filePath, moduleName, language);
  }

  private traverse(node: ASTNode, filePath: string, moduleName: string, language: string) {
    if (node.type === 'class_declaration' || node.type === 'function_declaration') {
      const name = this.extractName(node) || 'Unknown';
      this.table.addDefinition({
        id: `${filePath}#${name}`,
        name,
        kind: node.type === 'class_declaration' ? 'Class' : 'Function',
        location: {
          filePath,
          startRow: node.location.startRow,
          startColumn: node.location.startColumn,
        },
        language,
        visibility: 'public',
        module: moduleName
      });
    }

    for (const child of node.children) {
      this.traverse(child, filePath, moduleName, language);
    }
  }

  private extractName(node: ASTNode): string | null {
    const idNode = node.children.find(c => c.type === 'identifier');
    return idNode ? idNode.text : null;
  }
}
