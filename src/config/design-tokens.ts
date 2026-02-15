/**
 * CubiQo Design Tokens — Apple-Grade Premium
 *
 * Authoritative, centralised source of truth for the CubiQo visual language.
 * Modelled after Apple Human Interface Guidelines: SF Pro typography, generous
 * white-space, continuous corner radii, layered depth via glass and shadow,
 * spring-based motion, and relentless optical precision.
 *
 * Import individual groups where needed; `designTokens` aggregates everything
 * for tooling / documentation generators.
 */

/* ------------------------------------------------------------------ */
/*  Typography (Apple HIG)                                            */
/* ------------------------------------------------------------------ */

export const fonts = {
  /**
   * Primary UI font — SF Pro first (Apple native), then Inter (closest
   * cross-platform match), followed by system-ui for every other OS.
   */
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  /** Mono — SF Mono first for Apple devices, then popular alternatives. */
  mono: '"SF Mono", ui-monospace, "Fira Code", "Cascadia Code", "Roboto Mono", Menlo, Consolas, monospace',
  /** Display — used for hero / landing headlines only. */
  display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const

export const fontSizes = {
  '2xs': '0.6875rem', // 11 px  — fine-print / captions
  xs: '0.75rem',      // 12 px  — badges, meta
  sm: '0.8125rem',    // 13 px  — secondary UI text
  base: '0.875rem',   // 14 px  — default body
  md: '1rem',         // 16 px  — inputs, emphasized body
  lg: '1.125rem',     // 18 px  — subheadings
  xl: '1.25rem',      // 20 px  — section titles
  '2xl': '1.5rem',    // 24 px  — page titles
  '3xl': '2rem',      // 32 px  — hero headings
  '4xl': '2.5rem',    // 40 px  — display
} as const

export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const lineHeights = {
  none: 1,
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.625,
} as const

export const letterSpacing = {
  tighter: '-0.02em',
  tight: '-0.01em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const

/* ------------------------------------------------------------------ */
/*  Spacing (4 px grid — Apple-standard)                              */
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
  20: '5rem',      // 80 px
  24: '6rem',      // 96 px
} as const

/* ------------------------------------------------------------------ */
/*  Border Radius (Apple continuous-corner feel)                      */
/* ------------------------------------------------------------------ */

export const radii = {
  none: '0',
  xs: '0.1875rem',  // 3 px   — tiny inline chips
  sm: '0.375rem',    // 6 px   — small badges
  md: '0.625rem',    // 10 px  — buttons, inputs
  lg: '0.875rem',    // 14 px  — cards, panels
  xl: '1.125rem',    // 18 px  — modals, sheets
  '2xl': '1.5rem',   // 24 px  — hero cards, overlays
  full: '9999px',    // pills, toggles, avatars
} as const

/* ------------------------------------------------------------------ */
/*  Shadows & Glass (Apple-style depth & material)                    */
/* ------------------------------------------------------------------ */

export const shadows = {
  /** Subtle inner highlight on dark-mode glass cards */
  innerGlow: 'inset 0 0.5px 0 0 rgba(255,255,255,0.06)',
  /** Resting card — barely visible lift */
  sm: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)',
  /** Default card / hovered state */
  md: '0 4px 12px -2px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.04)',
  /** Raised panels, popovers */
  lg: '0 12px 32px -4px rgba(0,0,0,0.15), 0 4px 8px -2px rgba(0,0,0,0.06)',
  /** Top-level modals & sheets */
  xl: '0 24px 64px -8px rgba(0,0,0,0.22), 0 8px 20px -4px rgba(0,0,0,0.1)',
  /** Premium orange glow for brand focus / accent */
  glow: '0 0 0 3px rgba(255,111,0,0.35)',
  /** Glass inner border (simulates Apple glass rim) */
  glassRim: 'inset 0 0 0 0.5px rgba(255,255,255,0.08)',
} as const

/* ------------------------------------------------------------------ */
/*  Motion / Easing  (Apple-style spring & ease)                      */
/* ------------------------------------------------------------------ */

export const motion = {
  /** Instant feedback — active / press */
  fast: '100ms',
  /** Standard interactive — hover, toggle */
  normal: '200ms',
  /** Panel slide, expand / collapse */
  slow: '350ms',
  /** Page-level transitions, sheet appear */
  slower: '500ms',
  /** Dramatic reveals (landing cube etc.) */
  slowest: '700ms',

  /* Apple-style ease curves */
  /** Default interactive ease — fast start, smooth land */
  easeOut: 'cubic-bezier(0.25, 1, 0.5, 1)',
  /** Symmetrical transitions */
  easeInOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
  /** Apple spring — playful micro-interactions */
  spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Decelerate — content appearing on screen */
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
} as const

/* ------------------------------------------------------------------ */
/*  Backdrop Blur (Apple glass material)                              */
/* ------------------------------------------------------------------ */

export const blur = {
  /** Subtle hint (overlays) */
  sm: '8px',
  /** Standard glass (navigation bars, sheets) */
  md: '20px',
  /** Heavy glass (modal backgrounds) */
  lg: '40px',
  /** Ultra — landing / hero overlays */
  xl: '64px',
} as const

/* ------------------------------------------------------------------ */
/*  Z-Index layers                                                    */
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
  disabled: 0.38,
  muted: 0.55,
  secondary: 0.7,
  subtle: 0.85,
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
  blur,
  zIndex,
  opacity,
  focusRing,
} as const
