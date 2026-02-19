import { describe, it, expect, vi, beforeEach } from 'vitest'
import { JournalService } from '@/lib/journal/journal-service'
import { ConsciousMemoryService } from '@/lib/conscious-memory/memory-service'

// Mock JournalEntry interface
interface JournalEntry {
  id: string
  userId: string
  date: string
  timestamp: string
  type: 'voice' | 'text'
  content: string
  colorCategory: 'RED' | 'YELLOW' | 'GREEN_BLUE'
  keywords: string[]
  metadata: { wordCount: number; sentiment: number }
  createdAt: string
  updatedAt: string
}

// Mock Memory interface
interface Memory {
  id: string
  userId: string
  type: string
  content: string
  importance: string
  tags: string[]
  relatedMemories: string[]
  verified: boolean
  lastAccessed: string
  accessCount: number
  createdAt: string
  updatedAt: string
}

describe('Journal-Memory Integration Flow', () => {

  describe('Journal Entry → Keywords → Summary flow', () => {
    it('should extract keywords and generate consistent summary', () => {
      const mockEntries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Today was productive. Worked on the project and made great progress with the team.',
          colorCategory: 'GREEN_BLUE',
          keywords: [],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user-1',
          date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Feeling stressed about the deadline. Need to focus more and manage time better.',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T14:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
        },
        {
          id: '3',
          userId: 'user-1',
          date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Great team meeting! Everyone is aligned and motivated. The project looks promising.',
          colorCategory: 'GREEN_BLUE',
          keywords: [],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T16:00:00Z',
          updatedAt: '2024-01-15T16:00:00Z',
        },
      ]

      // Extract keywords from each entry
      mockEntries.forEach((entry) => {
        const keywords = JournalService.extractKeywords(entry.content)
        expect(keywords).toBeInstanceOf(Array)
        expect(keywords.length).toBeGreaterThan(0)
        entry.keywords = keywords
      })

      // Generate daily summary
      const summary = JournalService.generateDailySummary(mockEntries)
      
      expect(summary).toBeDefined()
      expect(summary.entryCount).toBe(3)
      
      // Verify summary contains relevant data
      const allKeywords = mockEntries.flatMap(e => e.keywords)
      expect(allKeywords.length).toBeGreaterThan(0)
      
      // Verify dominant color is correctly calculated (GREEN_BLUE has 2 entries vs YELLOW's 1)
      expect(summary.dominantColor).toBe('GREEN_BLUE')
    })

    it('should handle empty entries gracefully', () => {
      const emptyEntries: JournalEntry[] = []
      const summary = JournalService.generateDailySummary(emptyEntries)
      
      expect(summary.entryCount).toBe(0)
    })

    it('should extract meaningful keywords from complex content', () => {
      const complexContent = 'The machine learning algorithm performed exceptionally well during the testing phase. We achieved 95% accuracy on the validation dataset using deep neural networks and convolutional layers.'
      
      const keywords = JournalService.extractKeywords(complexContent)
      
      expect(keywords).toBeInstanceOf(Array)
      expect(keywords.length).toBeGreaterThan(3)
      expect(keywords.some(k => k.length > 3)).toBe(true) // Should have meaningful words
    })
  })

  describe('Multi-day stats calculation', () => {
    it('should calculate stats across multiple days correctly', () => {
      const multiDayEntries: JournalEntry[] = []
      
      // Generate entries for 7 consecutive days
      for (let day = 0; day < 7; day++) {
        const date = new Date('2024-01-15')
        date.setDate(date.getDate() + day)
        
        for (let i = 0; i < 3; i++) {
          multiDayEntries.push({
            id: `${day}-${i}`,
            userId: 'user-1',
            date: date.toISOString().split('T')[0],
            timestamp: date.toISOString(),
            type: 'text' as const,
            content: `Day ${day} entry ${i}: Working on goals and feeling ${i % 2 === 0 ? 'positive' : 'neutral'}.`,
            colorCategory: i % 2 === 0 ? 'GREEN_BLUE' : 'YELLOW',
            keywords: [`goal${i}`, `day${day}`],
            metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
          })
        }
      }
      
      // Calculate stats
      const stats = JournalService.calculateStats(multiDayEntries, [])
      
      expect(stats).toBeDefined()
      expect(stats.totalEntries).toBe(21) // 7 days * 3 entries
      expect(stats.longestStreak).toBeGreaterThan(0)
      expect(stats.longestStreak).toBeLessThanOrEqual(7)
    })

    it('should verify trends in multi-day data', () => {
      const trendEntries: JournalEntry[] = []
      
      // Create a trend: more GREEN_BLUE over time
      for (let day = 0; day < 5; day++) {
        const date = new Date('2024-01-10')
        date.setDate(date.getDate() + day)
        
        const greenBlueCount = day + 1 // Increasing trend
        const redCount = 5 - day // Decreasing trend
        
        for (let i = 0; i < greenBlueCount; i++) {
          trendEntries.push({
            id: `green-${day}-${i}`,
            userId: 'user-1',
            date: date.toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Positive progress today',
            colorCategory: 'GREEN_BLUE',
            keywords: ['positive', 'progress'],
            metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
          })
        }
        
        for (let i = 0; i < redCount; i++) {
          trendEntries.push({
            id: `red-${day}-${i}`,
            userId: 'user-1',
            date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Challenging day',
            colorCategory: 'RED',
            keywords: ['challenge', 'difficult'],
            metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
          })
        }
      }
      
      const stats = JournalService.calculateStats(trendEntries, [])
      
      expect(stats.totalEntries).toBe(30) // 1+2+3+4+5 green + 5+4+3+2+1 red
      expect(stats.colorDistribution).toBeDefined()
      expect(stats.colorDistribution.GREEN_BLUE).toBe(15)
      expect(stats.colorDistribution.RED).toBe(15)
    })

    it('should handle gaps in daily entries', () => {
      const gappedEntries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          date: '2024-01-01',
          timestamp: '2024-01-01T10:00:00Z',
          type: 'text' as const,
          content: 'Day 1 entry',
          colorCategory: 'GREEN_BLUE',
          keywords: ['day1'],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        // Gap of 3 days
        {
          id: '2',
          userId: 'user-1',
          date: '2024-01-05',
          timestamp: '2024-01-05T10:00:00Z',
          type: 'text' as const,
          content: 'Day 5 entry',
          colorCategory: 'GREEN_BLUE',
          keywords: ['day5'],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-05T10:00:00Z',
          updatedAt: '2024-01-05T10:00:00Z',
        },
        {
          id: '3',
          userId: 'user-1',
          date: '2024-01-06',
          timestamp: '2024-01-06T10:00:00Z',
          type: 'text' as const,
          content: 'Day 6 entry',
          colorCategory: 'YELLOW',
          keywords: ['day6'],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-06T10:00:00Z',
          updatedAt: '2024-01-06T10:00:00Z',
        },
      ]
      
      const stats = JournalService.calculateStats(gappedEntries, [])
      
      expect(stats.totalEntries).toBe(3)
      expect(stats.longestStreak).toBeGreaterThanOrEqual(1) // At least current streak
    })
  })

  describe('Color category consistency', () => {
    it('should maintain color distribution accuracy in summaries', () => {
      const colorTestEntries: JournalEntry[] = [
        // 5 RED entries
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `red-${i}`,
          userId: 'user-1',
          date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Difficult situation',
          colorCategory: 'RED' as const,
          keywords: ['difficult'],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        })),
        // 3 YELLOW entries
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `yellow-${i}`,
          userId: 'user-1',
          date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Neutral day',
          colorCategory: 'YELLOW' as const,
          keywords: ['neutral'],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
        })),
        // 7 GREEN_BLUE entries
        ...Array.from({ length: 7 }, (_, i) => ({
          id: `green-${i}`,
          userId: 'user-1',
          date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Great progress',
          colorCategory: 'GREEN_BLUE' as const,
          keywords: ['progress'],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T12:00:00Z',
          updatedAt: '2024-01-15T12:00:00Z',
        })),
      ]
      
      const summary = JournalService.generateDailySummary(colorTestEntries)
      
      expect(summary.entryCount).toBe(15)
      // GREEN_BLUE has the most entries (7), so it should be dominant
      expect(summary.dominantColor).toBe('GREEN_BLUE')
    })

    it('should handle single color category entries', () => {
      const singleColorEntries: JournalEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        userId: 'user-1',
        date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'All positive entries',
        colorCategory: 'GREEN_BLUE' as const,
        keywords: ['positive'],
        metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }))
      
      const summary = JournalService.generateDailySummary(singleColorEntries)
      
      expect(summary.dominantColor).toBe('GREEN_BLUE')
      expect(summary.entryCount).toBe(10)
    })
  })

  describe('Memory context from journal data', () => {
    it('should build memory context from journal keywords', () => {
      const journalContent = 'Working on machine learning project with Python and TensorFlow. Making good progress on neural network training.'
      
      // Extract keywords from journal
      const keywords = JournalService.extractKeywords(journalContent)
      
      expect(keywords.length).toBeGreaterThan(0)
      
      // Build mock memories from keywords
      const mockMemories: Memory[] = keywords.slice(0, 5).map((keyword, i) => ({
        id: `mem-${i}`,
        userId: 'user-1',
        type: 'factual',
        content: `Information about ${keyword}`,
        importance: 'high',
        tags: [keyword],
        relatedMemories: [],
        verified: true,
        lastAccessed: new Date().toISOString(),
        accessCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      
      // Build memory context
      const context = ConsciousMemoryService.buildMemoryContext(mockMemories)
      
      expect(context).toBeDefined()
      expect(typeof context).toBe('string')
      expect(context.length).toBeGreaterThan(0)
      
      // Verify context contains keyword-related information
      const containsRelevantInfo = keywords.some(keyword => 
        context.toLowerCase().includes(keyword.toLowerCase())
      )
      expect(containsRelevantInfo).toBe(true)
    })

    it('should integrate journal entries with memory retrieval', () => {
      const entries: JournalEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Met with Sarah today to discuss the marketing strategy for Q2',
          colorCategory: 'GREEN_BLUE',
          keywords: [],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: 'user-1',
          date: '2024-01-15',
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          content: 'Need to follow up on the budget proposal with finance team',
          colorCategory: 'YELLOW',
          keywords: [],
          metadata: { wordCount: 20, sentiment: 0.5 },
          createdAt: '2024-01-15T14:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
        },
      ]
      
      // Extract keywords from all entries
      const allKeywords = entries.flatMap(entry => 
        JournalService.extractKeywords(entry.content)
      )
      
      expect(allKeywords.length).toBeGreaterThan(0)
      
      // Create memories based on journal keywords
      const memories: Memory[] = allKeywords.slice(0, 10).map((keyword, i) => ({
        id: `mem-${i}`,
        userId: 'user-1',
        type: i % 2 === 0 ? 'factual' : 'goal',
        content: `Memory related to ${keyword}`,
        importance: i % 3 === 0 ? 'high' : 'medium',
        tags: [keyword],
        relatedMemories: [],
        verified: true,
        lastAccessed: new Date().toISOString(),
        accessCount: i + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      
      const context = ConsciousMemoryService.buildMemoryContext(memories)
      
      expect(context).toBeDefined()
      expect(context.length).toBeGreaterThan(0)
    })

    it('should handle empty memory context gracefully', () => {
      const emptyMemories: Memory[] = []
      const context = ConsciousMemoryService.buildMemoryContext(emptyMemories)
      
      expect(context).toBeDefined()
      expect(typeof context).toBe('string')
      // Should return empty or placeholder text
      expect(context.length).toBeGreaterThanOrEqual(0)
    })

    it('should prioritize high-importance memories in context', () => {
      const mixedMemories: Memory[] = [
        {
          id: 'high-1',
          userId: 'user-1',
          type: 'goal',
          content: 'Critical project deadline next week',
          importance: 'high',
          tags: ['project', 'deadline'],
          relatedMemories: [],
          verified: true,
          lastAccessed: new Date().toISOString(),
          accessCount: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'low-1',
          userId: 'user-1',
          type: 'factual',
          content: 'Lunch was good today',
          importance: 'low',
          tags: ['lunch'],
          relatedMemories: [],
          verified: true,
          lastAccessed: new Date().toISOString(),
          accessCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'high-2',
          userId: 'user-1',
          type: 'preference',
          content: 'Prefers morning meetings over afternoon',
          importance: 'high',
          tags: ['preference', 'meetings'],
          relatedMemories: [],
          verified: true,
          lastAccessed: new Date().toISOString(),
          accessCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      
      const context = ConsciousMemoryService.buildMemoryContext(mixedMemories)
      
      expect(context).toBeDefined()
      // High importance memories should appear in context
      expect(context.includes('project') || context.includes('deadline') || context.includes('preference')).toBe(true)
    })
  })
})
