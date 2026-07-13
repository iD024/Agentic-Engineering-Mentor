import type { AgentConversation } from './AgentConversation.js';

export interface MemoryQuery {
  keywords?: string[];
  timeRange?: { start: Date; end: Date };
  limit?: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/**
 * Interface defining how an agent reads and writes long-term and short-term memory.
 * Implementation will bridge to the Knowledge Platform.
 */
export interface AgentMemory {
  /**
   * Retrieves the current conversation context.
   */
  getConversation(conversationId: string): Promise<AgentConversation | undefined>;
  
  /**
   * Saves or updates a conversation.
   */
  saveConversation(conversation: AgentConversation): Promise<void>;

  /**
   * Stores a piece of long-term memory.
   */
  store(content: string, tags: string[], metadata?: Record<string, unknown>): Promise<string>;

  /**
   * Retrieves long-term memory based on a query.
   */
  recall(query: MemoryQuery): Promise<MemoryEntry[]>;
}
