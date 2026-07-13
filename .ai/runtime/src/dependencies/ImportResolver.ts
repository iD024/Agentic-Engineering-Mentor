import type { ASTNode } from '../ast/ASTNode.js';

export class ImportResolver {
  resolveImports(ast: ASTNode): string[] {
    const imports: string[] = [];
    this.traverse(ast, imports);
    return imports;
  }

  private traverse(node: ASTNode, imports: string[]) {
    if (node.type === 'import_statement' || node.type === 'import_declaration') {
      const source = node.children.find(c => c.type === 'string');
      if (source) {
        imports.push(source.text.replace(/['"]/g, ''));
      }
    }
    for (const child of node.children) {
      this.traverse(child, imports);
    }
  }
}
