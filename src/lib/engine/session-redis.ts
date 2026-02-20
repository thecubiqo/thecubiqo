// Enhanced session store with Redis support
import { Session, Message } from '@/types/session';
import { randomUUID } from 'crypto';
import { SessionCache } from '@/lib/cache/redis';

// In-memory fallback store
const memorySession = new Map<string, Session>();
const memoryMessages = new Map<string, Message[]>();

// Redis cache instance
let redisCache: SessionCache | null = null;

function getSessionCache(): SessionCache | null {
  if (!redisCache) {
    try {
      redisCache = new SessionCache();
    } catch (error) {
      console.warn('Redis cache not available, using in-memory store');
      return null;
    }
  }
  return redisCache;
}

export class SessionStore {
  private agentId: string;
  private cache: SessionCache | null;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.cache = getSessionCache();
  }

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

    // Store in Redis if available
    if (this.cache) {
      await this.cache.setSession(session.id, session, 3600); // 1 hour TTL
    }

    // Always store in memory as fallback
    memorySession.set(session.id, session);
    memoryMessages.set(session.id, []);

    return session;
  }

  async get(sessionId: string): Promise<Session> {
    // Try Redis first
    if (this.cache) {
      const session = await this.cache.getSession<Session>(sessionId);
      if (session) {
        return session;
      }
    }

    // Fallback to memory
    const session = memorySession.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  async list(): Promise<Session[]> {
    // For now, use memory store for listing
    // In production, consider using Redis SCAN with pattern matching
    return Array.from(memorySession.values()).filter((s) => s.agentId === this.agentId);
  }

  async delete(sessionId: string): Promise<void> {
    // Delete from Redis
    if (this.cache) {
      await this.cache.deleteSession(sessionId);
      await this.cache.delete(`messages:${sessionId}`);
    }

    // Delete from memory
    memorySession.delete(sessionId);
    memoryMessages.delete(sessionId);
  }

  async getHistory(sessionId: string, limit?: number): Promise<Message[]> {
    // Try Redis first
    if (this.cache) {
      const messages = await this.cache.getMessages(sessionId);
      if (messages.length > 0) {
        return limit ? messages.slice(-limit) : messages;
      }
    }

    // Fallback to memory
    const sessionMessages = memoryMessages.get(sessionId) || [];
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

    // Add to Redis
    if (this.cache) {
      await this.cache.addMessage(sessionId, msg);
    }

    // Add to memory
    const sessionMessages = memoryMessages.get(sessionId) || [];
    sessionMessages.push(msg);
    memoryMessages.set(sessionId, sessionMessages);

    // Update session stats
    const session = await this.get(sessionId);
    session.messageCount++;
    session.updatedAt = new Date();
    await this.updateSession(sessionId, session);

    return msg;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const session = await this.get(sessionId);
    Object.assign(session, updates);
    session.updatedAt = new Date();

    // Update in Redis
    if (this.cache) {
      await this.cache.setSession(sessionId, session, 3600);
    }

    // Update in memory
    memorySession.set(sessionId, session);
    
    return session;
  }

  /**
   * Cleanup expired sessions from memory
   * Should be called periodically
   */
  async cleanup(maxAgeMs: number = 3600000): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of memorySession.entries()) {
      const age = now - session.updatedAt.getTime();
      if (age > maxAgeMs) {
        await this.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}
