import { describe, it, expect } from 'vitest'
import {
  isFounder,
  getFeatureAccess,
  hasFeature,
  FOUNDER_ACCESS,
  USER_ACCESS,
  FEATURE_METADATA,
} from '@/lib/auth/feature-gate-simple'

describe('Feature Gate', () => {
  describe('isFounder', () => {
    it('should return true for known founder emails', () => {
      expect(isFounder('aditya@cubiqo.ai')).toBe(true)
      expect(isFounder('av.loy07@gmail.com')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isFounder('ADITYA@CUBIQO.AI')).toBe(true)
      expect(isFounder('Aditya@Cubiqo.AI')).toBe(true)
    })

    it('should return false for non-founder emails', () => {
      expect(isFounder('random@example.com')).toBe(false)
      expect(isFounder('test@test.com')).toBe(false)
    })

    it('should return false for null/undefined/empty', () => {
      expect(isFounder(null)).toBe(false)
      expect(isFounder(undefined)).toBe(false)
      expect(isFounder('')).toBe(false)
    })

    it('should handle whitespace in email', () => {
      expect(isFounder('  aditya@cubiqo.ai  ')).toBe(true)
    })
  })

  describe('getFeatureAccess', () => {
    it('should return FOUNDER_ACCESS for founder emails', () => {
      const access = getFeatureAccess('aditya@cubiqo.ai')
      expect(access).toEqual(FOUNDER_ACCESS)
    })

    it('should return user access for non-founder emails', () => {
      const access = getFeatureAccess('user@example.com')
      expect(access).toBeDefined()
      expect(access.home).toBe(true)
      expect(access.chat).toBe(true)
    })

    it('should return user access for null email', () => {
      const access = getFeatureAccess(null)
      expect(access).toBeDefined()
      expect(access.admin).toBe(false)
    })
  })

  describe('hasFeature', () => {
    it('should return true for enabled features for founders', () => {
      expect(hasFeature('aditya@cubiqo.ai', 'admin')).toBe(true)
      expect(hasFeature('aditya@cubiqo.ai', 'agents')).toBe(true)
      expect(hasFeature('aditya@cubiqo.ai', 'memory')).toBe(true)
    })

    it('should return false for disabled features for regular users', () => {
      expect(hasFeature('user@example.com', 'admin')).toBe(false)
      expect(hasFeature('user@example.com', 'agents')).toBe(false)
    })

    it('should return true for basic features for all users', () => {
      expect(hasFeature('user@example.com', 'home')).toBe(true)
      expect(hasFeature('user@example.com', 'chat')).toBe(true)
      expect(hasFeature('user@example.com', 'settings')).toBe(true)
    })
  })

  describe('FOUNDER_ACCESS', () => {
    it('should have all features enabled', () => {
      const allKeys = Object.keys(FOUNDER_ACCESS) as Array<keyof typeof FOUNDER_ACCESS>
      allKeys.forEach(key => {
        expect(FOUNDER_ACCESS[key]).toBe(true)
      })
    })
  })

  describe('FEATURE_METADATA', () => {
    it('should be a non-empty array', () => {
      expect(Array.isArray(FEATURE_METADATA)).toBe(true)
      expect(FEATURE_METADATA.length).toBeGreaterThan(0)
    })

    it('should have valid categories', () => {
      const validCategories = ['Navigation', 'Agent Features', 'Integrations']
      FEATURE_METADATA.forEach(meta => {
        expect(validCategories).toContain(meta.category)
      })
    })

    it('should have non-empty names and descriptions', () => {
      FEATURE_METADATA.forEach(meta => {
        expect(meta.name.length).toBeGreaterThan(0)
        expect(meta.description.length).toBeGreaterThan(0)
      })
    })
  })
})
