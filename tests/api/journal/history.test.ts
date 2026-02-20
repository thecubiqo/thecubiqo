/**
 * Journal History API Tests
 * Tests for /api/journal/history endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/journal/history/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('/api/journal/history', () => {
  let mockSupabase: any;
  let mockAuthGetUser: any;
  let mockFrom: any;
  let mockSelect: any;
  let mockEq: any;
  let mockOrder: any;
  let mockRange: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock chain
    mockRange = vi.fn().mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    mockOrder = vi.fn().mockReturnValue({
      range: mockRange,
    });

    mockEq = vi.fn().mockReturnValue({
      order: mockOrder,
    });

    mockSelect = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    mockAuthGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });

    mockSupabase = {
      auth: {
        getUser: mockAuthGetUser,
      },
      from: mockFrom,
    };

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Unauthorized');
    });

    it('should return 401 when auth error occurs', async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
    });
  });

  describe('Successful Queries', () => {
    it('should return empty array when user has no entries', async () => {
      const request = new NextRequest('http://localhost:3000/api/journal/history');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.entries).toEqual([]);
      expect(json.pagination.total).toBe(0);
      expect(json.pagination.hasMore).toBe(false);
    });

    it('should return journal entries for authenticated user', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          content: 'Test journal entry 1',
          mood: 'positive',
          color_state: 'ORANGE',
          word_count: 50,
          duration_seconds: 300,
          created_at: '2026-02-15T10:00:00Z',
        },
        {
          id: 'entry-2',
          content: 'Test journal entry 2',
          mood: 'reflective',
          color_state: 'ORANGE',
          word_count: 75,
          duration_seconds: 450,
          created_at: '2026-02-14T10:00:00Z',
        },
      ];

      mockRange.mockResolvedValue({
        data: mockEntries,
        error: null,
        count: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.entries).toHaveLength(2);
      expect(json.entries[0].id).toBe('entry-1');
      expect(json.pagination.total).toBe(2);
      expect(json.pagination.returned).toBe(2);
      expect(json.userId).toBe('test-user-id');
    });

    it('should filter entries by user_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/journal/history');
      await GET(request);

      expect(mockFrom).toHaveBeenCalledWith('journal_entries');
      expect(mockSelect).toHaveBeenCalledWith(
        'id, content, mood, color_state, word_count, duration_seconds, created_at',
        { count: 'exact' }
      );
      expect(mockEq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('should order entries by created_at descending', async () => {
      const request = new NextRequest('http://localhost:3000/api/journal/history');
      await GET(request);

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('Pagination', () => {
    it('should use default limit of 30', async () => {
      const request = new NextRequest('http://localhost:3000/api/journal/history');
      await GET(request);

      expect(mockRange).toHaveBeenCalledWith(0, 29);
    });

    it('should respect custom limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/journal/history?limit=10');
      await GET(request);

      expect(mockRange).toHaveBeenCalledWith(0, 9);
    });

    it('should cap limit at 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/journal/history?limit=200');
      await GET(request);

      expect(mockRange).toHaveBeenCalledWith(0, 99);
    });

    it('should respect offset parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/journal/history?offset=30&limit=10');
      await GET(request);

      expect(mockRange).toHaveBeenCalledWith(30, 39);
    });

    it('should calculate hasMore correctly when more entries exist', async () => {
      mockRange.mockResolvedValue({
        data: new Array(30).fill({ id: 'test' }),
        error: null,
        count: 100,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history?limit=30');
      const response = await GET(request);
      const json = await response.json();

      expect(json.pagination.hasMore).toBe(true);
      expect(json.pagination.total).toBe(100);
    });

    it('should calculate hasMore correctly when no more entries exist', async () => {
      mockRange.mockResolvedValue({
        data: new Array(10).fill({ id: 'test' }),
        error: null,
        count: 10,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history?limit=30');
      const response = await GET(request);
      const json = await response.json();

      expect(json.pagination.hasMore).toBe(false);
      expect(json.pagination.total).toBe(10);
    });
  });

  describe('Search Functionality', () => {
    it('should search content when search parameter provided', async () => {
      const mockIlike = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      mockEq.mockReturnValue({
        ilike: mockIlike,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history?search=grateful');
      await GET(request);

      expect(mockIlike).toHaveBeenCalledWith('content', '%grateful%');
    });

    it('should trim search query', async () => {
      const mockIlike = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      mockEq.mockReturnValue({
        ilike: mockIlike,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history?search=  grateful  ');
      await GET(request);

      expect(mockIlike).toHaveBeenCalledWith('content', '%grateful%');
    });

    it('should not apply search filter when search is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/journal/history?search=');
      await GET(request);

      expect(mockEq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockOrder).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database query fails', async () => {
      mockRange.mockResolvedValue({
        data: null,
        error: new Error('Database connection error'),
        count: null,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Failed to fetch journal entries');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockAuthGetUser.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/journal/history');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Unexpected error');
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockRange.mockResolvedValue({
        data: null,
        error: new Error('Test error'),
        count: null,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history');
      await GET(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Journal/History] Query error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test content',
        mood: 'positive',
        color_state: 'ORANGE',
        word_count: 50,
        duration_seconds: 300,
        created_at: '2026-02-15T10:00:00Z',
      };

      mockRange.mockResolvedValue({
        data: [mockEntry],
        error: null,
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history');
      const response = await GET(request);
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('entries');
      expect(json).toHaveProperty('pagination');
      expect(json).toHaveProperty('userId');

      expect(json.pagination).toHaveProperty('total');
      expect(json.pagination).toHaveProperty('limit');
      expect(json.pagination).toHaveProperty('offset');
      expect(json.pagination).toHaveProperty('hasMore');
      expect(json.pagination).toHaveProperty('returned');
    });

    it('should only return specified fields', async () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test content',
        mood: 'positive',
        color_state: 'ORANGE',
        word_count: 50,
        duration_seconds: 300,
        created_at: '2026-02-15T10:00:00Z',
      };

      mockRange.mockResolvedValue({
        data: [mockEntry],
        error: null,
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/journal/history');
      const response = await GET(request);
      const json = await response.json();

      const entry = json.entries[0];
      expect(Object.keys(entry)).toEqual([
        'id',
        'content',
        'mood',
        'color_state',
        'word_count',
        'duration_seconds',
        'created_at',
      ]);
    });
  });
});
