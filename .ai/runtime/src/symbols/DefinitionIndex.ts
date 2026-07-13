import type { SymbolDef } from './types.js';

export class DefinitionIndex {
  private defs = new Map<string, SymbolDef>();

  add(def: SymbolDef) {
    this.defs.set(def.id, def);
  }

  get(id: string): SymbolDef | undefined {
    return this.defs.get(id);
  }

  getAll(): SymbolDef[] {
    return Array.from(this.defs.values());
  }

  removeByFile(filePath: string) {
    for (const [id, def] of this.defs.entries()) {
      if (def.location.filePath === filePath) {
        this.defs.delete(id);
      }
    }
  }
}
