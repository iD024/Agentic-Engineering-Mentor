import type { ExecutionContext } from '../core/execution/ExecutionContext.js';

export interface RawContext {
  workspace: any;
  // Other raw data
}

export class ContextBuilder {
  async build(context: ExecutionContext): Promise<RawContext> {
    // Collect deterministic runtime context
    return {
      workspace: {}
    };
  }
}
