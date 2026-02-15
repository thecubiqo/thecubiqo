# CubiQo Style Guide — Apple-Grade Premium

> **File:** `docs/STYLE_GUIDE.md`
>
> This is the authoritative global style specification for **cubiqo.ai**.
> Every existing and future page, component, and interaction must conform to
> the standards defined here. The visual language is modelled directly after
> **apple.com**: SF Pro typography, generous white-space, continuous-corner
> radii, frosted-glass materials, layered depth via shadow, spring-based
> motion, and relentless optical precision.

---

## 1. Design Tokens

All visual decisions are centralised in **`src/config/design-tokens.ts`**.
CSS custom-property equivalents are force-applied globally via
**`src/app/globals.css`** — every page inherits these values automatically.

### 1.1 Typography (Apple HIG)

CubiQo uses the **SF Pro** stack as its primary typeface. On non-Apple
devices, the system falls through to **Inter** (the closest open-source
match) and then to OS-native system-ui.

| Token | Value | Usage |
|-------|-------|-------|
| `fonts.sans` | SF Pro Display / SF Pro Text, Inter, system-ui… | Body, headings, labels |
| `fonts.mono` | SF Mono, Fira Code, Cascadia Code… | Code panels, data |
| `fonts.display` | SF Pro Display, Inter… | Hero / landing headlines |

**Type scale (rem):**

| Token | Size | px | Usage |
|-------|------|----|-------|
| `2xs` | 0.6875 | 11 | Fine-print, captions |
| `xs` | 0.75 | 12 | Badges, meta |
| `sm` | 0.8125 | 13 | Secondary UI text |
| `base` | 0.875 | 14 | Default body |
| `md` | 1 | 16 | Inputs, emphasized body |
| `lg` | 1.125 | 18 | Subheadings |
| `xl` | 1.25 | 20 | Section titles |
| `2xl` | 1.5 | 24 | Page titles |
| `3xl` | 2 | 32 | Hero headings |
| `4xl` | 2.5 | 40 | Display |

**Font weights:** light (300), normal (400), medium (500), semibold (600), bold (700).

**Letter-spacing:** Headlines use `-0.02em` to `-0.01em` (tight). Body text
uses `-0.01em` (Apple standard). Uppercase labels use `+0.1em` (widest).

### 1.2 Spacing (4 px Grid)

Every margin, padding, and gap must fall on the 4 px grid:
`0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.

### 1.3 Border Radius (Continuous Corners)

Apple uses smooth "squircle" corners. Our CSS values approximate the same
optical feel:

| Token | Value | px | Usage |
|-------|-------|----|-------|
| `xs` | 0.1875rem | 3 | Tiny inline chips |
| `sm` | 0.375rem | 6 | Small badges |
| `md` | 0.625rem | 10 | Buttons, inputs |
| `lg` | 0.875rem | 14 | Cards, panels |
| `xl` | 1.125rem | 18 | Modals, sheets |
| `2xl` | 1.5rem | 24 | Hero cards, overlays |
| `full` | 9999px | — | Pills, toggles, avatars |

### 1.4 Shadows & Glass (Apple-Style Depth)

| Token | Usage |
|-------|-------|
| `sm` | Resting card — barely perceptible lift |
| `md` | Hovered card, default panel |
| `lg` | Raised modal, popover |
| `xl` | Top-level modal, sheet |
| `innerGlow` | Subtle inner highlight on dark glass |
| `glow` | Orange brand accent for focus states |
| `glassRim` | 0.5 px inset white line — Apple glass edge |

### 1.5 Backdrop Blur (Glass Material)

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8 px | Light overlays |
| `md` | 20 px | Nav bars, standard sheets |
| `lg` | 40 px | Modals, heavy glass |
| `xl` | 64 px | Hero / landing overlays |

### 1.6 Motion & Easing (Apple-Style Spring)

All interactive elements use the `.transition-premium` utility class or the
individual CSS custom properties below.

| Token | Duration | Usage |
|-------|----------|-------|
| `fast` | 100 ms | Instant feedback (press, active) |
| `normal` | 200 ms | Hover, toggle, colour change |
| `slow` | 350 ms | Panel slide, expand/collapse |
| `slower` | 500 ms | Sheet appear, page-level |
| `slowest` | 700 ms | Dramatic reveals |

**Easing curves:**

| Curve | Description |
|-------|-------------|
| `easeOut` | Default interactive — fast start, smooth landing |
| `easeInOut` | Symmetrical transitions |
| `spring` | Apple spring — playful micro-interactions |
| `decelerate` | Content appearing on screen |

**Reduced motion:** All animations and transitions are suppressed when
`prefers-reduced-motion: reduce` is active (enforced in `globals.css`).

### 1.7 Z-Index Layers

| Layer | Value |
|-------|-------|
| Base | 0 |
| Dropdown | 10 |
| Sticky | 20 |
| Overlay | 30 |
| Modal | 40 |
| Popover | 50 |
| Toast | 60 |

---

## 2. Colour System

CubiQo's palette is defined in **`src/config/colors.ts`**.

| Colour | Hex | Meaning |
|--------|-----|---------|
| Red (Tamas) | `#C2185B` | Desire, indulgence |
| Yellow (Rajas) | `#FFA000` | Activity, energy |
| Green-Blue (Sattva) | `#00897B` | Growth, wellness |
| Orange (Fourth Way) | `#FF6F00` | Awareness, reflection |

