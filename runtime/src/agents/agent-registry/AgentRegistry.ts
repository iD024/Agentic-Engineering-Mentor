import type { IAgent, AgentCapability } from '../agent-runtime/types.js';

/**
 * Registry for available agent plugins.
 * Maintains an in-memory index of loaded agents and provides capability matching.
 */
export class AgentRegistry {
  private readonly agents: Map<string, IAgent> = new Map();

  register(agent: IAgent): void {
    if (this.agents.has(agent.manifest.id)) {
      throw new Error(`Agent with ID ${agent.manifest.id} is already registered.`);
    }
    this.agents.set(agent.manifest.id, agent);
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Returns a list of agents that support all of the required capabilities.
   */
  findAgentsByCapabilities(requiredCapabilities: AgentCapability[]): IAgent[] {
    return this.getAllAgents().filter(agent => {
      return requiredCapabilities.every(reqCap => agent.manifest.capabilities.includes(reqCap));
    });
  }

  /**
   * Returns the best match agent for a given set of capabilities.
   */
  getBestAgentForCapabilities(requiredCapabilities: AgentCapability[]): IAgent | undefined {
    const matches = this.findAgentsByCapabilities(requiredCapabilities);
    // Simple heuristic: pick the first one. 
    // Could be extended to score agents based on specialized matching.
    return matches.length > 0 ? matches[0] : undefined;
  }
}
