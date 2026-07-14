import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Parser = require('web-tree-sitter').Parser || require('web-tree-sitter');

export class TreeSitterManager {
  private static initialized = false;

  static async init() {
    if (!this.initialized) {
      await (Parser as any).init();
      this.initialized = true;
    }
  }

  static async loadLanguage(wasmPath: string): Promise<any> {
    await this.init();
    return await (Parser as any).Language.load(wasmPath);
  }
}
