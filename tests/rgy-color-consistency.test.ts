/**
 * RGY Color Consistency Tests
 * 
 * Verifies that all RGY components use the canonical color system
 * defined in src/config/colors.ts:
 *   Red (Tamas):      #c2185b
 *   Yellow (Rajas):    #ffa000
 *   Green (Sattva):    #00897b
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// Canonical RGY colors from src/config/colors.ts
const CANONICAL = {
  RED: { hex: '#c2185b', rgb: '194, 24, 91' },
  YELLOW: { hex: '#ffa000', rgb: '255, 160, 0' },
  GREEN: { hex: '#00897b', rgb: '0, 137, 123' },
}

// Non-canonical Tailwind colors that should NOT appear in RGY components
const WRONG_COLORS = ['#ef4444', '#eab308', '#22c55e']

const RGY_FILES = [
  'src/components/RGYChatsModal.tsx',
  'src/components/RGYChatGateway.tsx',
  'src/components/KeywordPanel.tsx',
]

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8')
}

describe('RGY Color Consistency', () => {
  describe('No non-canonical colors in RGY components', () => {
    RGY_FILES.forEach(file => {
      it(`${file} should not contain non-canonical Tailwind colors`, () => {
        const content = readFile(file)
        for (const color of WRONG_COLORS) {
          expect(content).not.toContain(color)
        }
      })
    })
  })

  describe('Canonical colors are present', () => {
    it('RGYChatsModal uses canonical red (#c2185b)', () => {
      const content = readFile('src/components/RGYChatsModal.tsx')
      expect(content).toContain(CANONICAL.RED.hex)
    })

    it('RGYChatsModal uses canonical yellow (#ffa000)', () => {
      const content = readFile('src/components/RGYChatsModal.tsx')
      expect(content).toContain(CANONICAL.YELLOW.hex)
    })

    it('RGYChatsModal uses canonical green (#00897b)', () => {
      const content = readFile('src/components/RGYChatsModal.tsx')
      expect(content).toContain(CANONICAL.GREEN.hex)
    })

    it('RGYChatGateway uses canonical red (#c2185b)', () => {
      const content = readFile('src/components/RGYChatGateway.tsx')
      expect(content).toContain(CANONICAL.RED.hex)
    })

    it('RGYChatGateway uses canonical yellow (#ffa000)', () => {
      const content = readFile('src/components/RGYChatGateway.tsx')
      expect(content).toContain(CANONICAL.YELLOW.hex)
    })

    it('RGYChatGateway uses canonical green (#00897b)', () => {
      const content = readFile('src/components/RGYChatGateway.tsx')
      expect(content).toContain(CANONICAL.GREEN.hex)
    })

    it('KeywordPanel uses canonical red (#c2185b)', () => {
      const content = readFile('src/components/KeywordPanel.tsx')
      expect(content).toContain(CANONICAL.RED.hex)
    })

    it('KeywordPanel uses canonical yellow (#ffa000)', () => {
      const content = readFile('src/components/KeywordPanel.tsx')
      expect(content).toContain(CANONICAL.YELLOW.hex)
    })

    it('KeywordPanel uses canonical green (#00897b)', () => {
      const content = readFile('src/components/KeywordPanel.tsx')
      expect(content).toContain(CANONICAL.GREEN.hex)
    })
  })

  describe('Color system definition', () => {
    it('colors.ts defines RED as 0xc2185b', () => {
      const content = readFile('src/config/colors.ts')
      expect(content).toContain('hex: 0xc2185b')
    })

    it('colors.ts defines YELLOW as 0xffa000', () => {
      const content = readFile('src/config/colors.ts')
      expect(content).toContain('hex: 0xffa000')
    })

    it('colors.ts defines GREEN_BLUE as 0x00897b', () => {
      const content = readFile('src/config/colors.ts')
      expect(content).toContain('hex: 0x00897b')
    })
  })

  describe('RGY dot order consistency (R, Y, G top-to-bottom)', () => {
    it('RGYSignalButton renders dots in R, Y, G order', () => {
      const content = readFile('src/components/RGYChatsModal.tsx')
      const redDotIndex = content.indexOf('/* Red dot */')
      const yellowDotIndex = content.indexOf('/* Yellow dot */')
      const greenDotIndex = content.indexOf('/* Green dot */')
      
      expect(redDotIndex).toBeGreaterThan(-1)
      expect(yellowDotIndex).toBeGreaterThan(-1)
      expect(greenDotIndex).toBeGreaterThan(-1)
      expect(redDotIndex).toBeLessThan(yellowDotIndex)
      expect(yellowDotIndex).toBeLessThan(greenDotIndex)
    })

    it('RGYChatGatewayButton renders dots in R, Y, G order', () => {
      const content = readFile('src/components/RGYChatGateway.tsx')
      const redDotIndex = content.indexOf('/* Red dot */')
      const yellowDotIndex = content.indexOf('/* Yellow dot */')
      const greenDotIndex = content.indexOf('/* Green dot */')
      
      expect(redDotIndex).toBeGreaterThan(-1)
      expect(yellowDotIndex).toBeGreaterThan(-1)
      expect(greenDotIndex).toBeGreaterThan(-1)
      expect(redDotIndex).toBeLessThan(yellowDotIndex)
      expect(yellowDotIndex).toBeLessThan(greenDotIndex)
    })
  })
})
