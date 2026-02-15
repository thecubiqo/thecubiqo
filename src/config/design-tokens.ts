/**
 * CubiQo Design Tokens
 *
 * Centralised source of truth for the visual language used across the app.
 * Import individual tokens where needed; the full set is also available as
 * `designTokens` for tooling / documentation generators.
 */

/* ------------------------------------------------------------------ */
/*  Typography                                                        */
/* ------------------------------------------------------------------ */

export const fonts = {
  /** Primary UI font stack – system fonts for speed, Inter for polish */
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  /** Mono font stack – code panels & data */
  mono: '"SF Mono", "Fira Code", "Cascadia Code", "Roboto Mono", ui-monospace, Consolas, monospace',
} as const

export const fontSizes = {
  xs: '0.75rem',   // 12 px
  sm: '0.8125rem', // 13 px
  base: '0.875rem', // 14 px
  md: '1rem',      // 16 px
  lg: '1.125rem',  // 18 px
  xl: '1.25rem',   // 20 px
  '2xl': '1.5rem', // 24 px
  '3xl': '2rem',   // 32 px
} as const

export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const

export const letterSpacing = {
  tight: '-0.01em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
} as const

/* ------------------------------------------------------------------ */
/*  Spacing (4 px grid)                                               */
/* ------------------------------------------------------------------ */

export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2 px
  1: '0.25rem',    // 4 px
  1.5: '0.375rem', // 6 px
  2: '0.5rem',     // 8 px
  3: '0.75rem',    // 12 px
  4: '1rem',       // 16 px
  5: '1.25rem',    // 20 px
  6: '1.5rem',     // 24 px
  8: '2rem',       // 32 px
  10: '2.5rem',    // 40 px
  12: '3rem',      // 48 px
  16: '4rem',      // 64 px
} as const

/* ------------------------------------------------------------------ */
/*  Border Radius                                                     */
/* ------------------------------------------------------------------ */

export const radii = {
  none: '0',
  sm: '0.25rem',   // 4 px
  md: '0.5rem',    // 8 px
  lg: '0.75rem',   // 12 px
  xl: '1rem',      // 16 px
  '2xl': '1.25rem', // 20 px
  full: '9999px',
} as const

/* ------------------------------------------------------------------ */
/*  Shadows (premium glass / elevation)                               */
/* ------------------------------------------------------------------ */

export const shadows = {
  /** Subtle inset glow for cards on dark bg */
  innerGlow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
  /** Light elevation for cards */
  sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
  /** Default card elevation */
  md: '0 2px 8px -2px rgba(0,0,0,0.12), 0 1px 2px -1px rgba(0,0,0,0.06)',
  /** Raised panels / modals */
  lg: '0 8px 24px -4px rgba(0,0,0,0.16), 0 2px 6px -2px rgba(0,0,0,0.08)',
  /** Tooltips & popovers */
  xl: '0 16px 48px -8px rgba(0,0,0,0.24), 0 4px 12px -4px rgba(0,0,0,0.12)',
  /** Premium orange glow for focus / brand accent */
  glow: '0 0 0 3px rgba(255,111,0,0.35)',
} as const

/* ------------------------------------------------------------------ */
/*  Motion / Easing                                                   */
/* ------------------------------------------------------------------ */

export const motion = {
  /** Standard interactive feedback */
  fast: '120ms',
  /** Hover / press */
  normal: '200ms',
  /** Panels sliding in */
  slow: '320ms',
  /** Page‑level transitions */
  slower: '500ms',

  /** Ease curves */
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

/* ------------------------------------------------------------------ */
/*  Z‑Index layers                                                    */
/* ------------------------------------------------------------------ */

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  toast: 60,
} as const

/* ------------------------------------------------------------------ */
/*  Opacity                                                           */
/* ------------------------------------------------------------------ */

export const opacity = {
  disabled: 0.4,
  muted: 0.6,
  subtle: 0.8,
  full: 1,
} as const

/* ------------------------------------------------------------------ */
/*  Focus ring (accessibility)                                        */
/* ------------------------------------------------------------------ */

export const focusRing = {
  width: '2px',
  offset: '2px',
  color: 'rgba(255,111,0,0.7)',
} as const

/* ------------------------------------------------------------------ */
/*  Aggregate export                                                  */
/* ------------------------------------------------------------------ */

export const designTokens = {
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  spacing,
  radii,
  shadows,
  motion,
  zIndex,
  opacity,
  focusRing,
} as const
