# CUBIQO — Netlify Drop Preview

Static HTML previews — no build step, no database, no auth.

## How to deploy

1. Download `cubiqo-preview.zip` from the [GitHub Actions artifact](../../actions)  
   *(run the **Build Netlify Preview Zip** workflow if no artifact exists yet)*
2. Go to **[netlify.com/drop](https://netlify.com/drop)**
3. Drag and drop the zip file

That's it — your site is live in seconds.

## Pages

| File | Preview |
|---|---|
| `index.html` | Hub — links to all previews |
| `neon-cube.html` | Interactive neon glass cube (drag/zoom) |
| `hero-webgl.html` | Wave-thread shader + SoulCore + CUBIQO wordmark |
| `landing.html` | Particle starfield landing — click to enter |

## Run locally (no install)

```
npx serve .
# or just open any .html file directly in your browser
```
