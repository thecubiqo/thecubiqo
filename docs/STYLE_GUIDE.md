# CubiQo Style Guide

> Premium visual language for the CubiQo AI assistant.

---

## 1. Design Tokens

All visual decisions are centralised in **`src/config/design-tokens.ts`**.
Import individual token groups (e.g. `fonts`, `spacing`, `shadows`) rather than
hard‑coding values. CSS custom‑property equivalents live in
**`src/app/globals.css`** under `:root`.

### 1.1 Typography

| Token | Value | Usage |
|-------|-------|-------|
| `fonts.sans` | Inter, system-ui, … | Body text, headings, UI labels |
| `fonts.mono` | SF Mono, Fira Code, … | Code panels, data readouts |
| `fontSizes.xs` | 0.75 rem (12 px) | Badges, captions |
| `fontSizes.sm` | 0.8125 rem (13 px) | Secondary text |
| `fontSizes.base` | 0.875 rem (14 px) | Default body |
| `fontSizes.md` | 1 rem (16 px) | Inputs, prominent body |
| `fontSizes.lg–3xl` | 1.125–2 rem | Headings |

### 1.2 Spacing (4 px grid)

Use `spacing.*` tokens from the design system. Every margin, padding, and gap
should fall on the 4 px grid: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

### 1.3 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radii.sm` | 4 px | Small chips, inline badges |
| `radii.md` | 8 px | Buttons, inputs |
| `radii.lg` | 12 px | Cards, panels |
| `radii.xl` | 16 px | Modals, overlays |
| `radii.full` | 9999 px | Avatars, toggles |

### 1.4 Shadows & Elevation

| Token | Usage |
|-------|-------|
| `shadows.sm` | Resting card |
| `shadows.md` | Hovered card, default panel |
| `shadows.lg` | Raised modal / popover |
| `shadows.xl` | Tooltips, top‑level overlays |
| `shadows.innerGlow` | Subtle inset highlight on dark cards |
| `shadows.glow` | Orange brand glow for focus states |

### 1.5 Motion & Easing

All interactive elements use `transition-premium` (defined in `globals.css`) or
the individual tokens below:

| Token | Duration | Usage |
|-------|----------|-------|
| `motion.fast` | 120 ms | Active/press feedback |
| `motion.normal` | 200 ms | Hover, toggle, colour change |
| `motion.slow` | 320 ms | Panel slide, expand/collapse |
| `motion.slower` | 500 ms | Page‑level transitions |

Easing curves:

- `motion.easeOut` — default interactive curve
- `motion.easeInOut` — symmetrical transitions
- `motion.spring` — playful micro‑interactions

**Reduced motion:** All animations and transitions are suppressed when
`prefers-reduced-motion: reduce` is active (handled in `globals.css`).

### 1.6 Z‑Index Layers

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

CubiQo's colour palette is defined in **`src/config/colors.ts`**. The four
intent colours map to philosophical dimensions:

| Colour | Hex | Meaning |
|--------|-----|---------|
| Red (Tamas) | `#C2185B` | Desire, indulgence |
| Yellow (Rajas) | `#FFA000` | Activity, energy |
| Green‑Blue (Sattva) | `#00897B` | Growth, wellness |
| Orange (Fourth Way) | `#FF6F00` | Awareness, reflection |

**Brand accent:** Orange `#FF6F00` is the primary brand colour used for focus
rings, CTAs, and active states.

---

## 3. Component Patterns

### 3.1 Cards & Panels

- Use `premium-card` utility class (rounded-lg + shadow-md + hover elevation).
- Dark mode: `bg-zinc-900`, border `border-zinc-800`.
- Light mode: `bg-white`, border `border-zinc-200`.

### 3.2 Buttons

- Primary: `bg-orange-500 text-white hover:bg-orange-600 transition-premium rounded-md`
- Secondary: `bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-premium rounded-md`
- Always include `transition-premium` for smooth state changes.

### 3.3 Toggles / Switches

- Use `role="switch"` and `aria-checked` for accessibility.
- Active track: `bg-orange-500`; inactive: `bg-zinc-300 dark:bg-zinc-700`.
- Thumb transition: `transition-premium`.

### 3.4 Inputs & Sliders

- Accent colour: `accent-orange-500`.
- Focus state: relies on global `:focus-visible` ring (orange glow).

---

## 4. Accessibility

### 4.1 Focus Styles

All interactive elements receive a visible orange focus ring via the global
`:focus-visible` rule in `globals.css`. Never suppress focus outlines without
providing an equivalent.

### 4.2 ARIA Attributes

| Pattern | Required ARIA |
|---------|---------------|
| Collapsible panel | `aria-expanded`, `aria-controls` on trigger; `id` on panel |
| Toggle switch | `role="switch"`, `aria-checked` |
| Icon‑only button | `aria-label` with descriptive text |
| Decorative SVG | `aria-hidden="true"` |

### 4.3 Reduced Motion

The `prefers-reduced-motion: reduce` media query in `globals.css` disables
all CSS animations and transitions for users who request it.

### 4.4 Colour Contrast

- Body text on dark: `#ededed` on `#0a0a0a` → 18.1:1 ✓
- Body text on light: `#171717` on `#ffffff` → 17.7:1 ✓
- Ensure any new colour pairing meets WCAG 2.1 AA (4.5:1 for normal text).

---

## 5. Cross‑Browser Testing

Run the visual smoke test script to verify rendering:

```bash
npx tsx scripts/visual-smoke-test.ts
```

The script checks:
1. CSS custom properties are defined and resolve correctly.
2. Premium utility classes (`.premium-card`, `.transition-premium`) exist.
3. Focus‑visible and reduced‑motion rules are present.
4. Design tokens export the expected shape.

---

## 6. File Map

| File | Purpose |
|------|---------|
| `src/config/design-tokens.ts` | JS/TS design token definitions |
| `src/config/colors.ts` | Colour system with intent mapping |
| `src/app/globals.css` | CSS custom properties & utility classes |
| `src/app/layout.tsx` | Root layout with font stacks |
| `docs/STYLE_GUIDE.md` | This document |
| `scripts/visual-smoke-test.ts` | Automated visual consistency checks |
