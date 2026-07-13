import type { ExecutionContext } from '../core/execution/ExecutionContext.js';
import type { ToolDescriptor, ToolResult } from './ToolModels.js';

export interface ToolContext extends ExecutionContext {
  toolName: string;
}

export interface Tool<TParams = unknown, TResult = unknown> {
  readonly descriptor: ToolDescriptor;
  
  execute(params: TParams, context: ToolContext): Promise<ToolResult<TResult>>;
}
