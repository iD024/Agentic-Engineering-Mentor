import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Parser = require('web-tree-sitter').Parser || require('web-tree-sitter');
import type { ASTNode } from '../ast/ASTNode.js';
import { ASTBuilder } from '../ast/ASTBuilder.js';

export class LanguageParser {
  private parser: any;

  constructor(language: any) {
    this.parser = new (Parser as any)();
    this.parser.setLanguage(language);
  }

  parse(code: string): ASTNode {
    const tree = this.parser.parse(code);
    return ASTBuilder.build(tree.rootNode);
  }
}
