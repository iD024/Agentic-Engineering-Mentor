import type { SymbolReference } from './types.js';

export class ReferenceIndex {
  // symbolId -> SymbolReference[]
  private refs = new Map<string, SymbolReference[]>();

  add(ref: SymbolReference) {
    const existing = this.refs.get(ref.symbolId) || [];
    existing.push(ref);
    this.refs.set(ref.symbolId, existing);
  }

  get(symbolId: string): SymbolReference[] {
    return this.refs.get(symbolId) || [];
  }

  removeByFile(filePath: string) {
    for (const [symbolId, references] of this.refs.entries()) {
      const filtered = references.filter(r => r.location.filePath !== filePath);
      if (filtered.length === 0) {
        this.refs.delete(symbolId);
      } else {
        this.refs.set(symbolId, filtered);
      }
    }
  }
}
