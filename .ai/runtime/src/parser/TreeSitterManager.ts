import Parser from 'web-tree-sitter';

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
