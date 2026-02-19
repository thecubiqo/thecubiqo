import { describe, it, expect } from 'vitest'
import {
  detectInterestCategories,
  hasDealIntent,
  fetchDeals,
  getContextualDeals,
} from '@/lib/deals/deals-service'

describe('Deals Service', () => {
  describe('detectInterestCategories', () => {
    it('should detect food-related interests', () => {
      const categories = detectInterestCategories('I want to find a great restaurant for dinner')
      expect(categories).toContain('food')
    })

    it('should detect travel-related interests', () => {
      const categories = detectInterestCategories('Planning a vacation trip')
      expect(categories).toContain('travel')
    })

    it('should detect multiple categories', () => {
      const categories = detectInterestCategories('I need a hotel and a nice restaurant')
      expect(categories).toContain('travel')
      expect(categories).toContain('food')
    })

    it('should return empty array for unrelated text', () => {
      const categories = detectInterestCategories('Hello, how are you?')
      expect(categories).toHaveLength(0)
    })

    it('should be case-insensitive', () => {
      const categories = detectInterestCategories('SUSHI is my favorite FOOD')
      expect(categories).toContain('food')
    })
  })

  describe('hasDealIntent', () => {
    it('should detect deal-related keywords', () => {
      expect(hasDealIntent('Find me the best deals')).toBe(true)
      expect(hasDealIntent('Any discounts available?')).toBe(true)
      expect(hasDealIntent('I want a coupon')).toBe(true)
      expect(hasDealIntent('looking for a sale')).toBe(true)
    })

    it('should detect groupon keyword', () => {
      expect(hasDealIntent('something like groupon')).toBe(true)
    })

    it('should return false for non-deal text', () => {
      expect(hasDealIntent('Hello, how are you?')).toBe(false)
      expect(hasDealIntent('Tell me about the weather')).toBe(false)
    })
  })

  describe('fetchDeals', () => {
    it('should return deals for a category', async () => {
      const result = await fetchDeals({ category: 'food' })
      expect(result.deals.length).toBeGreaterThan(0)
      expect(result.deals.every(d => d.category === 'food')).toBe(true)
      expect(result.timestamp).toBeDefined()
    })

    it('should filter by query text', async () => {
      const result = await fetchDeals({ query: 'sushi' })
      expect(result.deals.length).toBeGreaterThan(0)
      expect(result.deals[0].title.toLowerCase()).toContain('sushi')
    })

    it('should respect maxResults', async () => {
      const result = await fetchDeals({ maxResults: 2 })
      expect(result.deals.length).toBeLessThanOrEqual(2)
    })

    it('should return empty array for non-matching query', async () => {
      const result = await fetchDeals({ query: 'xyznonexistent123' })
      expect(result.deals).toHaveLength(0)
    })
  })

  describe('getContextualDeals', () => {
    it('should return deals for interest-related messages', async () => {
      const deals = await getContextualDeals('I want to find a restaurant')
      expect(deals.length).toBeGreaterThan(0)
      expect(deals[0].category).toBe('food')
    })

    it('should return deals for deal-intent messages', async () => {
      const deals = await getContextualDeals('Show me the best deals')
      expect(deals.length).toBeGreaterThan(0)
    })

    it('should return empty array for unrelated messages', async () => {
      const deals = await getContextualDeals('Hello, how are you?')
      expect(deals).toHaveLength(0)
    })

    it('should respect maxResults limit', async () => {
      const deals = await getContextualDeals('Find me food and travel deals', 2)
      expect(deals.length).toBeLessThanOrEqual(2)
    })

    it('should deduplicate deals across categories', async () => {
      const deals = await getContextualDeals('food restaurant dinner deals')
      const ids = deals.map(d => d.id)
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    })
  })
})
