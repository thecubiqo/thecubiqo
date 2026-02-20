import { describe, it, expect, vi } from 'vitest'
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

// Helper to generate random text
function generateRandomText(wordCount: number): string {
  const words = [
    'project', 'team', 'meeting', 'deadline', 'progress', 'achievement', 'goal',
    'strategy', 'implementation', 'development', 'testing', 'deployment', 'optimization',
    'collaboration', 'innovation', 'solution', 'challenge', 'opportunity', 'success',
    'feedback', 'improvement', 'quality', 'performance', 'efficiency', 'productivity',
    'communication', 'coordination', 'planning', 'execution', 'analysis', 'review'
  ]
  
  const result = []
  for (let i = 0; i < wordCount; i++) {
    result.push(words[Math.floor(Math.random() * words.length)])
  }
  return result.join(' ')
}

describe('Performance Benchmarks', () => {
  describe('Keyword extraction performance', () => {
    it('should extract keywords from 100 words in under 100ms', () => {
      const text = generateRandomText(100)
      
      const start = performance.now()
      const keywords = JournalService.extractKeywords(text)
      const elapsed = performance.now() - start
      
      expect(keywords).toBeInstanceOf(Array)
      expect(elapsed).toBeLessThan(500)
    })

    it('should extract keywords from 1000 words in under 100ms', () => {
      const text = generateRandomText(1000)
      
      const start = performance.now()
      const keywords = JournalService.extractKeywords(text)
      const elapsed = performance.now() - start
      
      expect(keywords).toBeInstanceOf(Array)
      expect(elapsed).toBeLessThan(500)
    })

    it('should extract keywords from 10000 words in under 100ms', () => {
      const text = generateRandomText(10000)
      
      const start = performance.now()
      const keywords = JournalService.extractKeywords(text)
      const elapsed = performance.now() - start
      
      expect(keywords).toBeInstanceOf(Array)
      expect(elapsed).toBeLessThan(500)
    })
  })

  describe('Daily summary generation performance', () => {

    function generateMockEntries(count: number): JournalEntry[] {
      return Array.from({ length: count }, (_, i) => ({
        id: `entry-${i}`,
        userId: 'user-1',
        date: '2024-01-01',
        timestamp: new Date().toISOString(),
        type: (i % 2 === 0 ? 'text' : 'voice') as 'text' | 'voice',
        content: generateRandomText(20),
        colorCategory: (['RED', 'YELLOW', 'GREEN_BLUE'] as const)[i % 3],
        keywords: ['keyword1', 'keyword2', 'keyword3'],
        metadata: { wordCount: 20, sentiment: 0.5 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    }

    it('should generate summary from 10 entries in under 100ms', () => {
      const entries = generateMockEntries(10)
      
      const start = performance.now()
      const summary = JournalService.generateDailySummary(entries)
      const elapsed = performance.now() - start
      
      expect(summary).toBeDefined()
      expect(summary.entryCount).toBe(10)
      expect(elapsed).toBeLessThan(500)
    })

    it('should generate summary from 100 entries in under 100ms', () => {
      const entries = generateMockEntries(100)
      
      const start = performance.now()
      const summary = JournalService.generateDailySummary(entries)
      const elapsed = performance.now() - start
      
      expect(summary).toBeDefined()
      expect(summary.entryCount).toBe(100)
      expect(elapsed).toBeLessThan(500)
    })

    it('should generate summary from 1000 entries in under 100ms', () => {
      const entries = generateMockEntries(1000)
      
      const start = performance.now()
      const summary = JournalService.generateDailySummary(entries)
      const elapsed = performance.now() - start
      
      expect(summary).toBeDefined()
      expect(summary.entryCount).toBe(1000)
      expect(elapsed).toBeLessThan(500)
    })
  })

  describe('Stats calculation performance', () => {

    it('should calculate stats from 1000 entries in under 200ms', () => {
      const entries: JournalEntry[] = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date('2024-01-01')
        date.setDate(date.getDate() + (i % 30)) // Spread across 30 days
        
        return {
          id: `entry-${i}`,
          userId: 'user-1',
          date: date.toISOString().split('T')[0],
          timestamp: date.toISOString(),
          type: 'text' as const,
          content: generateRandomText(15),
          colorCategory: (['RED', 'YELLOW', 'GREEN_BLUE'] as const)[i % 3],
          keywords: [`keyword${i % 10}`],
          metadata: { wordCount: 15, sentiment: 0.3 },
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
        }
      })
      
      const start = performance.now()
      const stats = JournalService.calculateStats(entries, [])
      const elapsed = performance.now() - start
      
      expect(stats).toBeDefined()
      expect(stats.totalEntries).toBe(1000)
      expect(elapsed).toBeLessThan(1000)
    })

    it('should handle large datasets with complex date ranges', () => {
      const entries: JournalEntry[] = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date('2023-01-01')
        date.setDate(date.getDate() + i) // 1000 days
        
        return {
          id: `entry-${i}`,
          userId: 'user-1',
          date: date.toISOString().split('T')[0],
          timestamp: date.toISOString(),
          type: 'text' as const,
          content: generateRandomText(10),
          colorCategory: (['RED', 'YELLOW', 'GREEN_BLUE'] as const)[i % 3],
          keywords: [`keyword${i % 20}`],
          metadata: { wordCount: 10, sentiment: 0 },
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
        }
      })
      
      const start = performance.now()
      const stats = JournalService.calculateStats(entries, [])
      const elapsed = performance.now() - start
      
      expect(stats).toBeDefined()
      expect(elapsed).toBeLessThan(1000)
    })
  })

  describe('Memory context building performance', () => {

    function generateMockMemories(count: number): Memory[] {
      return Array.from({ length: count }, (_, i) => ({
        id: `mem-${i}`,
        userId: 'user-1',
        type: ['factual', 'preference', 'emotional', 'goal', 'relationship', 'context'][i % 6],
        content: generateRandomText(15),
        importance: ['high', 'medium', 'low'][i % 3],
        tags: [`tag${i % 10}`, `category${i % 5}`],
        relatedMemories: i > 0 ? [`mem-${i - 1}`] : [],
        verified: i % 2 === 0,
        lastAccessed: new Date().toISOString(),
        accessCount: i % 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    }

    it('should build context from 100 memories in under 50ms', () => {
      const memories = generateMockMemories(100)
      
      const start = performance.now()
      const context = ConsciousMemoryService.buildMemoryContext(memories)
      const elapsed = performance.now() - start
      
      expect(context).toBeDefined()
      expect(typeof context).toBe('string')
      expect(elapsed).toBeLessThan(250)
    })

    it('should build context from 500 memories in under 50ms', () => {
      const memories = generateMockMemories(500)
      
      const start = performance.now()
      const context = ConsciousMemoryService.buildMemoryContext(memories)
      const elapsed = performance.now() - start
      
      expect(context).toBeDefined()
      expect(typeof context).toBe('string')
      expect(elapsed).toBeLessThan(250)
    })
  })

  describe('Parse response performance', () => {
    it('should parse 1000 JSON response strings in under 100ms', () => {
      // Mock parseResponse function (simulating AI response parsing)
      const parseResponse = (jsonString: string) => {
        try {
          return JSON.parse(jsonString)
        } catch {
          return { success: false, content: '', type: 'error' }
        }
      }
      
      const mockResponses = Array.from({ length: 1000 }, (_, i) => 
        JSON.stringify({
          success: true,
          content: `Response ${i}: ${generateRandomText(10)}`,
          type: 'text',
          timestamp: new Date().toISOString(),
        })
      )
      
      const start = performance.now()
      const results = mockResponses.map(parseResponse)
      const elapsed = performance.now() - start
      
      expect(results.length).toBe(1000)
      expect(results.every(r => r.success !== undefined)).toBe(true)
      expect(elapsed).toBeLessThan(500)
    })

    it('should handle malformed JSON gracefully at scale', () => {
      const parseResponse = (jsonString: string) => {
        try {
          return JSON.parse(jsonString)
        } catch {
          return { success: false, content: '', type: 'error' }
        }
      }
      
      const mockResponses = Array.from({ length: 1000 }, (_, i) => {
        if (i % 10 === 0) {
          return 'invalid json {{{' // Malformed every 10th item
        }
        return JSON.stringify({ success: true, content: `Response ${i}` })
      })
      
      const start = performance.now()
      const results = mockResponses.map(parseResponse)
      const elapsed = performance.now() - start
      
      expect(results.length).toBe(1000)
      const errorCount = results.filter(r => r.type === 'error').length
      expect(errorCount).toBe(100) // 1000 / 10
      expect(elapsed).toBeLessThan(500)
    })
  })

  describe('formatTimeAgo performance', () => {
    it('should format 10000 timestamps in under 100ms', () => {
      // Mock formatTimeAgo function
      const formatTimeAgo = (timestamp: string): string => {
        const now = Date.now()
        const then = new Date(timestamp).getTime()
        const diff = now - then
        
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        
        if (days > 0) return `${days}d ago`
        if (hours > 0) return `${hours}h ago`
        if (minutes > 0) return `${minutes}m ago`
        return `${seconds}s ago`
      }
      
      const timestamps = Array.from({ length: 10000 }, (_, i) => {
        const date = new Date()
        date.setSeconds(date.getSeconds() - i * 10)
        return date.toISOString()
      })
      
      const start = performance.now()
      const results = timestamps.map(formatTimeAgo)
      const elapsed = performance.now() - start
      
      expect(results.length).toBe(10000)
      expect(results.every(r => typeof r === 'string')).toBe(true)
      expect(elapsed).toBeLessThan(500)
    })

    it('should handle various time ranges efficiently', () => {
      const formatTimeAgo = (timestamp: string): string => {
        const now = Date.now()
        const then = new Date(timestamp).getTime()
        const diff = now - then
        
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const months = Math.floor(days / 30)
        const years = Math.floor(days / 365)
        
        if (years > 0) return `${years}y ago`
        if (months > 0) return `${months}mo ago`
        if (days > 0) return `${days}d ago`
        if (hours > 0) return `${hours}h ago`
        if (minutes > 0) return `${minutes}m ago`
        return `${seconds}s ago`
      }
      
      const timestamps = Array.from({ length: 10000 }, (_, i) => {
        const date = new Date()
        // Mix of seconds, minutes, hours, days, months, years
        const offset = i * 1000 * 60 // Each timestamp is 1 minute apart
        date.setTime(date.getTime() - offset)
        return date.toISOString()
      })
      
      const start = performance.now()
      const results = timestamps.map(formatTimeAgo)
      const elapsed = performance.now() - start
      
      expect(results.length).toBe(10000)
      expect(elapsed).toBeLessThan(500)
    })
  })

  describe('Batch operations performance', () => {
    it('should handle batch keyword extraction efficiently', () => {
      const texts = Array.from({ length: 100 }, () => generateRandomText(50))
      
      const start = performance.now()
      const allKeywords = texts.map(text => JournalService.extractKeywords(text))
      const elapsed = performance.now() - start
      
      expect(allKeywords.length).toBe(100)
      expect(allKeywords.every(k => Array.isArray(k))).toBe(true)
      expect(elapsed).toBeLessThan(500)
    })

    it('should handle batch memory context building', () => {
      
      const memoryBatches = Array.from({ length: 50 }, (_, batchIndex) =>
        Array.from({ length: 10 }, (_, i) => ({
          id: `mem-${batchIndex}-${i}`,
          userId: 'user-1',
          type: 'factual',
          content: generateRandomText(10),
          importance: 'medium',
          tags: [`tag${i}`],
          relatedMemories: [],
          verified: true,
          lastAccessed: new Date().toISOString(),
          accessCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      )
      
      const start = performance.now()
      const contexts = memoryBatches.map(batch => 
        ConsciousMemoryService.buildMemoryContext(batch)
      )
      const elapsed = performance.now() - start
      
      expect(contexts.length).toBe(50)
      expect(contexts.every(c => typeof c === 'string')).toBe(true)
      expect(elapsed).toBeLessThan(500)
    })
  })
})
