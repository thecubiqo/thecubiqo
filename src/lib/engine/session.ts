import { Session, Message } from '@/types/session';
import { randomUUID } from 'crypto';
import { countMessageTokens, countConversationTokens, shouldCompact, getTokenLimit } from '@/lib/utils/token-counter';
import { callLLM } from '@/lib/ai/llm-router';
import { ModelConfig } from '@/types/agent';

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
      tokenCount: countMessageTokens(message),
    };

    const sessionMessages = messages.get(sessionId) || [];
    sessionMessages.push(msg);
    messages.set(sessionId, sessionMessages);

    // Update session stats
    const session = await this.get(sessionId);
    session.messageCount++;
    session.updatedAt = new Date();

    // Update total tokens
    const totalTokens = sessionMessages.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
    session.totalTokens = totalTokens;

    return msg;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const session = await this.get(sessionId);
    Object.assign(session, updates);
    session.updatedAt = new Date();
    sessions.set(sessionId, session);
    return session;
  }

  /**
   * Compact a session by summarizing old messages
   * Keeps: system messages, first message, last N messages
   * Summarizes: everything in between
   */
  async compactSession(
    sessionId: string,
    model: ModelConfig,
    options: {
      keepRecentCount?: number;
      forceCompact?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    originalTokens: number;
    compactedTokens: number;
    tokensSaved: number;
    messagesBefore: number;
    messagesAfter: number;
  }> {
    const { keepRecentCount = 10, forceCompact = false } = options;

    const session = await this.get(sessionId);
    const sessionMessages = messages.get(sessionId) || [];

    // Calculate current token count
    const originalTokens = countConversationTokens(sessionMessages);

    // Check if compaction is needed
    if (!forceCompact && !shouldCompact(originalTokens, model.model)) {
      return {
        success: false,
        originalTokens,
        compactedTokens: originalTokens,
        tokensSaved: 0,
        messagesBefore: sessionMessages.length,
        messagesAfter: sessionMessages.length,
      };
    }

    console.log(`[Compaction] Starting for session ${sessionId}`);
    console.log(`[Compaction] Original: ${sessionMessages.length} messages, ~${originalTokens} tokens`);

    // Separate messages into categories
    const systemMessages = sessionMessages.filter((m) => m.role === 'system');
    const nonSystemMessages = sessionMessages.filter((m) => m.role !== 'system');

    // If not enough messages to compact, skip
    if (nonSystemMessages.length <= keepRecentCount + 1) {
      console.log(`[Compaction] Too few messages to compact (${nonSystemMessages.length})`);
      return {
        success: false,
        originalTokens,
        compactedTokens: originalTokens,
        tokensSaved: 0,
        messagesBefore: sessionMessages.length,
        messagesAfter: sessionMessages.length,
      };
    }

    // Keep first message (context) and last N messages
    const firstMessage = nonSystemMessages[0];
    const recentMessages = nonSystemMessages.slice(-keepRecentCount);
    const middleMessages = nonSystemMessages.slice(1, -keepRecentCount);

    // Build conversation to summarize
    const conversationToSummarize = middleMessages
      .map((m) => `[${m.role}]: ${m.content}`)
      .join('\n\n');

    // Use LLM to create summary
    const summaryPrompt = `You are summarizing a conversation between a user and an AI assistant. Preserve:
- Key facts and context shared by the user
- Important decisions made
- Tool usage and results
- Any persistent context needed for future messages

Be concise but preserve critical information.

Conversation to summarize (${middleMessages.length} messages):

${conversationToSummarize}

Provide a clear, structured summary:`;

    try {
      const summaryResponse = await callLLM({
        model,
        messages: [{ role: 'user', content: summaryPrompt }],
        maxTokens: 2000,
        temperature: 0.3,
      });

      // Create summary message
      const summaryMessage: Message = {
        id: randomUUID(),
        sessionId,
        role: 'summary',
        content: `[CONVERSATION SUMMARY - ${middleMessages.length} messages compacted]\n\n${summaryResponse.content}`,
        createdAt: new Date(),
        tokenCount: countMessageTokens({ role: 'summary', content: summaryResponse.content }),
        isSummary: true,
        summarizedMessageIds: middleMessages.map((m) => m.id),
      };

      // Rebuild message array
      const compactedMessages = [
        ...systemMessages,
        firstMessage,
        summaryMessage,
        ...recentMessages,
      ];

      // Update storage
      messages.set(sessionId, compactedMessages);

      // Update session
      const compactedTokens = countConversationTokens(compactedMessages);
      session.messageCount = compactedMessages.length;
      session.totalTokens = compactedTokens;
      session.lastCompactedAt = new Date();
      session.updatedAt = new Date();
      sessions.set(sessionId, session);

      const tokensSaved = originalTokens - compactedTokens;
      const savingsPercent = ((tokensSaved / originalTokens) * 100).toFixed(1);

      console.log(`[Compaction] Complete!`);
      console.log(`[Compaction] After: ${compactedMessages.length} messages, ~${compactedTokens} tokens`);
      console.log(`[Compaction] Saved: ~${tokensSaved} tokens (${savingsPercent}%)`);

      return {
        success: true,
        originalTokens,
        compactedTokens,
        tokensSaved,
        messagesBefore: sessionMessages.length,
        messagesAfter: compactedMessages.length,
      };
    } catch (error) {
      console.error(`[Compaction] Failed:`, error);
      throw new Error(`Session compaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if session needs compaction
   */
  needsCompaction(sessionId: string, modelName: string, threshold: number = 0.75): boolean {
    const session = sessions.get(sessionId);
    if (!session || !session.totalTokens) return false;

    return shouldCompact(session.totalTokens, modelName, threshold);
  }

  /**
   * Get token usage stats for a session
   */
  getTokenStats(sessionId: string): {
    totalTokens: number;
    messageCount: number;
    averageTokensPerMessage: number;
  } {
    const sessionMessages = messages.get(sessionId) || [];
    const totalTokens = countConversationTokens(sessionMessages);
    
    return {
      totalTokens,
      messageCount: sessionMessages.length,
      averageTokensPerMessage: sessionMessages.length > 0 ? Math.round(totalTokens / sessionMessages.length) : 0,
    };
  }
}
