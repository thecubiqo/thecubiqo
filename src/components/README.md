# TopRightCTA Component

A high-definition, interactive "Welcome" CTA designed for the top-right corner of the landing page.

## Props
- `href` (string, default: '/welcome'): Destination URL.
- `label` (string, default: 'Welcome'): Text label.
- `openInNewTab` (boolean, default: false): Opens in new tab.
- `ariaLabel` (string): Accessibility label Override.

## Analytics
Fires `top_right_cta_click` event to Vercel Analytics.

## Assets
Uses inline SVGs from `public/icons/`:
- `cta-cuboid.svg`
- `signal-word.svg`
- `cta-arrow.svg`
