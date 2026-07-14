export interface SymbolLocation {
  filePath: string;
  startRow: number;
  startColumn: number;
}

export type SymbolKind = 'Class' | 'Interface' | 'Method' | 'Function' | 'Variable' | 'Enum' | 'Namespace' | 'Import' | 'Export' | 'Type';
export type SymbolVisibility = 'public' | 'private' | 'protected' | 'internal';

export interface SymbolDef {
  id: string;
  name: string;
  kind: SymbolKind;
  location: SymbolLocation;
  language: string;
  visibility: SymbolVisibility;
  module: string;
}

export interface SymbolReference {
  symbolId: string;
  location: SymbolLocation;
}
