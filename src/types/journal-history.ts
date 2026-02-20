/**
 * Type definitions for Journal History feature
 */

export interface JournalHistoryEntry {
  id: string;
  content: string;
  mood: string | null;
  color_state: string | null;
  word_count: number;
  duration_seconds: number;
  created_at: string;
}

export interface JournalHistoryPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  returned: number;
}

export interface JournalHistoryResponse {
  success: boolean;
  entries: JournalHistoryEntry[];
  pagination: JournalHistoryPagination;
  userId: string;
  error?: string;
}
