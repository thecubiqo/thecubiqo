# Carl Phillips — Personal Website

High-end personal site. Cinematic, work-oriented, artistic.

## Stack
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- React Three Fiber + Three.js

## Routes
| Route | Purpose |
|-------|---------|
| `/` | Home — hero, statement, tiles, social pulse |
| `/life` | Bio, places, moments, timeline |
| `/life/places` | Documentary photos by place |
| `/life/moments` | Personal curated moments |
| `/work` | Leadership, programs, credibility |
| `/lifes-work` | Writing, music, field notes hub |
| `/lifes-work/writing` | Blog list (MDX) |
| `/lifes-work/music` | Recordings, playlists |
| `/lifes-work/field-notes` | Image-led posts |
| `/post/[slug]` | Individual post |
| `/contact` | Email + social |
| `/admin` | Protected posting dashboard |

## Image Strategy
- `/public/hero/` — conceptual hero art only (symbolic, never repeated)
- `/public/images/life/zambia/`, `/life/nyc/`, `/life/moments/` — documentary + personal
- `/public/images/work/irc/`, `/work/peace-corps/` — institutional evidence
- `/public/images/posts/` — per-post images

## Design Tokens
| Token | Value |
|-------|-------|
| Matte Black | `#0B0B0D` |
| Warm Ivory | `#F6F3EE` |
| Soft Ash | `#A9A9A9` |
| Deep Red (accent) | `#7C2020` |

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

Drop `creature.png` or `creature.glb` into `public/hero/` to activate the hero animation.
