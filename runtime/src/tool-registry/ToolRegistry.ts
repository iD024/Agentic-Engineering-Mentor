import type { Tool } from './Tool.js';
import type { ToolDescriptor } from './ToolModels.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    if (this.tools.has(tool.descriptor.name)) {
      throw new Error(`Tool ${tool.descriptor.name} is already registered.`);
    }
    this.tools.set(tool.descriptor.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getDescriptors(): ToolDescriptor[] {
    return this.getAll().map(t => t.descriptor);
  }
}
