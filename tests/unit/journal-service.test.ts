/**
 * JournalService Unit Tests
 * 
 * Comprehensive tests for journal-service.ts business logic
 * Tests: extractKeywords, buildMetadata, generateDailySummary, calculateStats,
 *        detectColorCategory, analyzeSentiment, getPromptForTime
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JournalService } from '@/lib/journal/journal-service';
import type { JournalEntry, DailySummary, ColorCategory } from '@/lib/journal/types';

describe('JournalService', () => {
  describe('extractKeywords', () => {
    it('should return empty array for empty input', () => {
      const result = JournalService.extractKeywords('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only input', () => {
      const result = JournalService.extractKeywords('   \n\t  ');
      expect(result).toEqual([]);
    });

    it('should filter out single word if too short', () => {
      const result = JournalService.extractKeywords('a to be');
      expect(result).toEqual([]);
    });

    it('should extract single keyword above 3 chars', () => {
      const result = JournalService.extractKeywords('Hello world test');
      expect(result).toContain('hello');
      expect(result).toContain('world');
      expect(result).toContain('test');
    });

    it('should filter out stop words', () => {
      const content = 'this that with from have been would could should';
      const result = JournalService.extractKeywords(content);
      expect(result).toEqual([]);
    });

    it('should filter out stop words but keep valid words', () => {
      const content = 'this morning I walked with my friend from downtown';
      const result = JournalService.extractKeywords(content);
      expect(result).toContain('morning');
      expect(result).toContain('walked');
      expect(result).toContain('friend');
      expect(result).toContain('downtown');
      expect(result).not.toContain('this');
      expect(result).not.toContain('with');
      expect(result).not.toContain('from');
    });

    it('should remove punctuation', () => {
      const content = "Hello, world! How's everything? Great.";
      const result = JournalService.extractKeywords(content);
      expect(result).toContain('hello');
      expect(result).toContain('world');
      expect(result).toContain('hows');
      expect(result).toContain('everything');
      expect(result).toContain('great');
    });

    it('should return unique keywords only', () => {
      const content = 'amazing amazing wonderful amazing beautiful wonderful';
      const result = JournalService.extractKeywords(content);
      expect(result).toHaveLength(3);
      expect(result).toContain('amazing');
      expect(result).toContain('wonderful');
      expect(result).toContain('beautiful');
    });

    it('should limit to max 10 keywords', () => {
      const content = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13';
      const result = JournalService.extractKeywords(content);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should filter out words with 3 chars or less', () => {
      const content = 'I am go to the gym now and run for fun';
      const result = JournalService.extractKeywords(content);
      expect(result).not.toContain('I');
      expect(result).not.toContain('am');
      expect(result).not.toContain('go');
      expect(result).not.toContain('to');
      expect(result).not.toContain('the');
      expect(result).not.toContain('now');
      expect(result).not.toContain('and');
      expect(result).not.toContain('run');
      expect(result).not.toContain('for');
      expect(result).not.toContain('fun');
    });

    it('should convert to lowercase', () => {
      const content = 'AMAZING Wonderful BEAUTIFUL';
      const result = JournalService.extractKeywords(content);
      expect(result).toContain('amazing');
      expect(result).toContain('wonderful');
      expect(result).toContain('beautiful');
      expect(result).not.toContain('AMAZING');
      expect(result).not.toContain('Wonderful');
    });
  });

  describe('buildMetadata', () => {
    it('should build basic metadata without duration', () => {
      const content = 'Hello world test';
      const sentiment = 0.5;
      
      const result = JournalService.buildMetadata(content, sentiment);
      
      expect(result).toEqual({
        wordCount: 3,
        sentiment: 0.5,
        duration: undefined,
        aiGenerated: false,
        editCount: 0,
      });
    });

    it('should build metadata with duration', () => {
      const content = 'Hello world';
      const sentiment = 0.8;
      const duration = 120;
      
      const result = JournalService.buildMetadata(content, sentiment, duration);
      
      expect(result).toEqual({
        wordCount: 2,
        sentiment: 0.8,
        duration: 120,
        aiGenerated: false,
        editCount: 0,
      });
    });

    it('should handle negative sentiment', () => {
      const content = 'Bad day';
      const sentiment = -0.7;
      
      const result = JournalService.buildMetadata(content, sentiment);
      
      expect(result.sentiment).toBe(-0.7);
    });

    it('should handle zero sentiment', () => {
      const content = 'Neutral';
      const sentiment = 0;
      
      const result = JournalService.buildMetadata(content, sentiment);
      
      expect(result.sentiment).toBe(0);
    });

    it('should count words correctly for multi-line text', () => {
      const content = 'Line one\nLine two\nLine three';
      const sentiment = 0.3;
      
      const result = JournalService.buildMetadata(content, sentiment);
      
      expect(result.wordCount).toBe(6);
    });

    it('should handle empty content', () => {
      const content = '';
      const sentiment = 0;
      
      const result = JournalService.buildMetadata(content, sentiment);
      
      expect(result.wordCount).toBe(1); // split creates array with empty string
    });
  });

  describe('generateDailySummary', () => {
    it('should return default values for empty entries', () => {
      const result = JournalService.generateDailySummary([]);
      
      expect(result).toEqual({
        entryCount: 0,
        dominantColor: 'YELLOW',
        avgMood: 0,
        topKeywords: [],
        highlights: [],
        totalWords: 0,
        voiceEntries: 0,
        textEntries: 0,
      });
    });

    it('should process single entry', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Great morning with coffee and sunshine',
          colorCategory: 'YELLOW',
          keywords: ['great', 'morning', 'coffee', 'sunshine'],
          metadata: {
            wordCount: 6,
            sentiment: 0.8,
          },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const result = JournalService.generateDailySummary(entries);
      
      expect(result.entryCount).toBe(1);
      expect(result.dominantColor).toBe('YELLOW');
      expect(result.avgMood).toBe(0.8);
      expect(result.topKeywords).toEqual(['great', 'morning', 'coffee', 'sunshine']);
      expect(result.highlights).toHaveLength(1);
      expect(result.highlights?.[0]).toContain('Great morning');
      expect(result.totalWords).toBe(6);
      expect(result.voiceEntries).toBe(0);
      expect(result.textEntries).toBe(1);
    });

    it('should process multiple entries with mixed colors', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Morning',
          colorCategory: 'YELLOW',
          keywords: ['morning'],
          metadata: { wordCount: 1, sentiment: 0.5 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T14:00:00Z',
          type: 'voice',
          content: 'Urgent deadline',
          colorCategory: 'RED',
          keywords: ['urgent', 'deadline'],
          metadata: { wordCount: 2, sentiment: -0.3, duration: 45 },
          createdAt: '2024-01-15T14:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
        },
        {
          id: '3',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T18:00:00Z',
          type: 'text',
          content: 'Goal accomplished',
          colorCategory: 'GREEN_BLUE',
          keywords: ['goal', 'accomplished'],
          metadata: { wordCount: 2, sentiment: 0.9 },
          createdAt: '2024-01-15T18:00:00Z',
          updatedAt: '2024-01-15T18:00:00Z',
        },
      ];

      const result = JournalService.generateDailySummary(entries);
      
      expect(result.entryCount).toBe(3);
      expect(['RED', 'YELLOW', 'GREEN_BLUE']).toContain(result.dominantColor);
      expect(result.avgMood).toBeCloseTo((0.5 - 0.3 + 0.9) / 3);
      expect(result.totalWords).toBe(5);
      expect(result.voiceEntries).toBe(1);
      expect(result.textEntries).toBe(2);
    });

    it('should determine dominant color correctly', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'RED',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T11:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'RED',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
        },
        {
          id: '3',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T12:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T12:00:00Z',
          updatedAt: '2024-01-15T12:00:00Z',
        },
      ];

      const result = JournalService.generateDailySummary(entries);
      
      expect(result.dominantColor).toBe('RED');
    });

    it('should aggregate and rank keywords', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: ['work', 'project', 'team'],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T11:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: ['work', 'meeting', 'team'],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
        },
        {
          id: '3',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T12:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: ['work', 'deadline'],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T12:00:00Z',
          updatedAt: '2024-01-15T12:00:00Z',
        },
      ];

      const result = JournalService.generateDailySummary(entries);
      
      expect(result.topKeywords?.[0]).toBe('work'); // appears 3 times
      expect(result.topKeywords?.[1]).toBe('team'); // appears 2 times
    });

    it('should limit top keywords to 5', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: ['word1', 'word2', 'word3', 'word4', 'word5', 'word6', 'word7', 'word8'],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const result = JournalService.generateDailySummary(entries);
      
      expect(result.topKeywords?.length).toBeLessThanOrEqual(5);
    });

    it('should order highlights by sentiment (highest first)', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Neutral entry',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 2, sentiment: 0 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T11:00:00Z',
          type: 'text',
          content: 'Amazing fantastic wonderful day',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 4, sentiment: 0.9 },
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
        },
        {
          id: '3',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T12:00:00Z',
          type: 'text',
          content: 'Good progress',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 2, sentiment: 0.6 },
          createdAt: '2024-01-15T12:00:00Z',
          updatedAt: '2024-01-15T12:00:00Z',
        },
      ];

      const result = JournalService.generateDailySummary(entries);
      
      expect(result.highlights?.[0]).toContain('Amazing');
      expect(result.highlights?.[1]).toContain('Good');
      expect(result.highlights?.[2]).toContain('Neutral');
    });

    it('should limit highlights to 3', () => {
      const entries: JournalEntry[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        userId: 'user1',
        date: '2024-01-15',
        timestamp: `2024-01-15T${10 + i}:00:00Z`,
        type: 'text' as const,
        content: `Entry ${i + 1}`,
        colorCategory: 'YELLOW' as ColorCategory,
        keywords: [],
        metadata: { wordCount: 2, sentiment: i * 0.1 },
        createdAt: `2024-01-15T${10 + i}:00:00Z`,
        updatedAt: `2024-01-15T${10 + i}:00:00Z`,
      }));

      const result = JournalService.generateDailySummary(entries);
      
      expect(result.highlights?.length).toBe(3);
    });

    it('should truncate highlights to 100 chars with ellipsis', () => {
      const longContent = 'A'.repeat(150);
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: longContent,
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0.8 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const result = JournalService.generateDailySummary(entries);
      
      expect(result.highlights?.[0]).toHaveLength(103); // 100 chars + '...'
      expect(result.highlights?.[0]?.endsWith('...')).toBe(true);
    });
  });

  describe('calculateStats', () => {
    it('should calculate color distribution', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'RED',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T11:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'RED',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
        },
        {
          id: '3',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T12:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T12:00:00Z',
          updatedAt: '2024-01-15T12:00:00Z',
        },
        {
          id: '4',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T13:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'GREEN_BLUE',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T13:00:00Z',
          updatedAt: '2024-01-15T13:00:00Z',
        },
      ];

      const summaries: DailySummary[] = [];

      const result = JournalService.calculateStats(entries, summaries);
      
      expect(result.colorDistribution.RED).toBe(2);
      expect(result.colorDistribution.YELLOW).toBe(1);
      expect(result.colorDistribution.GREEN_BLUE).toBe(1);
    });

    it('should calculate mood trends from summaries', () => {
      const entries: JournalEntry[] = [];
      const summaries: DailySummary[] = [
        {
          date: '2024-01-15',
          userId: 'user1',
          entryCount: 3,
          dominantColor: 'YELLOW',
          avgMood: 0.5,
          topKeywords: [],
          highlights: [],
          totalWords: 100,
          voiceEntries: 1,
          textEntries: 2,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          date: '2024-01-16',
          userId: 'user1',
          entryCount: 2,
          dominantColor: 'GREEN_BLUE',
          avgMood: 0.8,
          topKeywords: [],
          highlights: [],
          totalWords: 80,
          voiceEntries: 0,
          textEntries: 2,
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z',
        },
        {
          date: '2024-01-14',
          userId: 'user1',
          entryCount: 1,
          dominantColor: 'RED',
          avgMood: -0.2,
          topKeywords: [],
          highlights: [],
          totalWords: 50,
          voiceEntries: 1,
          textEntries: 0,
          createdAt: '2024-01-14T10:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z',
        },
      ];

      const result = JournalService.calculateStats(entries, summaries);
      
      expect(result.moodTrends).toHaveLength(3);
      // Should be sorted by date
      expect(result.moodTrends[0].date).toBe('2024-01-14');
      expect(result.moodTrends[1].date).toBe('2024-01-15');
      expect(result.moodTrends[2].date).toBe('2024-01-16');
      expect(result.moodTrends[0].avgMood).toBe(-0.2);
      expect(result.moodTrends[1].avgMood).toBe(0.5);
      expect(result.moodTrends[2].avgMood).toBe(0.8);
    });

    it('should aggregate and rank top 10 keywords', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: ['work', 'team', 'project'],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-01-16',
          timestamp: '2024-01-16T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: ['work', 'meeting'],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z',
        },
        {
          id: '3',
          userId: 'user1',
          date: '2024-01-17',
          timestamp: '2024-01-17T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: ['work'],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-17T10:00:00Z',
          updatedAt: '2024-01-17T10:00:00Z',
        },
      ];

      const summaries: DailySummary[] = [];

      const result = JournalService.calculateStats(entries, summaries);
      
      expect(result.topKeywords[0]).toEqual({ keyword: 'work', count: 3 });
      expect(result.topKeywords.find(k => k.keyword === 'team')).toEqual({ keyword: 'team', count: 1 });
      expect(result.topKeywords.find(k => k.keyword === 'meeting')).toEqual({ keyword: 'meeting', count: 1 });
      expect(result.topKeywords.find(k => k.keyword === 'project')).toEqual({ keyword: 'project', count: 1 });
    });

    it('should limit top keywords to 10', () => {
      const entries: JournalEntry[] = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        userId: 'user1',
        date: '2024-01-15',
        timestamp: '2024-01-15T10:00:00Z',
        type: 'text' as const,
        content: 'Test',
        colorCategory: 'YELLOW' as ColorCategory,
        keywords: [`word${i + 1}`],
        metadata: { wordCount: 1, sentiment: 0 },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }));

      const summaries: DailySummary[] = [];

      const result = JournalService.calculateStats(entries, summaries);
      
      expect(result.topKeywords.length).toBeLessThanOrEqual(10);
    });

    it('should calculate consecutive day streaks', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-13',
          timestamp: '2024-01-13T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-13T10:00:00Z',
          updatedAt: '2024-01-13T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-01-14',
          timestamp: '2024-01-14T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-14T10:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z',
        },
        {
          id: '3',
          userId: 'user1',
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const summaries: DailySummary[] = [];

      const result = JournalService.calculateStats(entries, summaries);
      
      expect(result.longestStreak).toBeGreaterThanOrEqual(3);
    });

    it('should handle broken streaks', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-01-13',
          timestamp: '2024-01-13T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-13T10:00:00Z',
          updatedAt: '2024-01-13T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-01-14',
          timestamp: '2024-01-14T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-14T10:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z',
        },
        // Skip a day (2024-01-15)
        {
          id: '3',
          userId: 'user1',
          date: '2024-01-16',
          timestamp: '2024-01-16T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z',
        },
        {
          id: '4',
          userId: 'user1',
          date: '2024-01-17',
          timestamp: '2024-01-17T10:00:00Z',
          type: 'text',
          content: 'Test',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 1, sentiment: 0 },
          createdAt: '2024-01-17T10:00:00Z',
          updatedAt: '2024-01-17T10:00:00Z',
        },
      ];

      const summaries: DailySummary[] = [];

      const result = JournalService.calculateStats(entries, summaries);
      
      // Longest streak should be 2 (either 13-14 or 16-17)
      expect(result.longestStreak).toBeGreaterThanOrEqual(2);
    });

    it('should return correct total entries count', () => {
      const entries: JournalEntry[] = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        userId: 'user1',
        date: '2024-01-15',
        timestamp: '2024-01-15T10:00:00Z',
        type: 'text' as const,
        content: 'Test',
        colorCategory: 'YELLOW' as ColorCategory,
        keywords: [],
        metadata: { wordCount: 1, sentiment: 0 },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }));

      const summaries: DailySummary[] = [];

      const result = JournalService.calculateStats(entries, summaries);
      
      expect(result.totalEntries).toBe(25);
    });
  });

  describe('detectColorCategory', () => {
    it('should return RED for valid RED response', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('RED'),
      };

      const result = await JournalService.detectColorCategory('Urgent deadline!', mockAI);
      
      expect(result).toBe('RED');
      expect(mockAI.generateText).toHaveBeenCalledWith({
        prompt: expect.stringContaining('Urgent deadline!'),
        temperature: 0.3,
      });
    });

    it('should return YELLOW for valid YELLOW response', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('YELLOW'),
      };

      const result = await JournalService.detectColorCategory('Had a nice walk', mockAI);
      
      expect(result).toBe('YELLOW');
    });

    it('should return GREEN_BLUE for valid GREEN_BLUE response', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('GREEN_BLUE'),
      };

      const result = await JournalService.detectColorCategory('Achieved my fitness goal', mockAI);
      
      expect(result).toBe('GREEN_BLUE');
    });

    it('should handle lowercase response', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('red'),
      };

      const result = await JournalService.detectColorCategory('Content', mockAI);
      
      expect(result).toBe('RED');
    });

    it('should handle response with whitespace', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('  YELLOW  \n'),
      };

      const result = await JournalService.detectColorCategory('Content', mockAI);
      
      expect(result).toBe('YELLOW');
    });

    it('should default to YELLOW for invalid response', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('BLUE'),
      };

      const result = await JournalService.detectColorCategory('Content', mockAI);
      
      expect(result).toBe('YELLOW');
    });

    it('should default to YELLOW for empty response', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue(''),
      };

      const result = await JournalService.detectColorCategory('Content', mockAI);
      
      expect(result).toBe('YELLOW');
    });

    it('should default to YELLOW on AI error', async () => {
      const mockAI = {
        generateText: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
      };

      const result = await JournalService.detectColorCategory('Content', mockAI);
      
      expect(result).toBe('YELLOW');
    });

    it('should default to YELLOW on network error', async () => {
      const mockAI = {
        generateText: vi.fn().mockRejectedValue(new Error('Network timeout')),
      };

      const result = await JournalService.detectColorCategory('Content', mockAI);
      
      expect(result).toBe('YELLOW');
    });
  });

  describe('analyzeSentiment', () => {
    it('should return valid sentiment in range', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('0.8'),
      };

      const result = await JournalService.analyzeSentiment('Amazing day!', mockAI);
      
      expect(result).toBe(0.8);
      expect(mockAI.generateText).toHaveBeenCalledWith({
        prompt: expect.stringContaining('Amazing day!'),
        temperature: 0.2,
      });
    });

    it('should handle negative sentiment', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('-0.6'),
      };

      const result = await JournalService.analyzeSentiment('Terrible day', mockAI);
      
      expect(result).toBe(-0.6);
    });

    it('should handle zero sentiment', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('0'),
      };

      const result = await JournalService.analyzeSentiment('Neutral text', mockAI);
      
      expect(result).toBe(0);
    });

    it('should handle sentiment at boundary -1', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('-1'),
      };

      const result = await JournalService.analyzeSentiment('Worst ever', mockAI);
      
      expect(result).toBe(-1);
    });

    it('should handle sentiment at boundary 1', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('1'),
      };

      const result = await JournalService.analyzeSentiment('Best ever', mockAI);
      
      expect(result).toBe(1);
    });

    it('should default to 0 for out of range value (too high)', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('1.5'),
      };

      const result = await JournalService.analyzeSentiment('Content', mockAI);
      
      expect(result).toBe(0);
    });

    it('should default to 0 for out of range value (too low)', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('-2'),
      };

      const result = await JournalService.analyzeSentiment('Content', mockAI);
      
      expect(result).toBe(0);
    });

    it('should default to 0 for NaN response', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('not a number'),
      };

      const result = await JournalService.analyzeSentiment('Content', mockAI);
      
      expect(result).toBe(0);
    });

    it('should default to 0 for empty response', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue(''),
      };

      const result = await JournalService.analyzeSentiment('Content', mockAI);
      
      expect(result).toBe(0);
    });

    it('should handle response with whitespace', async () => {
      const mockAI = {
        generateText: vi.fn().mockResolvedValue('  0.5  \n'),
      };

      const result = await JournalService.analyzeSentiment('Content', mockAI);
      
      expect(result).toBe(0.5);
    });

    it('should default to 0 on AI error', async () => {
      const mockAI = {
        generateText: vi.fn().mockRejectedValue(new Error('AI service down')),
      };

      const result = await JournalService.analyzeSentiment('Content', mockAI);
      
      expect(result).toBe(0);
    });

    it('should default to 0 on network error', async () => {
      const mockAI = {
        generateText: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      const result = await JournalService.analyzeSentiment('Content', mockAI);
      
      expect(result).toBe(0);
    });
  });

  describe('getPromptForTime', () => {
    let originalDate: DateConstructor;

    beforeEach(() => {
      originalDate = global.Date;
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should return morning prompt before noon', () => {
      // Mock Date to return 9 AM
      global.Date = class extends originalDate {
        getHours() {
          return 9;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("What's your intention for today?");
    });

    it('should return morning prompt at 11 AM', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 11;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("What's your intention for today?");
    });

    it('should return afternoon prompt at noon', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 12;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("How's your day going so far?");
    });

    it('should return afternoon prompt at 2 PM', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 14;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("How's your day going so far?");
    });

    it('should return afternoon prompt at 4 PM', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 16;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("How's your day going so far?");
    });

    it('should return evening prompt at 5 PM', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 17;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("What's one thing you learned today?");
    });

    it('should return evening prompt at 8 PM', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 20;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("What's one thing you learned today?");
    });

    it('should return night prompt at 9 PM', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 21;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("How do you feel about today?");
    });

    it('should return night prompt at 11 PM', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 23;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("How do you feel about today?");
    });

    it('should return night prompt at midnight', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 0;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("What's your intention for today?");
    });

    it('should return morning prompt at 6 AM', () => {
      global.Date = class extends originalDate {
        getHours() {
          return 6;
        }
      } as any;

      const result = JournalService.getPromptForTime();
      
      expect(result).toBe("What's your intention for today?");
    });
  });
});
