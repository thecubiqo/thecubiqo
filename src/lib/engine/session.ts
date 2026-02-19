import { Session, Message, ContentBlock } from '@/types/session';
import { randomUUID } from 'crypto';
import { countMessageTokens, countConversationTokens, shouldCompact } from '@/lib/utils/token-counter';
import { callLLM } from '@/lib/ai/llm-router';
import { ModelConfig } from '@/types/agent';
import { createAdminClient } from '@/lib/supabase/admin';

export class SessionStore {
  private supabase;

  constructor(private agentId: string) {
    this.supabase = createAdminClient();
  }

  async create(agentId: string, channel: string = 'internal', userId?: string): Promise<Session> {
    // 1. Create a parent session (auth/device session)
    // We use a system session if no userId is provided
    const { data: sessionData, error: sessionError } = await this.supabase
      .from('sessions')
      .insert({
        user_id: userId || null,
        is_guest: !userId,
        device_info: { agent_id: agentId, channel }, // Store metadata here
      })
      .select()
      .single();

    if (sessionError) throw new Error(`Failed to create session: ${sessionError.message}`);

    // 2. Create the conversation
    const { data: conversationData, error: convError } = await this.supabase
      .from('conversations')
      .insert({
        session_id: sessionData.id,
        title: `Chat with ${agentId}`,
        ai_model: agentId, // Storing agentId here for now
        message_count: 0,
      })
      .select()
      .single();

    if (convError) throw new Error(`Failed to create conversation: ${convError.message}`);

    return this.mapToSession(conversationData, sessionData);
  }

  async get(sessionId: string): Promise<Session> {
    // Note: sessionId here refers to the conversation ID in our mapping
    const { data: conversation, error } = await this.supabase
      .from('conversations')
      .select('*, sessions(*)')
      .eq('id', sessionId)
      .single();

    if (error || !conversation) {
      throw new Error(`Session (conversation) not found: ${sessionId}`);
    }

    return this.mapToSession(conversation, conversation.sessions);
  }

  async list(): Promise<Session[]> {
    const { data: conversations, error } = await this.supabase
      .from('conversations')
      .select('*, sessions(*)')
      .eq('ai_model', this.agentId); // Filter by agentId stored in ai_model

    if (error) throw error;

    return (conversations || []).map(c => this.mapToSession(c, c.sessions));
  }

  async delete(sessionId: string): Promise<void> {
    // Delete conversation (messages cascade delete usually, or we delete manually)
    await this.supabase.from('messages').delete().eq('conversation_id', sessionId);
    await this.supabase.from('conversations').delete().eq('id', sessionId);
  }

