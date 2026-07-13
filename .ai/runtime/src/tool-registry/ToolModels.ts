export type ToolCategory =
  | 'Workspace'
  | 'Repository'
  | 'Learning'
  | 'Session'
  | 'Analysis'
  | 'System'
  | 'Other';

export interface ToolVersion {
  major: number;
  minor: number;
  patch: number;
  toString(): string;
}

export class SemanticVersion implements ToolVersion {
  constructor(public major: number, public minor: number, public patch: number) {}
  
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}

export interface ToolDescriptor {
  name: string;
  description: string;
  category: ToolCategory;
  version: ToolVersion;
  parameters: Record<string, unknown>; // JSON Schema for parameters
}

export interface ToolManifest {
  tools: ToolDescriptor[];
  namespace?: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}
