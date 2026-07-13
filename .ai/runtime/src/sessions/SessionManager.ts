export class ConversationContext {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly startTime: number,
    public metadata: Record<string, unknown> = {}
  ) {}
}

export class RuntimeSession {
  private conversations: Map<string, ConversationContext> = new Map();
  
  constructor(
    public readonly id: string,
    public readonly startTime: number,
    public metadata: Record<string, unknown> = {}
  ) {}

  startConversation(metadata?: Record<string, unknown>): ConversationContext {
    const id = crypto.randomUUID();
    const conv = new ConversationContext(id, this.id, Date.now(), metadata);
    this.conversations.set(id, conv);
    return conv;
  }

  getConversation(id: string): ConversationContext | undefined {
    return this.conversations.get(id);
  }

  getConversations(): ConversationContext[] {
    return Array.from(this.conversations.values());
  }
}

export class SessionManager {
  private sessions: Map<string, RuntimeSession> = new Map();

  createSession(metadata?: Record<string, unknown>): RuntimeSession {
    const id = crypto.randomUUID();
    const session = new RuntimeSession(id, Date.now(), metadata);
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): RuntimeSession | undefined {
    return this.sessions.get(id);
  }

  endSession(id: string): void {
    this.sessions.delete(id);
  }
}