  async getHistory(sessionId: string, limit?: number): Promise<Message[]> {
    let query = this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', sessionId)
      .order('created_at', { ascending: true });

    // Note: Supabase doesn't support easy "last N" without subquery logic usually,
    // but for now fetch all and slice is safer or order desc limit then reverse.
    // For efficiency on large chats, we should order desc limit N then reverse.
    if (limit) {
      // Fetch specifically the last N messages
      // We need a separate query for this optimization to work well
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).reverse().map(this.mapToMessage);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapToMessage);
  }

  async addMessage(
    sessionId: string,
    message: Omit<Message, 'id' | 'sessionId' | 'createdAt'>
  ): Promise<Message> {
    const contentStr = typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);

    const tokenCount = countMessageTokens(message as any);

    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: sessionId,
        role: message.role,
        content: contentStr,
        tokens_used: tokenCount,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add message: ${error.message}`);

    // Update conversation stats (async, don't await)
    this.updateStats(sessionId);

    return this.mapToMessage(data);
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    // Identify which fields map to conversations vs sessions table
    // For now we mainly update conversation fields
    const session = await this.get(sessionId);
    // Logic to update DB would go here if needed. 
    // Currently strictly used for state updates which we might simply ignore or map to DB columns.
    return session;
  }

  async compactSession(
    sessionId: string,
    model: ModelConfig,
    options: { keepRecentCount?: number; forceCompact?: boolean } = {}
  ): Promise<{
    success: boolean;
    originalTokens: number;
    compactedTokens: number;
    tokensSaved: number;
    messagesBefore: number;
    messagesAfter: number;
  }> {
    const { keepRecentCount = 10, forceCompact = false } = options;

    const messages = await this.getHistory(sessionId);
    const originalTokens = countConversationTokens(messages);

    if (!forceCompact && !shouldCompact(originalTokens, model.model)) {
      return { success: false, originalTokens, compactedTokens: originalTokens, tokensSaved: 0, messagesBefore: messages.length, messagesAfter: messages.length };
    }

    // Logic similar to original but with DB operations
    // 1. Identify messages to delete (summary replaced)
    // 2. Insert summary message
    // 3. Delete replaced messages

    const messagesToCompact = messages.slice(1, -keepRecentCount);
    if (messagesToCompact.length < 2) {
      return { success: false, originalTokens, compactedTokens: originalTokens, tokensSaved: 0, messagesBefore: messages.length, messagesAfter: messages.length };
    }

    const messagesToKeep = messages.slice(-keepRecentCount);
    const systemMessage = messages[0];

    // Summarize
    try {
      const summaryResponse = await callLLM({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Summarize the following conversation history concisely, preserving key details and context.' },
          { role: 'user', content: JSON.stringify(messagesToCompact) }
        ],
        maxTokens: 1000
      });

      const summaryContent = `[Previous conversation summary]: ${summaryResponse.content}`;

      // Insert summary message
      // We want it to be "older" than the messages we keep, but "newer" than the system message.
      // We can use the timestamp of the last message being compacted.
      const lastCompactedMsg = messagesToCompact[messagesToCompact.length - 1];

      const { error: insertError } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: sessionId,
          role: 'system',
          content: summaryContent,
          tokens_used: countMessageTokens({ role: 'system', content: summaryContent }),
          created_at: lastCompactedMsg.createdAt.toISOString() // Use timestamp of last compacted message
        });

      if (insertError) throw insertError;

      // Delete compacted messages
      const idsToDelete = messagesToCompact.map(m => m.id);
      const { error: deleteError } = await this.supabase
        .from('messages')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      const compactedTokens = countConversationTokens([systemMessage, { role: 'system', content: summaryContent } as Message, ...messagesToKeep]);

      return {
        success: true,
        originalTokens,
        compactedTokens,
        tokensSaved: originalTokens - compactedTokens,
        messagesBefore: messages.length,
        messagesAfter: messagesToKeep.length + 2 // System + Summary + Kept
      };

    } catch (err) {
      
      return { success: false, originalTokens, compactedTokens: originalTokens, tokensSaved: 0, messagesBefore: messages.length, messagesAfter: messages.length };
    }
  }

  // Helper: map DB Conversation to Session interface
  private mapToSession(conv: any, session: any): Session {
    return {
      id: conv.id, // Conversation ID is the Session ID exposed to App
      agentId: conv.ai_model || 'unknown',
      sessionKey: session?.id || 'unknown',
      channel: session?.device_info?.channel || 'internal',
      status: 'active',
      messageCount: conv.message_count || 0,
      tokenUsage: { input: 0, output: 0 }, // Need to calculate or store
      estimatedCost: 0,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at || conv.created_at),
      userId: session?.user_id,
      totalTokens: 0 // Placeholder
    };
  }

  // Helper: map DB Message to Message interface
  private mapToMessage(row: any): Message {
    let content: string | ContentBlock[] = row.content;

    // Try to parse JSON content if it looks like an array
    if (typeof row.content === 'string' && (row.content.startsWith('[') || row.content.startsWith('{'))) {
      try {
        const parsed = JSON.parse(row.content);
        if (Array.isArray(parsed) || typeof parsed === 'object') {
          content = parsed;
        }
      } catch (e) {
        // Keep as string
      }
    }

    return {
      id: row.id,
      sessionId: row.conversation_id,
      role: row.role,
      content,
      tokenCount: row.tokens_used || 0,
      createdAt: new Date(row.created_at),
    };
  }

  private async updateStats(conversationId: string) {
    // Recalculate message count
    const { count } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (count !== null) {
      await this.supabase
        .from('conversations')
        .update({ message_count: count, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }
  }

  // Async methods for compaction
  async needsCompaction(sessionId: string, modelName: string, threshold: number = 0.75): Promise<boolean> {
    const stats = await this.getTokenStats(sessionId);
    return shouldCompact(stats.totalTokens, modelName);
  }

  async getTokenStats(sessionId: string): Promise<{ totalTokens: number; messageCount: number; averageTokensPerMessage: number; }> {
    const messages = await this.getHistory(sessionId);
    const totalTokens = countConversationTokens(messages);
    const messageCount = messages.length;
    const averageTokensPerMessage = messageCount > 0 ? totalTokens / messageCount : 0;

    return { totalTokens, messageCount, averageTokensPerMessage };
  }
}
