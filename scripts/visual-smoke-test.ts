/**
 * Visual Smoke Test — Apple-Grade Premium
 *
 * Validates that the CubiQo design system is correctly wired up:
 *  1. Design tokens export the expected shape (including blur).
 *  2. CSS custom properties are defined in globals.css.
 *  3. Premium + glass utility classes exist.
 *  4. Accessibility rules (focus-visible, reduced-motion) are present.
 *  5. Apple-style global resets (font-smoothing, selection, scrollbar) present.
 *  6. Cross-browser slider thumb styling.
 *  7. Component files consume the design system.
 *
 * Run:  npx tsx scripts/visual-smoke-test.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { designTokens } from '../src/config/design-tokens'

// ── Helpers ──────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++
    console.log(`  ✅  ${label}`)
  } else {
    failed++
    console.error(`  ❌  ${label}`)
  }
}

// ── 1. Design Tokens Shape ──────────────────────────────────────────

console.log('\n🔷  Design Tokens')

const expectedGroups = [
  'fonts',
  'fontSizes',
  'fontWeights',
  'lineHeights',
  'letterSpacing',
  'spacing',
  'radii',
  'shadows',
  'motion',
  'blur',
  'zIndex',
  'opacity',
  'focusRing',
]

for (const group of expectedGroups) {
  assert(
    group in designTokens && typeof (designTokens as Record<string, unknown>)[group] === 'object',
    `designTokens.${group} exists and is an object`
  )
}

assert(typeof designTokens.fonts.sans === 'string', 'fonts.sans is a string')
assert(typeof designTokens.fonts.mono === 'string', 'fonts.mono is a string')
assert(typeof designTokens.fonts.display === 'string', 'fonts.display is a string')
assert(typeof designTokens.motion.fast === 'string', 'motion.fast is a string')
assert(typeof designTokens.shadows.glow === 'string', 'shadows.glow is a string')
assert(typeof designTokens.shadows.glassRim === 'string', 'shadows.glassRim (Apple glass rim) is a string')
assert(typeof designTokens.blur.md === 'string', 'blur.md (Apple glass material) is a string')

// Apple HIG: SF Pro must be first in the stack
assert(designTokens.fonts.sans.includes('SF Pro'), 'fonts.sans includes SF Pro (Apple HIG)')
assert(designTokens.fonts.mono.includes('SF Mono'), 'fonts.mono includes SF Mono (Apple HIG)')

// ── 2. CSS Custom Properties ────────────────────────────────────────

console.log('\n🔷  CSS Custom Properties (globals.css)')

const cssPath = path.resolve(__dirname, '..', 'src', 'app', 'globals.css')
const css = fs.readFileSync(cssPath, 'utf-8')

const expectedVars = [
  '--font-sans',
  '--font-mono',
  '--space-1',
  '--space-4',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--shadow-xl',
  '--shadow-glow',
  '--shadow-glass-rim',
  '--duration-fast',
  '--duration-normal',
  '--duration-slow',
  '--ease-out',
  '--ease-spring',
  '--ease-decelerate',
  '--blur-sm',
  '--blur-md',
  '--blur-lg',
  '--focus-ring',
  '--muted',
  '--accent',
  '--surface',
]

for (const v of expectedVars) {
  assert(css.includes(v), `${v} is defined`)
}

// ── 3. Premium + Glass Utility Classes ──────────────────────────────

console.log('\n🔷  Premium Utility Classes')

assert(css.includes('.premium-card'), '.premium-card class exists')
assert(css.includes('.transition-premium'), '.transition-premium class exists')
assert(css.includes('.glass'), '.glass class exists')
assert(css.includes('.glass-heavy'), '.glass-heavy class exists')
assert(css.includes('.text-premium-muted'), '.text-premium-muted class exists')
assert(css.includes('.text-premium-accent'), '.text-premium-accent class exists')
assert(css.includes('.scrollbar-hide'), '.scrollbar-hide class exists')

// ── 4. Accessibility Rules ──────────────────────────────────────────

console.log('\n🔷  Accessibility')

assert(css.includes(':focus-visible'), ':focus-visible rule exists')
assert(css.includes('prefers-reduced-motion'), 'prefers-reduced-motion rule exists')

// ── 5. Apple-Style Global Resets ────────────────────────────────────

console.log('\n🔷  Apple-Style Global Resets')

assert(css.includes('-webkit-font-smoothing'), 'Webkit font smoothing applied')
assert(css.includes('-moz-osx-font-smoothing'), 'Firefox font smoothing applied')
assert(css.includes('text-rendering'), 'text-rendering optimizeLegibility applied')
assert(css.includes('::selection'), 'Premium text selection highlight')
assert(css.includes('::-webkit-scrollbar'), 'Premium scrollbar styling (Webkit)')
assert(css.includes('scrollbar-width'), 'Premium scrollbar styling (Firefox)')

// ── 6. Cross-Browser Slider Thumb ───────────────────────────────────

console.log('\n🔷  Cross-Browser Slider')

assert(css.includes('::-webkit-slider-thumb'), 'Webkit slider thumb styled')
assert(css.includes('::-moz-range-thumb'), 'Firefox slider thumb styled')
assert(css.includes('::-webkit-slider-runnable-track'), 'Webkit slider track styled')
assert(css.includes('::-moz-range-track'), 'Firefox slider track styled')

// ── 7. Component Token Usage ────────────────────────────────────────

console.log('\n🔷  Component Token Usage')

const cubeControlsPath = path.resolve(
  __dirname,
  '..',
  'src',
  'components',
  'CubeControls.tsx'
)
const cubeControls = fs.readFileSync(cubeControlsPath, 'utf-8')

assert(cubeControls.includes('premium-card'), 'CubeControls uses premium-card')
assert(cubeControls.includes('transition-premium'), 'CubeControls uses transition-premium')
assert(cubeControls.includes('aria-expanded'), 'CubeControls has aria-expanded')
assert(cubeControls.includes('role="switch"'), 'CubeControls toggle has role="switch"')
assert(cubeControls.includes('aria-checked'), 'CubeControls toggle has aria-checked')

const poweredByPath = path.resolve(
  __dirname,
  '..',
  'src',
  'components',
  'PoweredByLogos.tsx'
)
const poweredBy = fs.readFileSync(poweredByPath, 'utf-8')

assert(poweredBy.includes('transition-premium'), 'PoweredByLogos uses transition-premium')
assert(poweredBy.includes('aria-hidden'), 'PoweredByLogos decorative SVGs have aria-hidden')

// ── 8. Layout Enforcement ───────────────────────────────────────────

console.log('\n🔷  Layout Enforcement')

const layoutPath = path.resolve(__dirname, '..', 'src', 'app', 'layout.tsx')
const layout = fs.readFileSync(layoutPath, 'utf-8')

assert(layout.includes('antialiased'), 'Root layout applies antialiased')
assert(layout.includes('globals.css'), 'Root layout imports globals.css')

// Apple-grade: dark mode uses pure black
assert(css.includes('#000000'), 'Dark mode background is pure black (OLED-friendly, Apple-style)')
assert(css.includes('#f5f5f7'), 'Dark mode foreground matches Apple light-on-dark tone')
assert(css.includes('#1d1d1f'), 'Light mode foreground matches Apple dark-on-light tone')

// ── Summary ─────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(52)}`)
console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`)
console.log('─'.repeat(52))

if (failed > 0) {
  process.exit(1)
}
