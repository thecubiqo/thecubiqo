/**
 * ConsciousMemoryService Unit Tests
 * 
 * Comprehensive tests for conscious-memory/memory-service.ts
 * Tests: buildMemoryContext, trackAccess, extractFromConversation,
 *        searchMemories, findRelatedMemories
 */

import { describe, it, expect, vi } from 'vitest';
import { ConsciousMemoryService } from '@/lib/conscious-memory/memory-service';
import type { Memory, MemoryType, MemoryImportance, MemoryQuery } from '@/lib/conscious-memory/types';

describe('ConsciousMemoryService', () => {
  // Helper to create test memories
  const createMemory = (
    overrides: Partial<Memory> = {}
  ): Memory => ({
    id: 'mem-123',
    userId: 'user-456',
    type: 'factual',
    content: 'Test memory content',
    importance: 'medium',
    tags: [],
    relatedMemories: [],
    verified: true,
    lastAccessed: '2024-01-01T00:00:00Z',
    accessCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  describe('buildMemoryContext', () => {
    it('should return empty string for empty array', () => {
      const result = ConsciousMemoryService.buildMemoryContext([]);
      expect(result).toBe('');
    });

    it('should build context with header for single memory', () => {
      const memory = createMemory({
        type: 'factual',
        content: 'User is a software engineer',
      });

      const result = ConsciousMemoryService.buildMemoryContext([memory]);

      expect(result).toContain('\n\n## CONSCIOUS MEMORY\n');
      expect(result).toContain('📋 Facts');
      expect(result).toContain('- User is a software engineer');
    });

    it('should group memories by type with correct emoji labels', () => {
      const memories: Memory[] = [
        createMemory({ id: '1', type: 'factual', content: 'Lives in NYC' }),
        createMemory({ id: '2', type: 'preference', content: 'Loves coffee' }),
        createMemory({ id: '3', type: 'emotional', content: 'Excited about new project' }),
        createMemory({ id: '4', type: 'goal', content: 'Learn TypeScript' }),
        createMemory({ id: '5', type: 'relationship', content: 'Has sister named Jane' }),
        createMemory({ id: '6', type: 'context', content: 'Works remotely' }),
      ];

      const result = ConsciousMemoryService.buildMemoryContext(memories);

      expect(result).toContain('📋 Facts');
      expect(result).toContain('- Lives in NYC');
      expect(result).toContain('❤️ Preferences');
      expect(result).toContain('- Loves coffee');
      expect(result).toContain('💭 Emotional Moments');
      expect(result).toContain('- Excited about new project');
      expect(result).toContain('🎯 Goals');
      expect(result).toContain('- Learn TypeScript');
      expect(result).toContain('👥 Relationships');
      expect(result).toContain('- Has sister named Jane');
      expect(result).toContain('🌍 Context');
      expect(result).toContain('- Works remotely');
    });

    it('should list multiple memories of same type', () => {
      const memories: Memory[] = [
        createMemory({ id: '1', type: 'preference', content: 'Loves coffee' }),
        createMemory({ id: '2', type: 'preference', content: 'Hates mornings' }),
        createMemory({ id: '3', type: 'preference', content: 'Prefers dark mode' }),
      ];

      const result = ConsciousMemoryService.buildMemoryContext(memories);

      expect(result).toContain('❤️ Preferences');
      expect(result).toContain('- Loves coffee');
      expect(result).toContain('- Hates mornings');
      expect(result).toContain('- Prefers dark mode');
    });

    it('should include usage instruction at the end', () => {
      const memory = createMemory({ type: 'factual', content: 'Test' });
      const result = ConsciousMemoryService.buildMemoryContext([memory]);

      expect(result).toContain('Use these memories naturally');
      expect(result).toContain("Don't recite them - show that you remember through your responses");
    });
  });

  describe('trackAccess', () => {
    it('should increment access count', () => {
      const memory = createMemory({ accessCount: 5 });
      const result = ConsciousMemoryService.trackAccess(memory);

      expect(result.accessCount).toBe(6);
    });

    it('should increment access count from 0', () => {
      const memory = createMemory({ accessCount: 0 });
      const result = ConsciousMemoryService.trackAccess(memory);

      expect(result.accessCount).toBe(1);
    });

    it('should update lastAccessed to current ISO timestamp', () => {
      const memory = createMemory({ lastAccessed: '2024-01-01T00:00:00Z' });
      const before = Date.now();
      const result = ConsciousMemoryService.trackAccess(memory);
      const after = Date.now();

      expect(result.lastAccessed).toBeDefined();
      const timestamp = new Date(result.lastAccessed!).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should return ISO format timestamp', () => {
      const memory = createMemory();
      const result = ConsciousMemoryService.trackAccess(memory);

      // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(result.lastAccessed).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('extractFromConversation', () => {
    it('should return parsed extraction on success', async () => {
      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify({
          potential: [
            {
              content: 'Lives in NYC',
              type: 'factual',
              importance: 'high',
              reasoning: 'Clear statement about location',
            },
          ],
          needsConfirmation: false,
        })),
      };

      const messages = [
        { role: 'user', content: 'I live in NYC' },
        { role: 'assistant', content: 'That\'s great!' },
      ];

      const result = await ConsciousMemoryService.extractFromConversation(
        messages,
        mockAiModel
      );

      expect(mockAiModel.generateText).toHaveBeenCalledWith({
        prompt: expect.any(String),
        temperature: 0.3,
      });
      expect(result.potential).toHaveLength(1);
      expect(result.potential[0].content).toBe('Lives in NYC');
      expect(result.potential[0].type).toBe('factual');
      expect(result.potential[0].importance).toBe('high');
      expect(result.needsConfirmation).toBe(false);
    });

    it('should return empty extraction on AI failure', async () => {
      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const messages = [
        { role: 'user', content: 'Hello' },
      ];

      const result = await ConsciousMemoryService.extractFromConversation(
        messages,
        mockAiModel
      );

      expect(result.potential).toEqual([]);
      expect(result.needsConfirmation).toBe(false);
    });

    it('should return empty extraction on JSON parse error', async () => {
      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue('invalid json'),
      };

      const messages = [
        { role: 'user', content: 'Hello' },
      ];

      const result = await ConsciousMemoryService.extractFromConversation(
        messages,
        mockAiModel
      );

      expect(result.potential).toEqual([]);
      expect(result.needsConfirmation).toBe(false);
    });

    it('should handle multiple potential memories', async () => {
      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify({
          potential: [
            { content: 'Lives in NYC', type: 'factual', importance: 'high', reasoning: 'Location' },
            { content: 'Loves coffee', type: 'preference', importance: 'medium', reasoning: 'Preference' },
            { content: 'Learning React', type: 'goal', importance: 'high', reasoning: 'Goal' },
          ],
          needsConfirmation: true,
        })),
      };

      const messages = [
        { role: 'user', content: 'I live in NYC and love coffee. Learning React!' },
      ];

      const result = await ConsciousMemoryService.extractFromConversation(
        messages,
        mockAiModel
      );

      expect(result.potential).toHaveLength(3);
      expect(result.needsConfirmation).toBe(true);
    });
  });

  describe('searchMemories', () => {
    it('should filter by type', async () => {
      const memories: Memory[] = [
        createMemory({ id: '1', type: 'factual', content: 'Lives in NYC' }),
        createMemory({ id: '2', type: 'preference', content: 'Loves coffee' }),
        createMemory({ id: '3', type: 'factual', content: 'Software engineer' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify([
          { memoryId: '1', score: 0.9, reason: 'Matches query' },
          { memoryId: '3', score: 0.7, reason: 'Relevant' },
        ])),
      };

      const query: MemoryQuery = {
        query: 'location',
        type: 'factual',
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      // Should only include factual memories
      expect(result.every(r => r.memory.type === 'factual')).toBe(true);
    });

    it('should filter by tags', async () => {
      const memories: Memory[] = [
        createMemory({ id: '1', tags: ['work', 'career'] }),
        createMemory({ id: '2', tags: ['hobby', 'music'] }),
        createMemory({ id: '3', tags: ['work', 'project'] }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify([
          { memoryId: '1', score: 0.9, reason: 'Match' },
          { memoryId: '3', score: 0.8, reason: 'Match' },
        ])),
      };

      const query: MemoryQuery = {
        query: 'work',
        tags: ['work'],
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      // Should only include memories with 'work' tag
      expect(result.every(r => r.memory.tags.includes('work'))).toBe(true);
    });

    it('should filter by minImportance', async () => {
      const memories: Memory[] = [
        createMemory({ id: '1', importance: 'low', content: 'Low importance' }),
        createMemory({ id: '2', importance: 'medium', content: 'Medium importance' }),
        createMemory({ id: '3', importance: 'high', content: 'High importance' }),
        createMemory({ id: '4', importance: 'critical', content: 'Critical importance' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify([
          { memoryId: '3', score: 0.9, reason: 'High' },
          { memoryId: '4', score: 0.8, reason: 'Critical' },
        ])),
      };

      const query: MemoryQuery = {
        query: 'important',
        minImportance: 'high',
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      // Should only include high and critical
      expect(result.every(r => 
        r.memory.importance === 'high' || r.memory.importance === 'critical'
      )).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const memories: Memory[] = Array.from({ length: 20 }, (_, i) =>
        createMemory({ id: `mem-${i}`, content: `Memory ${i}` })
      );

      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify(
          memories.map((m, i) => ({ memoryId: m.id, score: 0.9 - i * 0.01, reason: 'Match' }))
        )),
      };

      const query: MemoryQuery = {
        query: 'test',
        limit: 5,
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      expect(result).toHaveLength(5);
    });

    it('should default to limit of 10 if not specified', async () => {
      const memories: Memory[] = Array.from({ length: 20 }, (_, i) =>
        createMemory({ id: `mem-${i}`, content: `Memory ${i}` })
      );

      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify(
          memories.map((m, i) => ({ memoryId: m.id, score: 0.9 - i * 0.01, reason: 'Match' }))
        )),
      };

      const query: MemoryQuery = {
        query: 'test',
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      expect(result).toHaveLength(10);
    });

    it('should fallback to simpleRelevanceScore on AI failure', async () => {
      const memories: Memory[] = [
        createMemory({ id: '1', content: 'I love software engineering', importance: 'high' }),
        createMemory({ id: '2', content: 'Software is great', importance: 'medium' }),
        createMemory({ id: '3', content: 'Unrelated content', importance: 'low' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const query: MemoryQuery = {
        query: 'software engineering',
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      // Should return results sorted by relevance
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].memory.id).toBe('1'); // Exact phrase match
      expect(result.every(r => r.relevanceScore > 0)).toBe(true);
      expect(result.every(r => r.reason === 'Text match')).toBe(true);
    });

    it('should use simpleRelevanceScore with exact phrase match bonus', async () => {
      const memories: Memory[] = [
        createMemory({ id: '1', content: 'I love coffee in the morning', importance: 'low' }),
        createMemory({ id: '2', content: 'Coffee is okay', importance: 'low' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const query: MemoryQuery = {
        query: 'love coffee',
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      // Memory 1 has exact phrase match, should score higher
      expect(result[0].memory.id).toBe('1');
      expect(result[0].relevanceScore).toBeGreaterThan(0.8);
    });

    it('should use simpleRelevanceScore with word match scoring', async () => {
      const memories: Memory[] = [
        createMemory({ id: '1', content: 'coffee beans brewing', importance: 'low' }),
        createMemory({ id: '2', content: 'coffee', importance: 'low' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const query: MemoryQuery = {
        query: 'coffee beans',
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      // Memory 1 matches both words
      expect(result[0].memory.id).toBe('1');
      expect(result[0].relevanceScore).toBeGreaterThan(result[1]?.relevanceScore || 0);
    });

    it('should use simpleRelevanceScore with tag match bonus', async () => {
      const memories: Memory[] = [
        createMemory({ id: '1', content: 'Some content', tags: ['coffee', 'morning'], importance: 'low' }),
        createMemory({ id: '2', content: 'Other content', tags: ['tea'], importance: 'low' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const query: MemoryQuery = {
        query: 'coffee',
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      // Memory 1 has matching tag
      expect(result[0].memory.id).toBe('1');
      expect(result[0].relevanceScore).toBeGreaterThan(0);
    });

    it('should use simpleRelevanceScore with importance bonus', async () => {
      const memories: Memory[] = [
        createMemory({ id: '1', content: 'test', importance: 'critical' }),
        createMemory({ id: '2', content: 'test', importance: 'high' }),
        createMemory({ id: '3', content: 'test', importance: 'medium' }),
        createMemory({ id: '4', content: 'test', importance: 'low' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const query: MemoryQuery = {
        query: 'test',
      };

      const result = await ConsciousMemoryService.searchMemories(
        query,
        memories,
        mockAiModel
      );

      // Critical should score highest due to importance bonus
      expect(result[0].memory.importance).toBe('critical');
      expect(result[1].memory.importance).toBe('high');
      expect(result[2].memory.importance).toBe('medium');
      expect(result[3].memory.importance).toBe('low');
    });
  });

  describe('findRelatedMemories', () => {
    it('should exclude the target memory itself', async () => {
      const targetMemory = createMemory({ id: 'target', content: 'Target memory' });
      const memories: Memory[] = [
        targetMemory,
        createMemory({ id: '2', content: 'Related memory 1' }),
        createMemory({ id: '3', content: 'Related memory 2' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify([
          { memoryId: '2', reason: 'Similar topic' },
          { memoryId: '3', reason: 'Same context' },
        ])),
      };

      const result = await ConsciousMemoryService.findRelatedMemories(
        targetMemory,
        memories,
        mockAiModel
      );

      expect(result.every(m => m.id !== 'target')).toBe(true);
    });

    it('should return related memories from AI response', async () => {
      const targetMemory = createMemory({ id: 'target', content: 'Software engineering' });
      const memories: Memory[] = [
        targetMemory,
        createMemory({ id: '2', content: 'Programming languages' }),
        createMemory({ id: '3', content: 'Code reviews' }),
        createMemory({ id: '4', content: 'Unrelated hobby' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify([
          { memoryId: '2', reason: 'Both about software' },
          { memoryId: '3', reason: 'Engineering process' },
        ])),
      };

      const result = await ConsciousMemoryService.findRelatedMemories(
        targetMemory,
        memories,
        mockAiModel
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });

    it('should fallback to tag-based similarity on AI failure', async () => {
      const targetMemory = createMemory({
        id: 'target',
        type: 'factual',
        tags: ['work', 'career'],
        content: 'Software engineer',
      });
      const memories: Memory[] = [
        targetMemory,
        createMemory({ id: '2', type: 'factual', tags: ['work'], content: 'Project manager' }),
        createMemory({ id: '3', type: 'preference', tags: ['hobby'], content: 'Likes music' }),
        createMemory({ id: '4', type: 'factual', tags: ['career'], content: 'Wants promotion' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const result = await ConsciousMemoryService.findRelatedMemories(
        targetMemory,
        memories,
        mockAiModel
      );

      // Should return memories with matching tags or type
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(result.some(m => m.tags.some(tag => targetMemory.tags.includes(tag)))).toBe(true);
    });

    it('should limit fallback results to 5 memories', async () => {
      const targetMemory = createMemory({
        id: 'target',
        type: 'factual',
        tags: ['work'],
      });
      const memories: Memory[] = [
        targetMemory,
        ...Array.from({ length: 10 }, (_, i) =>
          createMemory({ id: `mem-${i}`, type: 'factual', tags: ['work'] })
        ),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const result = await ConsciousMemoryService.findRelatedMemories(
        targetMemory,
        memories,
        mockAiModel
      );

      expect(result).toHaveLength(5);
    });

    it('should match by same type in fallback', async () => {
      const targetMemory = createMemory({
        id: 'target',
        type: 'preference',
        tags: [],
      });
      const memories: Memory[] = [
        targetMemory,
        createMemory({ id: '2', type: 'preference', tags: [], content: 'Likes tea' }),
        createMemory({ id: '3', type: 'factual', tags: [], content: 'Lives in LA' }),
        createMemory({ id: '4', type: 'preference', tags: [], content: 'Hates spicy food' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockRejectedValue(new Error('AI error')),
      };

      const result = await ConsciousMemoryService.findRelatedMemories(
        targetMemory,
        memories,
        mockAiModel
      );

      // Should return preference memories
      expect(result.every(m => m.type === 'preference')).toBe(true);
    });

    it('should filter out null/undefined memories from AI response', async () => {
      const targetMemory = createMemory({ id: 'target' });
      const memories: Memory[] = [
        targetMemory,
        createMemory({ id: '2', content: 'Memory 2' }),
      ];

      const mockAiModel = {
        generateText: vi.fn().mockResolvedValue(JSON.stringify([
          { memoryId: '2', reason: 'Related' },
          { memoryId: 'non-existent', reason: 'Invalid' },
        ])),
      };

      const result = await ConsciousMemoryService.findRelatedMemories(
        targetMemory,
        memories,
        mockAiModel
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });
});
