export interface ASTLocation {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

export interface ASTNode {
  type: string;
  text: string;
  location: ASTLocation;
  children: ASTNode[];
}
