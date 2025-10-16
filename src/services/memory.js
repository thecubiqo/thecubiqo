/**
 * 🧠 Memory Service
 *
 * Manages conversation history and context for Cubiqo.
 * Phase 1: Uses localStorage for session memory
 * Phase 2: Will migrate to backend API without code changes (abstraction layer ready!)
 */

const STORAGE_KEY = 'cubiqo_conversations';
const MAX_STORED_MESSAGES = 50; // Keep last 50 messages
const CONTEXT_WINDOW = 10;      // Send last 10 to AI for context

class MemoryService {
  constructor() {
    this.conversations = this.loadFromStorage();
  }

  /**
   * Save a conversation turn (user message + AI response)
   */
  async saveConversation(data) {
    const entry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userMessage: data.userMessage,
      aiResponse: data.aiResponse,
      color: data.color,
      sessionId: this.getSessionId()
    };

    this.conversations.push(entry);

    // Keep only last MAX_STORED_MESSAGES
    if (this.conversations.length > MAX_STORED_MESSAGES) {
      this.conversations = this.conversations.slice(-MAX_STORED_MESSAGES);
    }

    this.saveToStorage();

    // Phase 2: Replace localStorage with API call
    // return fetch(`${API_URL}/conversations`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry)
    // });
  }

  /**
   * Get recent conversation history for AI context
   * Returns last N messages from ALL sessions (persistent memory)
   */
  async getRecentMemories(limit = CONTEXT_WINDOW) {
    // Get last N messages from ALL conversations (across all sessions)
    const recent = this.conversations.slice(-limit);

    // Phase 2: Replace with API call
    // const response = await fetch(`${API_URL}/conversations?limit=${limit}`);
    // return response.json();

    return recent;
  }

  /**
   * Get all conversations for current session
   */
  async getSessionHistory() {
    const sessionId = this.getSessionId();
    return this.conversations.filter(conv => conv.sessionId === sessionId);
  }

  /**
   * Clear all conversations (reset)
   */
  async clearHistory() {
    this.conversations = [];
    this.saveToStorage();

    // Phase 2: API call to clear
    // await fetch(`${API_URL}/conversations`, { method: 'DELETE' });
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('cubiqo_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('cubiqo_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Load conversations from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading conversations from storage:', error);
      return [];
    }
  }

  /**
   * Save conversations to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
    } catch (error) {
      console.error('Error saving conversations to storage:', error);
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation statistics
   */
  getStats() {
    const sessionId = this.getSessionId();
    const sessionConvs = this.conversations.filter(c => c.sessionId === sessionId);

    // Color distribution
    const colorCounts = {};
    sessionConvs.forEach(conv => {
      colorCounts[conv.color] = (colorCounts[conv.color] || 0) + 1;
    });

    return {
      totalMessages: sessionConvs.length,
      colorDistribution: colorCounts,
      sessionStart: sessionConvs[0]?.timestamp,
      lastMessage: sessionConvs[sessionConvs.length - 1]?.timestamp
    };
  }
}

// Export singleton instance (ready for Phase 2 migration!)
export default new MemoryService();
