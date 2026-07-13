import type { RawContext } from './ContextBuilder.js';

export class ContextSnapshot {
  constructor(private readonly data: RawContext) {}

  get workspace(): any {
    return this.data.workspace;
  }
}
