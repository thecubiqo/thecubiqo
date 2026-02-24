# Screenshots

Drop your screenshot files into this folder.

## Supported formats
`jpg` · `jpeg` · `png` · `gif` · `webp` · `svg`

## How to reference a screenshot in the app

Once a file is placed here (e.g. `my-screenshot.png`), it is served as a static asset at:

```
/screenshots/my-screenshot.png
```

You can use it anywhere in the codebase:

```tsx
// In a React/Next.js component
<img src="/screenshots/my-screenshot.png" alt="My screenshot" />
```

```css
/* In CSS */
background-image: url('/screenshots/my-screenshot.png');
```

## Notes
- File names should use lowercase letters, numbers, and hyphens (no spaces).
- Large images should be optimised before uploading to keep page load times fast.
- This folder is publicly accessible — do **not** upload sensitive or private content.
