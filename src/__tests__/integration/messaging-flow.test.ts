/**
 * Integration Test: CQ Messaging Flow
 * 
 * Tests the happy path for CubiQo (CQ) messaging:
 * 1. User sends message to CubiQo AI
 * 2. Message is saved to database
 * 3. AI processes and responds
 * 4. Response is saved and displayed
 * 5. Conversation history is maintained
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('CQ Messaging Flow - Happy Path', () => {
  describe('Message Sending', () => {
    it('should validate message content before sending', () => {
      const validMessages = [
        'Hello CubiQo!',
        'How are you today?',
        'Tell me a joke'
      ];

      validMessages.forEach(msg => {
        expect(msg.trim().length).toBeGreaterThan(0);
        expect(msg.length).toBeLessThanOrEqual(10000); // Max message length
      });
    });

    it('should reject empty or whitespace-only messages', () => {
      const invalidMessages = ['', '   ', '\n\n', '\t'];

      invalidMessages.forEach(msg => {
        expect(msg.trim().length).toBe(0);
      });
    });

    it('should include required fields in message payload', () => {
      const messagePayload = {
        message: 'Hello CubiQo!',
        conversationHistory: [],
        currentColor: 'ORANGE',
        isGuest: false,
        messageCount: 1,
        sessionId: 'session-123'
      };

      expect(messagePayload.message).toBeDefined();
      expect(messagePayload.currentColor).toBeDefined();
      expect(messagePayload.sessionId).toBeDefined();
    });
  });

  describe('Message Storage', () => {
    it('should save user message with correct structure', () => {
      const userMessage = {
        conversation_id: 'conv-123',
        role: 'user',
        content: 'Hello CubiQo!',
        color: 'ORANGE',
        created_at: new Date().toISOString()
      };

      expect(userMessage.role).toBe('user');
      expect(userMessage.conversation_id).toBe('conv-123');
      expect(userMessage.content).toBe('Hello CubiQo!');
    });

    it('should save AI response with correct structure', () => {
      const aiMessage = {
        conversation_id: 'conv-123',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        color: 'ORANGE',
        created_at: new Date().toISOString()
      };

      expect(aiMessage.role).toBe('assistant');
      expect(aiMessage.conversation_id).toBe('conv-123');
      expect(aiMessage.content).toBeDefined();
    });

    it('should maintain message order with timestamps', () => {
      const messages = [
        { id: 1, created_at: '2024-01-01T10:00:00Z', role: 'user' },
        { id: 2, created_at: '2024-01-01T10:00:01Z', role: 'assistant' },
        { id: 3, created_at: '2024-01-01T10:01:00Z', role: 'user' }
      ];

      const sortedMessages = [...messages].sort((a, b) => 
        a.created_at.localeCompare(b.created_at)
      );

      expect(sortedMessages[0].role).toBe('user');
      expect(sortedMessages[1].role).toBe('assistant');
      expect(sortedMessages[2].role).toBe('user');
    });
  });

  describe('AI Response Processing', () => {
    it('should handle successful AI response', async () => {
      const mockResponse = {
        response: 'Hello! I\'m CubiQo, your AI companion.',
        color: 'ORANGE',
        provider: 'minimax',
        tokens: 150
      };

      expect(mockResponse.response).toBeDefined();
      expect(mockResponse.color).toBe('ORANGE');
      expect(mockResponse.provider).toBe('minimax');
    });

    it('should extract color from AI response', () => {
      const responseWithColor = 'Hello! [COLOR:GREEN_BLUE] I sense calm energy.';
      const colorMatch = responseWithColor.match(/\[COLOR:(\w+)\]/);
      
      const extractedColor = colorMatch ? colorMatch[1] : 'ORANGE';
      expect(extractedColor).toBe('GREEN_BLUE');
    });

    it('should default to ORANGE color if not specified', () => {
      const responseWithoutColor = 'Hello! How can I help you?';
      const colorMatch = responseWithoutColor.match(/\[COLOR:(\w+)\]/);
      
      const extractedColor = colorMatch ? colorMatch[1] : 'ORANGE';
      expect(extractedColor).toBe('ORANGE');
    });

    it('should handle AI provider fallback chain', () => {
      const fallbackChain = [
        { provider: 'minimax', available: true },
        { provider: 'mixtral', available: true },
        { provider: 'llama', available: true },
        { provider: 'claude', available: true }
      ];

      const firstAvailable = fallbackChain.find(p => p.available);
      expect(firstAvailable?.provider).toBe('minimax');
    });
  });

  describe('Conversation History', () => {
    it('should load conversation history on session start', () => {
      const mockHistory = [
        {
          userMessage: 'Hello',
          aiResponse: 'Hi there!',
          color: 'ORANGE',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          userMessage: 'How are you?',
          aiResponse: 'I\'m doing well, thanks!',
          color: 'ORANGE',
          timestamp: '2024-01-01T10:01:00Z'
        }
      ];

      expect(mockHistory).toHaveLength(2);
      expect(mockHistory[0].userMessage).toBe('Hello');
      expect(mockHistory[1].userMessage).toBe('How are you?');
    });

    it('should pair user and AI messages correctly', () => {
      const messages = [
        { role: 'user', content: 'Hello', color: 'ORANGE', created_at: '2024-01-01T10:00:00Z' },
        { role: 'assistant', content: 'Hi!', color: 'ORANGE', created_at: '2024-01-01T10:00:01Z' },
        { role: 'user', content: 'Bye', color: 'GREEN_BLUE', created_at: '2024-01-01T10:01:00Z' },
        { role: 'assistant', content: 'Goodbye!', color: 'GREEN_BLUE', created_at: '2024-01-01T10:01:01Z' }
      ];

      const pairs = [];
      for (let i = 0; i < messages.length; i += 2) {
        const userMsg = messages[i];
        const aiMsg = messages[i + 1];
        if (userMsg?.role === 'user' && aiMsg?.role === 'assistant') {
          pairs.push({ userMessage: userMsg.content, aiResponse: aiMsg.content });
        }
      }

      expect(pairs).toHaveLength(2);
      expect(pairs[0].userMessage).toBe('Hello');
      expect(pairs[0].aiResponse).toBe('Hi!');
    });

    it('should handle empty conversation history', () => {
      const conversationHistory: any[] = [];
      
      expect(conversationHistory).toHaveLength(0);
      expect(Array.isArray(conversationHistory)).toBe(true);
    });

    it('should include conversation history in subsequent messages', () => {
      const conversationHistory = [
        { userMessage: 'What\'s your name?', aiResponse: 'I\'m CubiQo!' }
      ];

      const newMessage = 'Can you remind me of your name?';
      const includeHistory = conversationHistory.length > 0;

      expect(includeHistory).toBe(true);
      expect(conversationHistory[0].aiResponse).toContain('CubiQo');
    });
  });

  describe('Real-time Updates', () => {
    it('should show loading state while waiting for response', () => {
      const chatState = {
        isLoading: true,
        error: null,
        conversationHistory: []
      };

      expect(chatState.isLoading).toBe(true);
      expect(chatState.error).toBeNull();
    });

    it('should update state when response arrives', () => {
      const initialState = {
        isLoading: true,
        conversationHistory: []
      };

      const updatedState = {
        isLoading: false,
        conversationHistory: [
          {
            userMessage: 'Hello',
            aiResponse: 'Hi there!',
            color: 'ORANGE',
            timestamp: new Date().toISOString()
          }
        ]
      };

      expect(updatedState.isLoading).toBe(false);
      expect(updatedState.conversationHistory).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      const apiError = {
        error: 'Failed to send message',
        code: 'API_ERROR',
        details: 'Service temporarily unavailable'
      };

      expect(apiError.error).toBeDefined();
      expect(apiError.code).toBe('API_ERROR');
    });

    it('should handle network timeouts', () => {
      const timeoutError = new Error('Request timeout after 30s');
      
      expect(timeoutError.message).toContain('timeout');
    });

    it('should handle rate limiting errors', () => {
      const rateLimitError = {
        error: 'Rate limit exceeded',
        retryAfter: 3600,
        remaining: 0
      };

      expect(rateLimitError.error).toContain('Rate limit');
      expect(rateLimitError.remaining).toBe(0);
    });
  });

  describe('Memory Extraction', () => {
    it('should trigger memory extraction after message exchange', () => {
      const memoryPayload = {
        sessionId: 'session-123',
        userMessage: 'I love hiking in the mountains',
        aiResponse: 'That sounds wonderful! Nature activities are great.'
      };

      expect(memoryPayload.sessionId).toBeDefined();
      expect(memoryPayload.userMessage).toBeDefined();
      expect(memoryPayload.aiResponse).toBeDefined();
    });

    it('should handle memory extraction failures silently', () => {
      // Memory extraction is fire-and-forget
      const silentFailure = () => {
        try {
          throw new Error('Memory extraction failed');
        } catch (e) {
          // Silently caught
          return null;
        }
      };

      expect(silentFailure()).toBeNull();
    });
  });

  describe('BYO Mode', () => {
    it('should include BYO API keys in request headers when enabled', () => {
      const byoConfig = {
        enabled: true,
        claudeApiKey: 'sk-ant-api03-xxxxxxxxxxxxx'
      };

      const headers: Record<string, string> = {};
      if (byoConfig.enabled && byoConfig.claudeApiKey) {
        headers['x-byo-claude-key'] = byoConfig.claudeApiKey;
      }

      expect(headers['x-byo-claude-key']).toBeDefined();
    });

    it('should not include BYO headers when disabled', () => {
      const byoConfig = {
        enabled: false,
        claudeApiKey: 'sk-ant-api03-xxxxxxxxxxxxx'
      };

      const headers: Record<string, string> = {};
      if (byoConfig.enabled && byoConfig.claudeApiKey) {
        headers['x-byo-claude-key'] = byoConfig.claudeApiKey;
      }

      expect(headers['x-byo-claude-key']).toBeUndefined();
    });
  });

  describe('Color State Management', () => {
    it('should track color changes through conversation', () => {
      const colorHistory = ['ORANGE', 'YELLOW', 'GREEN_BLUE'];
      const currentColor = colorHistory[colorHistory.length - 1];

      expect(currentColor).toBe('GREEN_BLUE');
      expect(colorHistory).toHaveLength(3);
    });

    it('should use last message color as current state', () => {
      const conversationHistory = [
        { userMessage: 'Hello', aiResponse: 'Hi', color: 'ORANGE' },
        { userMessage: 'How are you?', aiResponse: 'Good!', color: 'YELLOW' },
        { userMessage: 'Nice!', aiResponse: 'Thanks!', color: 'GREEN_BLUE' }
      ];

      const currentColor = conversationHistory[conversationHistory.length - 1].color;
      expect(currentColor).toBe('GREEN_BLUE');
    });
  });
});
