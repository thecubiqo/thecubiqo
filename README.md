# CubiQo

> One Mind. Many Dimensions.

Emotional AI companion with persistent memory and voice interface.

**Status:** ✅ Phase 2 Complete
**Preview:** https://cubiqo-repo-git-phase2-cubiqo-projects-d7156840.vercel.app

---

## Features

| Feature | Description |
|---------|-------------|
| 🎤 **Voice Interface** | Speech recognition + TTS with state machine |
| 🧊 **3D Cube** | React Three Fiber with 4 emotional colors |
| 🧠 **Memory Extraction** | AI extracts and remembers user facts |
| 🔐 **Magic Link Auth** | Passwordless email authentication |
| 👤 **Guest Mode** | Chat without sign-in, migrate on auth |
| 🎨 **Fourth Way Colors** | Orange (home), Red, Yellow, Green-Blue |
| 📱 **PWA** | Installable, offline-capable |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.0.3 |
| UI | React | 19 RC |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| 3D | React Three Fiber | 9.4.0 |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Magic Link | - |
| AI Primary | Claude Haiku 4.5 | claude-haiku-4-5-20251001 |
| AI Fallback | OpenAI | gpt-5.1 |
| Deployment | Vercel | - |

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your Supabase and AI API keys

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/              # AI routing + memory
│   │   ├── extract-memories/  # Async fact extraction
│   │   └── session/           # Session management
│   └── auth/callback/         # Magic link handler
├── components/
│   ├── auth/                  # Login, auth status
│   ├── cube/                  # 3D cube (R3F)
│   └── FullscreenApp.tsx      # Main app
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   ├── useSession.ts
│   └── useSpeech*.ts
└── lib/
    ├── ai/                    # AI providers, prompts
    └── supabase/              # DB client
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API reference |
| [docs/PHASE2-STATUS.md](./docs/PHASE2-STATUS.md) | Implementation status |

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Color Philosophy (Fourth Way)

| Color | State | Meaning |
|-------|-------|---------|
| 🟧 Orange | Home | Stillness, awareness, reflection |
| 🟥 Red | Tamas | Desire, indulgence, rebellion |
| 🟨 Yellow | Rajas | Activity, energy, curiosity |
| 🟢 Green-Blue | Sattva | Growth, wellness, ambition |

---

**Version:** 3.1.0 • **Updated:** 2025-11-28 • **Phase 2 Complete**
