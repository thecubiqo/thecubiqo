/**
 * AI Service Unit Tests
 * 
 * Comprehensive tests for ai/service.ts utility functions
 * Tests: formatTimeAgo, parseResponse, buildMessages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeAgo, parseResponse, buildMessages } from '@/lib/ai/service';
import type { ConversationEntry, ColorName } from '@/lib/ai/types';

describe('AI Service', () => {
  describe('formatTimeAgo', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Just now" for timestamps less than 60 seconds ago', () => {
      const timestamp = new Date('2024-01-15T11:59:30Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('Just now');
    });

    it('should return "Just now" for timestamp exactly 0 seconds ago', () => {
      const timestamp = new Date('2024-01-15T12:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('Just now');
    });

    it('should return "Just now" for timestamp 59 seconds ago', () => {
      const timestamp = new Date('2024-01-15T11:59:01Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('Just now');
    });

    it('should return "{n}m ago" for timestamps less than 60 minutes ago', () => {
      const timestamp1 = new Date('2024-01-15T11:59:00Z').toISOString();
      expect(formatTimeAgo(timestamp1)).toBe('1m ago');

      const timestamp5 = new Date('2024-01-15T11:55:00Z').toISOString();
      expect(formatTimeAgo(timestamp5)).toBe('5m ago');

      const timestamp59 = new Date('2024-01-15T11:01:00Z').toISOString();
      expect(formatTimeAgo(timestamp59)).toBe('59m ago');
    });

    it('should return "{n}h ago" for timestamps less than 24 hours ago', () => {
      const timestamp1 = new Date('2024-01-15T11:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp1)).toBe('1h ago');

      const timestamp5 = new Date('2024-01-15T07:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp5)).toBe('5h ago');

      const timestamp23 = new Date('2024-01-14T13:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp23)).toBe('23h ago');
    });

    it('should return "Yesterday" for timestamps exactly 1 day ago', () => {
      const timestamp = new Date('2024-01-14T12:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('Yesterday');
    });

    it('should return "Yesterday" for timestamps between 24-48 hours ago', () => {
      const timestamp = new Date('2024-01-14T06:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('Yesterday');
    });

    it('should return "{n}d ago" for timestamps less than 7 days ago', () => {
      const timestamp2 = new Date('2024-01-13T12:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp2)).toBe('2d ago');

      const timestamp6 = new Date('2024-01-09T12:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp6)).toBe('6d ago');
    });

    it('should return "MMM DD" format for timestamps 7 days ago or more', () => {
      const timestamp7 = new Date('2024-01-08T12:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp7)).toBe('Jan 8');

      const timestampOld = new Date('2023-12-25T12:00:00Z').toISOString();
      expect(formatTimeAgo(timestampOld)).toBe('Dec 25');
    });

    it('should handle edge case at exactly 60 seconds', () => {
      const timestamp = new Date('2024-01-15T11:59:00Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('1m ago');
    });

    it('should handle edge case at exactly 60 minutes', () => {
      const timestamp = new Date('2024-01-15T11:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('1h ago');
    });

    it('should handle edge case at exactly 24 hours', () => {
      const timestamp = new Date('2024-01-14T12:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('Yesterday');
    });

    it('should handle edge case at exactly 7 days', () => {
      const timestamp = new Date('2024-01-08T12:00:00Z').toISOString();
      expect(formatTimeAgo(timestamp)).toBe('Jan 8');
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON with valid color', () => {
      const content = JSON.stringify({
        color: 'ORANGE',
        response: 'Hello, how can I help?',
      });

      const result = parseResponse(content);

      expect(result.color).toBe('ORANGE');
      expect(result.response).toBe('Hello, how can I help?');
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const content = '```json\n{"color": "RED", "response": "Test"}\n```';

      const result = parseResponse(content);

      expect(result.color).toBe('RED');
      expect(result.response).toBe('Test');
    });

    it('should parse JSON wrapped in code blocks without json marker', () => {
      const content = '```\n{"color": "RED", "response": "Test"}\n```';

      const result = parseResponse(content);

      expect(result.color).toBe('RED');
      expect(result.response).toBe('Test');
    });

    it('should handle code blocks with extra whitespace', () => {
      const content = '```json\n\n  {"color": "YELLOW", "response": "Test"}  \n\n```';

      const result = parseResponse(content);

      expect(result.color).toBe('YELLOW');
      expect(result.response).toBe('Test');
    });

    it('should default to ORANGE for invalid color', () => {
      const content = JSON.stringify({
        color: 'INVALID_COLOR',
        response: 'Test response',
      });

      const result = parseResponse(content);

      expect(result.color).toBe('ORANGE');
      expect(result.response).toBe('Test response');
    });

    it('should return raw content as response for non-JSON input', () => {
      const content = 'This is not JSON';

      const result = parseResponse(content);

      expect(result.color).toBe('ORANGE');
      expect(result.response).toBe('This is not JSON');
    });

    it('should handle malformed JSON', () => {
      const content = '{"color": "ORANGE", "response": "Test"'; // Missing closing brace

      const result = parseResponse(content);

      expect(result.color).toBe('ORANGE');
      expect(result.response).toBe(content);
    });

    it('should handle empty string', () => {
      const content = '';

      const result = parseResponse(content);

      expect(result.color).toBe('ORANGE');
      expect(result.response).toBe('');
    });

    it('should handle all valid color names', () => {
      const validColors: ColorName[] = ['ORANGE', 'RED', 'YELLOW', 'TEAL'];

      validColors.forEach(color => {
        const content = JSON.stringify({ color, response: 'Test' });
        const result = parseResponse(content);
        expect(result.color).toBe(color);
      });
    });

    it('should parse JSON with nested objects in response', () => {
      const content = JSON.stringify({
        color: 'TEAL',
        response: 'Here is some data: {"key": "value"}',
      });

      const result = parseResponse(content);

      expect(result.color).toBe('TEAL');
      expect(result.response).toBe('Here is some data: {"key": "value"}');
    });
  });

  describe('buildMessages', () => {
    it('should build messages with empty history', () => {
      const currentMessage = 'Hello!';
      const history: ConversationEntry[] = [];
      const currentColor: ColorName = 'ORANGE';

      const result = buildMessages(currentMessage, history, currentColor);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toContain('Hello!');
      expect(result[0].content).toContain('Current color: ORANGE');
    });

    it('should include full timestamp for current message', () => {
      const currentMessage = 'What time is it?';
      const history: ConversationEntry[] = [];
      const currentColor: ColorName = 'YELLOW';

      const result = buildMessages(currentMessage, history, currentColor);

      // Should contain a full timestamp format
      expect(result[0].content).toMatch(/\[.*day.*\]/i); // Contains day name
      expect(result[0].content).toContain('Current color: YELLOW');
      expect(result[0].content).toContain('User message: What time is it?');
    });

    it('should add history with first entry having full timestamp', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const history: ConversationEntry[] = [
        {
          userMessage: 'First message',
          aiResponse: 'First response',
          timestamp: '2024-01-15T10:00:00Z',
          color: 'ORANGE',
        },
        {
          userMessage: 'Second message',
          aiResponse: 'Second response',
          timestamp: '2024-01-15T11:00:00Z',
          color: 'RED',
        },
      ];

      const result = buildMessages('Current message', history, 'ORANGE');

      // First history entry should have full timestamp (index 0)
      expect(result[0].content).toMatch(/\[.*day.*\]/i);
      
      // Second history entry should have relative timestamp (index 2)
      expect(result[2].content).toMatch(/\[.*ago\]/i);

      vi.useRealTimers();
    });

    it('should limit history to last 10 messages', () => {
      const history: ConversationEntry[] = Array.from({ length: 15 }, (_, i) => ({
        userMessage: `Message ${i}`,
        aiResponse: `Response ${i}`,
        timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
        color: 'ORANGE' as ColorName,
      }));

      const result = buildMessages('Current message', history, 'ORANGE');

      // 10 history entries * 2 (user + assistant) + 1 current = 21
      expect(result).toHaveLength(21);

      // Should include last 10 messages (messages 5-14)
      expect(result[0].content).toContain('Message 5');
    });

    it('should format history messages correctly', () => {
      const history: ConversationEntry[] = [
        {
          userMessage: 'Hello',
          aiResponse: 'Hi there',
          timestamp: '2024-01-01T10:00:00Z',
          color: 'RED',
        },
      ];

      const result = buildMessages('New message', history, 'ORANGE');

      expect(result[0].role).toBe('user');
      expect(result[0].content).toContain('Hello');
      
      expect(result[1].role).toBe('assistant');
      const assistantContent = JSON.parse(result[1].content);
      expect(assistantContent.color).toBe('RED');
      expect(assistantContent.response).toBe('Hi there');
    });

    it('should preserve color information from history', () => {
      const history: ConversationEntry[] = [
        {
          userMessage: 'Test',
          aiResponse: 'Response',
          timestamp: '2024-01-01T10:00:00Z',
          color: 'RED',
        },
      ];

      const result = buildMessages('Current', history, 'YELLOW');

      const assistantMessage = JSON.parse(result[1].content);
      expect(assistantMessage.color).toBe('RED');
    });

    it('should handle multiple history entries', () => {
      const history: ConversationEntry[] = [
        {
          userMessage: 'Message 1',
          aiResponse: 'Response 1',
          timestamp: '2024-01-01T10:00:00Z',
          color: 'ORANGE',
        },
        {
          userMessage: 'Message 2',
          aiResponse: 'Response 2',
          timestamp: '2024-01-01T11:00:00Z',
          color: 'YELLOW',
        },
        {
          userMessage: 'Message 3',
          aiResponse: 'Response 3',
          timestamp: '2024-01-01T12:00:00Z',
          color: 'RED',
        },
      ];

      const result = buildMessages('Current', history, 'GREEN_BLUE');

      // 3 history * 2 + 1 current = 7
      expect(result).toHaveLength(7);
      
      // Check order: user1, assistant1, user2, assistant2, user3, assistant3, current
      expect(result[0].role).toBe('user');
      expect(result[0].content).toContain('Message 1');
      expect(result[1].role).toBe('assistant');
      expect(result[2].role).toBe('user');
      expect(result[2].content).toContain('Message 2');
      expect(result[3].role).toBe('assistant');
      expect(result[4].role).toBe('user');
      expect(result[4].content).toContain('Message 3');
      expect(result[5].role).toBe('assistant');
      expect(result[6].role).toBe('user');
      expect(result[6].content).toContain('Current');
    });

    it('should handle exactly 10 history entries', () => {
      const history: ConversationEntry[] = Array.from({ length: 10 }, (_, i) => ({
        userMessage: `Message ${i}`,
        aiResponse: `Response ${i}`,
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        color: 'ORANGE' as ColorName,
      }));

      const result = buildMessages('Current', history, 'ORANGE');

      // 10 * 2 + 1 = 21
      expect(result).toHaveLength(21);
    });

    it('should format current message with proper structure', () => {
      const currentMessage = 'Test message';
      const currentColor: ColorName = 'GREEN_BLUE';

      const result = buildMessages(currentMessage, [], currentColor);

      expect(result[0].role).toBe('user');
      expect(result[0].content).toContain('[');
      expect(result[0].content).toContain('Current color: GREEN_BLUE');
      expect(result[0].content).toContain('User message: Test message');
    });
  });
});
