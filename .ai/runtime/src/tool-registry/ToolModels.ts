export type ToolCategory =
  | 'Foundation'
  | 'Workspace'
  | 'Repository'
  | 'Learning'
  | 'Session'
  | 'Knowledge'
  | 'Validation'
  | 'Pedagogical'
  | 'Runtime'
  | 'Tooling'
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
  permissions?: string[];
  parameters: Record<string, unknown>; // JSON Schema for parameters
  outputSchema?: Record<string, unknown>; // JSON Schema for output
  examples?: Array<{ name: string; description: string; input: unknown; output?: unknown }>;
  visibility: 'public' | 'internal';
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
