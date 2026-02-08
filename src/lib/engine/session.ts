import { Session, Message } from '@/types/session';
import { randomUUID } from 'crypto';

// In-memory session store (TODO: move to Supabase)
const sessions = new Map<string, Session>();
const messages = new Map<string, Message[]>();

export class SessionStore {
  constructor(private agentId: string) {}

  async create(agentId: string, channel: string = 'internal', userId?: string): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      agentId,
      sessionKey: `agent:${agentId}:session:${randomUUID()}`,
      channel,
      status: 'idle',
      messageCount: 0,
      tokenUsage: { input: 0, output: 0 },
      estimatedCost: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
    };

    sessions.set(session.id, session);
    messages.set(session.id, []);

    return session;
  }

  async get(sessionId: string): Promise<Session> {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  async list(): Promise<Session[]> {
    return Array.from(sessions.values()).filter((s) => s.agentId === this.agentId);
  }

  async delete(sessionId: string): Promise<void> {
    sessions.delete(sessionId);
    messages.delete(sessionId);
  }

  async getHistory(sessionId: string, limit?: number): Promise<Message[]> {
    const sessionMessages = messages.get(sessionId) || [];
    if (limit) {
      return sessionMessages.slice(-limit);
    }
    return sessionMessages;
  }

  async addMessage(
    sessionId: string,
    message: Omit<Message, 'id' | 'sessionId' | 'createdAt'>
  ): Promise<Message> {
    const msg: Message = {
      id: randomUUID(),
      sessionId,
      ...message,
      createdAt: new Date(),
    };

    const sessionMessages = messages.get(sessionId) || [];
    sessionMessages.push(msg);
    messages.set(sessionId, sessionMessages);

    // Update session stats
    const session = await this.get(sessionId);
    session.messageCount++;
    session.updatedAt = new Date();

    return msg;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const session = await this.get(sessionId);
    Object.assign(session, updates);
    session.updatedAt = new Date();
    sessions.set(sessionId, session);
    return session;
  }
}
