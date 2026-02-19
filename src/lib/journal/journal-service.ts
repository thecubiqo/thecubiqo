/**
 * Journal Service - Core business logic for Rozana (Daily Journal)
 */

import type {
  JournalEntry,
  DailySummary,
  CreateEntryInput,
  UpdateEntryInput,
  SearchFilters,
  JournalStats,
  ColorCategory,
  MoodType,
} from './types';

export class JournalService {
  /**
   * Detect color category from content using AI
   */
  static async detectColorCategory(content: string, aiModel: any): Promise<ColorCategory> {
    const prompt = `Analyze this journal entry and categorize it into one of three colors:

RED: Urgent matters, important decisions, deep desires, passionate thoughts
YELLOW: Daily observations, friendly reflections, candid thoughts, playful notes
GREEN_BLUE: Goals and ambitions, focus areas, driven actions, sincere commitments

Entry: "${content}"

Respond with only: RED, YELLOW, or GREEN_BLUE`;

    try {
      const response = await aiModel.generateText({
        prompt,
        temperature: 0.3,
      });

      const color = response.trim().toUpperCase();
      
      if (['RED', 'YELLOW', 'GREEN_BLUE'].includes(color)) {
        return color as ColorCategory;
      }
      
      // Default to YELLOW if unclear
      return 'YELLOW';
    } catch (error) {
      
      return 'YELLOW'; // Safe default
    }
  }

  /**
   * Extract keywords from entry content
   */
  static extractKeywords(content: string): string[] {
    // Simple keyword extraction - can be enhanced with AI
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common words
    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'would', 'could', 'should']);
    const keywords = words.filter(word => !stopWords.has(word));

    // Get unique keywords
    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * Calculate sentiment score (-1 to 1)
   */
  static async analyzeSentiment(content: string, aiModel: any): Promise<number> {
    const prompt = `Analyze the sentiment of this text and respond with a number from -1 (very negative) to 1 (very positive):

"${content}"

Respond with only a number between -1 and 1.`;

    try {
      const response = await aiModel.generateText({
        prompt,
        temperature: 0.2,
      });

      const sentiment = parseFloat(response.trim());
      
      if (!isNaN(sentiment) && sentiment >= -1 && sentiment <= 1) {
        return sentiment;
      }
      
      return 0; // Neutral default
    } catch (error) {
      
      return 0;
    }
  }

  /**
   * Build entry metadata
   */
  static buildMetadata(content: string, sentiment: number, duration?: number): any {
    const wordCount = content.split(/\s+/).length;

    return {
      wordCount,
      sentiment,
      duration,
      aiGenerated: false,
      editCount: 0,
    };
  }

  /**
   * Generate daily summary
   */
  static generateDailySummary(entries: JournalEntry[]): Partial<DailySummary> {
    if (entries.length === 0) {
      return {
        entryCount: 0,
        dominantColor: 'YELLOW',
        avgMood: 0,
        topKeywords: [],
        highlights: [],
        totalWords: 0,
        voiceEntries: 0,
        textEntries: 0,
      };
    }

    // Count color occurrences
    const colorCounts: Record<ColorCategory, number> = {
      RED: 0,
      YELLOW: 0,
      GREEN_BLUE: 0,
    };

    let totalSentiment = 0;
    let totalWords = 0;
    const allKeywords: string[] = [];
    let voiceEntries = 0;
    let textEntries = 0;

    for (const entry of entries) {
      colorCounts[entry.colorCategory]++;
      totalSentiment += entry.metadata.sentiment;
      totalWords += entry.metadata.wordCount;
      allKeywords.push(...entry.keywords);
      
      if (entry.type === 'voice') voiceEntries++;
      else textEntries++;
    }

    // Dominant color
    const dominantColor = (Object.keys(colorCounts) as ColorCategory[])
      .reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b);

    // Top keywords
    const keywordCounts = new Map<string, number>();
    for (const keyword of allKeywords) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }

    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);

    // Highlights (entries with highest sentiment)
    const highlights = entries
      .sort((a, b) => b.metadata.sentiment - a.metadata.sentiment)
      .slice(0, 3)
      .map(entry => entry.content.substring(0, 100) + '...');

    return {
      entryCount: entries.length,
      dominantColor,
      avgMood: totalSentiment / entries.length,
      topKeywords,
      highlights,
      totalWords,
      voiceEntries,
      textEntries,
    };
  }

  /**
   * Calculate journal stats
   */
  static calculateStats(entries: JournalEntry[], summaries: DailySummary[]): JournalStats {
    // Color distribution
    const colorDistribution = {
      RED: 0,
      YELLOW: 0,
      GREEN_BLUE: 0,
    };

    for (const entry of entries) {
      colorDistribution[entry.colorCategory]++;
    }

    // Mood trends
    const moodTrends = summaries
      .map(summary => ({
        date: summary.date,
        avgMood: summary.avgMood,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top keywords
    const keywordCounts = new Map<string, number>();
    for (const entry of entries) {
      for (const keyword of entry.keywords) {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      }
    }

    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // Calculate streaks
    const dates = [...new Set(entries.map(e => e.date))].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      // Check if this is current streak
      if (dates[i] === today || dates[i] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
        currentStreak = tempStreak;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      totalEntries: entries.length,
      currentStreak,
      longestStreak,
      colorDistribution,
      moodTrends,
      topKeywords,
    };
  }

  /**
   * Get journal prompt for time of day
   */
  static getPromptForTime(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "What's your intention for today?";
    } else if (hour < 17) {
      return "How's your day going so far?";
    } else if (hour < 21) {
      return "What's one thing you learned today?";
    } else {
      return "How do you feel about today?";
    }
  }
}
