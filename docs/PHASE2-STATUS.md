# CubiQo Phase 2 - Implementation Status

**Last Updated**: November 28, 2025

---

## Progress: 13/13 Complete ✅

### Completed Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Database Schema | ✅ |
| 2 | Row Level Security (RLS) | ✅ |
| 3 | TypeScript Types | ✅ |
| 4 | Supabase Client | ✅ |
| 5 | Auth Flow (Magic Link + Guest) | ✅ |
| 6 | 3D Cube (React Three Fiber) | ✅ |
| 7 | AI Dual Routing (Claude/OpenAI) | ✅ |
| 8 | Chat UI | ✅ |
| 9 | Voice Input/Output | ✅ |
| 10 | PWA | ✅ |
| 11 | Conversation Persistence | ✅ |
| 12 | Auth UI (Sign In panel) | ✅ |
| 13 | Memory Extraction | ✅ |

---

## Today's Completed (28 Nov)

### Memory Extraction ✅
AI-based extraction of user facts for personalization:
- Server-only module: `memory-extraction.server.ts`
- Async endpoint: `/api/extract-memories` (fire-and-forget)
- Claude Haiku for cost-effective extraction
- Extracted facts injected into system prompt

**Extracted Categories:**
- Identity: name, age, location, occupation
- Preferences: food, music, hobbies
- Dates: birthday, anniversary
- Personality: psychotype, communication style

**Memory Zones:**
- `green` - General info (freely used)
- `yellow` - Personal info (used carefully)
- `red` - Sensitive info (only when relevant)

---

## Completed (27 Nov)

### Intelligent Auth Nudge ✅
AI naturally suggests sign-in to guest users:
- Range: messages 5-10
- Messages 5-9: AI has discretion (finds emotional moment)
- Message 10: Mandatory (must suggest)
- Mentions Magic Link ease: "just email, one click, done"
- `[AUTH_NUDGE]` marker auto-opens auth form after speech
- Dark theme by default

### Menu Simplification ✅
- Separate /chat page
- Minimal menu: Voice Mode, Chat link, Theme, Sign In
- Auth form shows in menu on click

---

## Completed (26 Nov)

### UI Redesign ✅
- Fullscreen cube (transparent canvas, theme-aware)
- Legacy design match (CubiQo™ branding, footer, trademark)
- Light/Dark theme toggle with persistence

### Voice State Machine ✅
Proper state machine from legacy code:

| State | Button | Animation | Text |
|-------|--------|-----------|------|
| `idle` | 🎤 | - | Talk to Cubiqo™ |
| `listening` | 🎙️ | pulse + blue glow | Listening... |
| `thinking` | 💭 | scale | Thinking... |
| `speaking` | 🗣️ | green glow | Speaking... |

Click behavior:
- `idle` → start listening
- `listening` → stop
- `thinking` → ignore (cannot interrupt)
- `speaking` → stop speech

### Fixes Applied
- Removed OrbitControls (cube has internal mouse tracking)
- Transparent canvas background (adapts to theme)
- Text shadows for visibility
- TTS integration with voice flow

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.0.3 |
| Language | TypeScript | 5.x |
| React | React 19 | RC |
| Styling | Tailwind CSS | 4.x |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth (Magic Link) | - |
| 3D | React Three Fiber | 9.4.0 |
| AI Primary | Claude | claude-haiku-4-5-20251001 |
| AI Second (Red Zone) | OpenAI | gpt-5.1 |
| Deployment | Vercel | - |

---

## URLs

| Environment | URL |
|-------------|-----|
| **Production** | https://cubiqo.ai |
| Preview | https://cubiqo-repo-git-phase2-cubiqo-projects-d7156840.vercel.app |
| Supabase | https://supabase.com/dashboard/project/naoxezcmcauecawchgjk |
| GitHub | https://github.com/thecubiqo/thecubiqo |

---

## Current Issues / TODO

### Menu Redesign Needed
Current menu has everything crammed together:
- Auth form
- Chat history (auto-plays TTS on open!)

Proposed structure:
```
┌─────────────────────────────┐
│  Menu                    ✕  │
├─────────────────────────────┤
│                             │
│  🎤 Voice Mode (default)    │
│  💬 Chat Mode               │
│  ⚙️ Settings                │
│                             │
├─────────────────────────────┤
│  Guest Session              │
│  "Sign in to save your      │
│   conversations forever"    │
│  [Continue with Email]      │
│                             │
└─────────────────────────────┘
```

### Next Tasks
1. ~~**Memory Extraction**~~ ✅ Complete
2. **Production Deploy** - Merge `phase2` → `main`
3. **Auth Nudge Range** - Increase from 5-10 to 5-20+ after production testing

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # AI dual routing + memory loading
│   │   ├── extract-memories/route.ts  # Async memory extraction
│   │   └── session/route.ts        # Session + conversation management
│   ├── auth/callback/route.ts      # Magic link
│   ├── layout.tsx                  # PWA meta
│   └── page.tsx
├── components/
│   ├── auth/                       # LoginForm, AuthStatus
│   ├── chat/                       # ChatContainer, ChatInput, ChatMessage
│   ├── cube/                       # Cube, CubeScene
│   └── FullscreenApp.tsx           # Main app (state machine)
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts                  # + Supabase persistence + memory trigger
│   ├── useSession.ts
│   ├── useSpeechRecognition.ts
│   └── useSpeechSynthesis.ts
├── lib/
│   ├── ai/
│   │   ├── index.ts                # Public exports
│   │   ├── memory-extraction.server.ts  # Server-only extraction
│   │   ├── providers.ts
│   │   ├── service.ts
│   │   └── system-prompt.ts
│   ├── auth/
│   └── supabase/
├── config/colors.ts                # 4 color states
└── types/

public/
├── manifest.json
├── sw.js
└── icons/

legacy/                         # Reference implementation
├── src/main.js                 # State machine reference
└── src/services/voice.js       # Voice service reference
```

---

## Color System (Fourth Way Philosophy)

| Color | Name | Hex | Meaning |
|-------|------|-----|---------|
| 🟧 ORANGE | Fourth Way | #FF6F00 | Stillness, awareness, reflection (home state) |
| 🟥 RED | Tamas | #C2185B | Desire, indulgence, rebellion |
| 🟨 YELLOW | Rajas | #FFA000 | Activity, energy, curiosity |
| 🟢 GREEN_BLUE | Sattva | #00897B | Growth, wellness, ambition |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=  # optional fallback
```
