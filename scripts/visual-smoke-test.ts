/**
 * Visual Smoke Test
 *
 * Validates that the CubiQo design system is correctly wired up:
 *  1. Design tokens export the expected shape.
 *  2. CSS custom properties are defined in globals.css.
 *  3. Premium utility classes exist.
 *  4. Accessibility rules (focus-visible, reduced-motion) are present.
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
assert(typeof designTokens.motion.fast === 'string', 'motion.fast is a string')
assert(typeof designTokens.shadows.glow === 'string', 'shadows.glow is a string')

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
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--shadow-glow',
  '--duration-fast',
  '--duration-normal',
  '--ease-out',
  '--focus-ring',
]

for (const v of expectedVars) {
  assert(css.includes(v), `${v} is defined`)
}

// ── 3. Premium Utility Classes ──────────────────────────────────────

console.log('\n🔷  Premium Utility Classes')

assert(css.includes('.premium-card'), '.premium-card class exists')
assert(css.includes('.transition-premium'), '.transition-premium class exists')

// ── 4. Accessibility Rules ──────────────────────────────────────────

console.log('\n🔷  Accessibility')

assert(css.includes(':focus-visible'), ':focus-visible rule exists')
assert(css.includes('prefers-reduced-motion'), 'prefers-reduced-motion rule exists')

// ── 5. Component Token Usage ────────────────────────────────────────

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

// ── Summary ─────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(48)}`)
console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`)
console.log('─'.repeat(48))

if (failed > 0) {
  process.exit(1)
}
