/**
 * Type definitions for Rozana (Daily Journal) system
 */

export type ColorCategory = 'RED' | 'YELLOW' | 'GREEN_BLUE';
export type EntryType = 'voice' | 'text';
export type MoodType = 'energized' | 'focused' | 'calm' | 'reflective' | 'urgent' | 'playful' | 'serious';

export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO timestamp
  type: EntryType;
  content: string;
  colorCategory: ColorCategory;
  mood?: MoodType;
  keywords: string[];
  audioUrl?: string; // For voice entries
  transcription?: string; // For voice entries
  metadata: EntryMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface EntryMetadata {
  duration?: number; // seconds, for voice
  wordCount: number;
  sentiment: number; // -1 to 1
  aiGenerated?: boolean;
  editCount?: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  userId: string;
  entryCount: number;
  dominantColor: ColorCategory;
  avgMood: number;
  topKeywords: string[];
  highlights: string[];
  totalWords: number;
  voiceEntries: number;
  textEntries: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalPrompt {
  id: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  question: string;
  colorCategory?: ColorCategory;
  active: boolean;
}

export interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  colorDistribution: {
    RED: number;
    YELLOW: number;
    GREEN_BLUE: number;
  };
  moodTrends: Array<{
    date: string;
    avgMood: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
}

export interface CreateEntryInput {
  content: string;
  type: EntryType;
  colorCategory?: ColorCategory; // Auto-detected if not provided
  mood?: MoodType;
  audioUrl?: string;
  transcription?: string;
}

export interface UpdateEntryInput {
  content?: string;
  colorCategory?: ColorCategory;
  mood?: MoodType;
  keywords?: string[];
}

export interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  colorCategory?: ColorCategory;
  keywords?: string[];
  mood?: MoodType;
  searchQuery?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'markdown' | 'json';
  dateFrom: string;
  dateTo: string;
  includeMetadata?: boolean;
}
