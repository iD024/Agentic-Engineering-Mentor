import type { IAgent } from '../agent-runtime/types.js';
import type { AgentRegistry } from './AgentRegistry.js';

/**
 * Responsible for loading agent plugins into the registry.
 */
export class AgentLoader {
  constructor(private registry: AgentRegistry) {}

  /**
   * Registers a pre-instantiated agent plugin.
   * In a real dynamic plugin system, this might dynamically import(path).
   */
  loadPlugin(agent: IAgent): void {
    this.registry.register(agent);
  }

  /**
   * Loads multiple plugins at once.
   */
  loadPlugins(agents: IAgent[]): void {
    for (const agent of agents) {
      this.loadPlugin(agent);
    }
  }
}
