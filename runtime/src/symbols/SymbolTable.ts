import { DefinitionIndex } from './DefinitionIndex.js';
import { ReferenceIndex } from './ReferenceIndex.js';
import type { SymbolDef, SymbolReference } from './types.js';

export class SymbolTable {
  public definitions = new DefinitionIndex();
  public references = new ReferenceIndex();

  addDefinition(def: SymbolDef) {
    this.definitions.add(def);
  }

  addReference(ref: SymbolReference) {
    this.references.add(ref);
  }

  removeByFile(filePath: string) {
    this.definitions.removeByFile(filePath);
    this.references.removeByFile(filePath);
  }
}