**Brand accent:** Orange `#FF6F00` — CTAs, focus rings, active states,
selection highlight.

**Neutral scale (dark):** Background `#000000`, foreground `#f5f5f7`,
muted `#86868b` — matches apple.com dark-mode tones.

**Neutral scale (light):** Background `#ffffff`, foreground `#1d1d1f`,
muted `#86868b`.

---

## 3. Global Utility Classes

These classes are defined in `globals.css` and available everywhere:

| Class | Effect |
|-------|--------|
| `.premium-card` | Apple-style elevated card (radius-lg, shadow-md, hover → shadow-lg) |
| `.transition-premium` | Smooth 200 ms state transition (colour, bg, shadow, opacity, transform) |
| `.glass` | Frosted-glass surface (20 px blur, 1.4 saturation, glass-rim shadow) |
| `.glass-heavy` | Heavier glass for modals (40 px blur, 1.5 saturation) |
| `.text-premium-muted` | Apple secondary text colour |
| `.text-premium-accent` | CubiQo orange accent |
| `.scrollbar-hide` | Hides scrollbar (Webkit + Firefox) |

---

## 4. Component Patterns

### 4.1 Cards & Panels

- Always apply `.premium-card` or use the design-token shadows directly.
- Dark mode: surface colour from `--surface-elevated` (`#1c1c1e`).
- Light mode: `#ffffff` with `--shadow-md`.

### 4.2 Buttons

- **Primary:** `bg-orange-500 text-white hover:bg-orange-600 rounded-[10px] transition-premium`
- **Secondary:** `bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-[10px] transition-premium`
- Always include `.transition-premium`.
- Minimum touch target: 44 × 44 px.

### 4.3 Toggles / Switches

- `role="switch"` + `aria-checked` for accessibility.
- Active track: `bg-orange-500`; inactive: `bg-zinc-300 dark:bg-zinc-700`.
- Thumb transition uses `.transition-premium`.

### 4.4 Inputs, Textareas & Sliders

- Global premium slider thumb styling is already applied via `globals.css`.
- Focus state: relies on global `:focus-visible` ring.
- Accent colour: `accent-orange-500`.

### 4.5 Modals & Sheets

- Background overlay: `bg-black/60` + `backdrop-blur-[20px]`.
- Sheet container: `.glass-heavy` + `--shadow-xl` + `--radius-2xl`.
- Slide-in animation: 350 ms `ease-spring`.

### 4.6 Navigation & Headers

- Header bar: `.glass` + fixed + `z-50`.
- Text: SF Pro semibold, `text-2xl`, tight tracking.

---

## 5. Accessibility

### 5.1 Focus Styles

All interactive elements receive a visible orange focus ring via the global
`:focus-visible` rule. **Never** suppress focus outlines without providing an
equivalent.

### 5.2 ARIA Attributes

| Pattern | Required ARIA |
|---------|---------------|
| Collapsible | `aria-expanded`, `aria-controls` on trigger; `id` on panel |
| Toggle | `role="switch"`, `aria-checked` |
| Icon-only button | `aria-label` with descriptive text |
| Decorative SVG | `aria-hidden="true"` |

### 5.3 Reduced Motion

`prefers-reduced-motion: reduce` disables all CSS animations and transitions
globally.

### 5.4 Colour Contrast

- Body on dark: `#f5f5f7` on `#000000` → 21:1 ✓
- Body on light: `#1d1d1f` on `#ffffff` → 16.75:1 ✓
- Muted: `#86868b` on `#000000` → 4.56:1 (AA normal ✓)
- All new pairings must meet WCAG 2.1 AA (4.5:1 for normal text).

### 5.5 Touch Targets

Minimum interactive size: 44 × 44 px (Apple HIG standard).

---

## 6. Cross-Browser Testing

Run the visual smoke-test script to verify rendering:

```bash
npx tsx scripts/visual-smoke-test.ts
```

The script validates:
1. Design tokens export the expected shape (including `blur`).
2. CSS custom properties are defined and resolve correctly.
3. Premium utility classes (`.premium-card`, `.transition-premium`, `.glass`)
   exist in the compiled CSS.
4. Focus-visible, reduced-motion, and premium scrollbar rules are present.
5. Apple-style slider thumb styling is applied cross-browser.
6. Component files consume the design system consistently.

---

## 7. File Map

| File | Purpose |
|------|---------|
| `src/config/design-tokens.ts` | JS/TS design token definitions (Apple-grade) |
| `src/config/colors.ts` | Colour system with RGY intent mapping |
| `src/app/globals.css` | **The** global CSS — applied to every page, every component |
| `src/app/layout.tsx` | Root layout — enforces font stack and `antialiased` |
| `docs/STYLE_GUIDE.md` | **This document** — the authoritative style authority |
| `scripts/visual-smoke-test.ts` | Automated visual consistency checks |

---

## 8. Enforcement

- **globals.css** is imported by the root layout and applies to **every**
  page on cubiqo.ai — existing and future. No page can opt out.
- All new components **must** use the design tokens and utility classes
  documented here.
- PRs that introduce hard-coded colours, shadows, radii, or font stacks
  outside the token system should be flagged in code review.
