import type { ToolDescriptor } from '../tool-registry/ToolModels.js';
import type { ExecutionContext } from '../core/execution/ExecutionContext.js';
import { PermissionError } from '../errors/GatewayErrors.js';

export type ToolCapability = 'read' | 'write' | 'execute' | 'admin';

export interface ToolPermission {
  toolName: string;
  capabilities: ToolCapability[];
}

export class PermissionManager {
  private allowedTools: Set<string> = new Set();

  grant(toolName: string): void {
    this.allowedTools.add(toolName);
  }

  revoke(toolName: string): void {
    this.allowedTools.delete(toolName);
  }

  check(tool: ToolDescriptor, context: ExecutionContext): void {
    if (!this.allowedTools.has(tool.name)) {
      throw new PermissionError(`Tool execution denied for ${tool.name}`, {
        toolName: tool.name,
        requestId: context.requestId
      });
    }
  }
}
