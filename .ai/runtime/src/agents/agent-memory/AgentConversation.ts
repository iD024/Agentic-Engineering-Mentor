/**
 * Represents a single turn or step in an agent conversation.
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Represents the ongoing dialogue between the user (or system) and the agent.
 */
export class AgentConversation {
  private messages: ConversationMessage[] = [];

  constructor(public readonly conversationId: string) {}

  addMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): ConversationMessage {
    const fullMessage: ConversationMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    this.messages.push(fullMessage);
    return fullMessage;
  }

  getHistory(): ReadonlyArray<ConversationMessage> {
    return this.messages;
  }
}
