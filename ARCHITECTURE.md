# CUBIQO Phase 2 Architecture Documentation

Technical architecture for CUBIQO - emotional AI companion with persistent memory.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Authentication & Sessions](#authentication--sessions)
7. [Memory Extraction](#memory-extraction)
8. [Database Schema](#database-schema)
9. [API Routes](#api-routes)
10. [State Management](#state-management)
11. [Security](#security)

---

## System Overview

CUBIQO Phase 2 is a full-stack application with:

- **Next.js 16 App Router** - React framework with server components
- **Supabase** - PostgreSQL database with Row Level Security (RLS)
- **Auth-First Architecture** - Check authentication before session operations
- **Dual AI Providers** - Claude (primary) + OpenAI (red zone)
- **Voice Interface** - Web Speech API for input/output

### Key Principles

1. **Auth-First**: Always check auth state before session operations
2. **RLS-Aware**: Server API bypasses RLS for authenticated users
3. **Guest Support**: Anonymous users can chat with localStorage backup
4. **Conversation Migration**: Guest history preserved on sign-in

---

## Technology Stack

```
Frontend:
  - Next.js 16.0.3 (App Router)
  - React 19 RC + TypeScript 5.x
  - React Three Fiber 9.4.0 (3D cube)
  - Tailwind CSS 4.x
  - Web Speech API (voice)

Backend:
  - Next.js API Routes
  - Supabase (PostgreSQL + Auth)
  - Service Role Key (bypasses RLS)

AI Providers:
  - Claude Haiku 4.5 (primary) - claude-haiku-4-5-20251001
  - OpenAI GPT-5.1 (red zone) - для интимных/чувственных тем

Deployment:
  - Vercel (hosting + serverless)
  - Supabase Cloud (database)
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            BROWSER                                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js App Router                        │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ FullscreenApp│  │  Cube3D    │  │  Voice Interface    │  │   │
│  │  │ (main UI)   │  │ (R3F/Three)│  │  (Web Speech API)   │  │   │
│  │  └──────┬──────┘  └─────────────┘  └─────────────────────┘  │   │
│  │         │                                                     │   │
│  │  ┌──────▼──────────────────────────────────────────────────┐ │   │
│  │  │                      React Hooks                         │ │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │ │   │
│  │  │  │useSession│  │ useChat  │  │ useAuth  │  │useVoice │ │ │   │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────────┘ │ │   │
│  │  └───────┼─────────────┼─────────────┼───────────────────┘ │   │
│  │          │             │             │                       │   │
│  └──────────┼─────────────┼─────────────┼───────────────────────┘   │
│             │             │             │                            │
└─────────────┼─────────────┼─────────────┼────────────────────────────┘
              │             │             │
              ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Next.js API Routes                             │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  /api/session   │  │   /api/chat     │  │  /auth/callback     │  │
│  │  (CRUD sessions)│  │  (AI providers) │  │  (Magic Link)       │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────────┘  │
│           │                    │                                      │
└───────────┼────────────────────┼──────────────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────┐  ┌─────────────────────────────────────────────┐
│     SUPABASE        │  │              AI PROVIDERS                    │
│                     │  │                                               │
│  ┌───────────────┐  │  │  ┌─────────────────┐  ┌─────────────────┐   │
│  │   PostgreSQL  │  │  │  │  Anthropic API  │  │   OpenAI API    │   │
│  │  - profiles   │  │  │  │  Claude Haiku   │  │    GPT-5.1      │   │
│  │  - sessions   │  │  │  │   (primary)     │  │   (red zone)    │   │
│  │  - messages   │  │  │  └─────────────────┘  └─────────────────┘   │
│  │  - memory     │  │  │                                               │
│  └───────────────┘  │  └───────────────────────────────────────────────┘
│                     │
│  ┌───────────────┐  │
│  │  Supabase Auth│  │
│  │  (Magic Link) │  │
│  └───────────────┘  │
└─────────────────────┘
```

---

## Core Components

### 1. FullscreenApp (`src/components/FullscreenApp.tsx`)

Main application component with:
- Fullscreen 3D cube background
- Voice state machine (idle → listening → thinking → speaking)
- Hamburger menu (auth status, color controls)
- Mobile-responsive design

### 2. Cube3D (`src/components/Cube3D.tsx`)

React Three Fiber 3D cube with:
- 8 emotional colors (ORANGE, BLUE, GREEN, etc.)
- Smooth color transitions
- Pupil (eye) that tracks mouse
- Animation states (idle, listening, thinking, speaking)

### 3. React Hooks

| Hook | Purpose | Location |
|------|---------|----------|
| `useSession` | Session management (guest/auth) | `src/hooks/useSession.ts` |
| `useChat` | Conversation + AI messaging | `src/hooks/useChat.ts` |
| `useAuth` | Supabase auth state | `src/hooks/useAuth.ts` |
| `useVoice` | Speech recognition + TTS | `src/hooks/useVoice.ts` |

---

## Data Flow

### Voice Conversation Flow

```
User taps microphone
        │
        ▼
useVoice.startListening()
        │
        ├─ SpeechRecognition starts
        ├─ Cube enters "listening" state
        │
        ▼
User speaks → transcript received
        │
        ▼
useChat.sendMessage(transcript)
        │
        ├─ Cube enters "thinking" state
        ├─ POST /api/chat
        │       │
        │       ├─ Try Claude API (primary)
        │       ├─ Route to OpenAI for red zone topics
        │       │
        │       ▼
        │   AI response + color
        │
        ▼
Cube.setColor(newColor)
        │
        ├─ Cube enters "speaking" state
        ├─ useVoice.speak(response)
        │
        ▼
TTS completes → idle state
```

### Session Initialization Flow

```
Page loads
    │
    ▼
useAuth: Check Supabase auth
    │
    ├─ User authenticated?
    │       │
    │       ├─ YES: useSession via /api/session
    │       │       ├─ Convert guest session (if exists)
    │       │       ├─ Migrate conversations
    │       │       └─ Return user session
    │       │
    │       └─ NO: useSession direct Supabase
    │               ├─ Create guest session (RLS allows)
    │               └─ Store in localStorage
    │
    ▼
useChat: Initialize conversation
    │
    ├─ Find or create conversation
    ├─ Load message history
    └─ Ready for chat
```

---

## Authentication & Sessions

### Auth-First Approach

**Problem**: RLS blocks authenticated users from creating sessions via client-side queries.

**Solution**: Check auth state FIRST, then:
- **Authenticated users**: Use `/api/session` with service role key (bypasses RLS)
- **Guest users**: Direct Supabase client (RLS allows anonymous)

### Session Lifecycle

```
1. Guest arrives → Create guest session (localStorage + Supabase)
2. Guest chats → Messages saved to Supabase
3. Guest signs in → Magic Link email sent
4. User clicks link → /auth/callback processes token
5. Session converted:
   - Try to convert guest session to user session
   - If fails (user already has session): migrate conversations
   - Preserve all chat history
```

### Magic Link Flow

```
User enters email
        │
        ▼
supabase.auth.signInWithOtp({ email })
        │
        ├─ Email sent with magic link
        │
        ▼
User clicks link → /auth/callback?token=xxx
        │
        ▼
Supabase exchanges token for session
        │
        ▼
onAuthStateChange fires → useAuth updates
        │
        ▼
useSession converts/migrates session
```

---

## Memory Extraction

CUBIQO extracts and remembers facts about users to personalize conversations.

### How It Works

```
User message + AI response
        │
        ▼
/api/extract-memories (async, fire-and-forget)
        │
        ├─ Claude Haiku analyzes conversation
        ├─ Extracts facts with confidence > 0.7
        │
        ▼
Save to `memory` table (upsert by key)
        │
        ▼
Next conversation:
        │
        ├─ /api/chat loads memories for sessionId
        ├─ Injects into system prompt
        └─ AI personalizes response
```

### Extracted Fact Categories

| Category | Examples | Zone |
|----------|----------|------|
| Identity | name, age, location, occupation | green |
| Preferences | food, music, hobbies | green |
| Important Dates | birthday, anniversary | green |
| Personality | psychotype, communication style | yellow |
| Relationships | family, pets | yellow |
| Sensitive | health, traumas | red |

### Memory Zones

- **green** - General info, freely used in conversation
- **yellow** - Personal info, used carefully
- **red** - Sensitive info, only referenced when relevant

### Architecture

```
src/lib/ai/memory-extraction.server.ts  # Server-only extraction logic
src/app/api/extract-memories/route.ts   # Async extraction endpoint
src/app/api/chat/route.ts               # Loads memories into prompt
```

### Key Design Decisions

1. **Server-only**: `memory-extraction.server.ts` never imported by client code
2. **Async extraction**: Runs after response sent (fire-and-forget)
3. **Haiku model**: Cost-effective for extraction task
4. **Upsert pattern**: Same key updates existing fact

---

## Database Schema

### Tables

```sql
-- User profiles (linked to Supabase Auth)
profiles:
  id: UUID (PK, references auth.users)
  email: TEXT
  handle: TEXT (unique, auto-generated)
  display_name: TEXT
  avatar_url: TEXT
  preferences: JSONB
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

-- Sessions (guest or authenticated)
sessions:
  id: UUID (PK)
  user_id: UUID (FK → profiles, nullable for guests)
  is_guest: BOOLEAN
  device_info: JSONB
  geo_location: TEXT
  expires_at: TIMESTAMP (null = never)
  created_at: TIMESTAMP

-- Conversations (chat sessions)
conversations:
  id: UUID (PK)
  session_id: UUID (FK → sessions)
  title: TEXT
  color_state: TEXT (current color)
  message_count: INTEGER
  ai_model: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

-- Messages
messages:
  id: UUID (PK)
  conversation_id: UUID (FK → conversations)
  role: TEXT ('user' | 'assistant')
  content: TEXT
  color: TEXT
  tokens_used: INTEGER
  created_at: TIMESTAMP

-- Memory (key-value storage per session)
memory:
  id: UUID (PK)
  session_id: UUID (FK → sessions)
  key: TEXT
  value: TEXT
  zone: TEXT
  expires_at: TIMESTAMP
  created_at: TIMESTAMP
```

### RLS Policies

```sql
-- Sessions: guests can create, users need API
CREATE POLICY "Allow anonymous session creation"
ON sessions FOR INSERT
WITH CHECK (is_guest = true);

-- Messages: anyone can read their conversation's messages
CREATE POLICY "Allow message read"
ON messages FOR SELECT
USING (conversation_id IN (
  SELECT id FROM conversations
  WHERE session_id = current_session_id()
));
```

---

## API Routes

### `/api/session` (POST)

Server-side session management with service role key.

**Actions**:

| Action | Input | Output |
|--------|-------|--------|
| `ensure_authenticated_session` | userId, email | session |
| `convert_guest_session` | userId, sessionId | session (migrated) |
| `ensure_conversation` | sessionId | conversation |
| `get_messages` | conversationId | messages[] |
| `save_message` | conversationId, role, content, color | success |

### `/api/chat` (POST)

AI chat endpoint with dual routing and memory personalization.

**Input**:
```json
{
  "message": "Hello",
  "conversationHistory": [...],
  "currentColor": "ORANGE",
  "isGuest": false,
  "messageCount": 5,
  "sessionId": "uuid"
}
```

**Output**:
```json
{
  "response": "Hi there!",
  "color": "YELLOW",
  "provider": "claude"
}
```

**Provider Logic**:
1. Claude (Anthropic) - primary provider for most conversations
2. OpenAI (GPT-5.1) - routed for red zone (intimate/sensual topics)
3. Return provider name for debugging

### `/api/extract-memories` (POST)

Async memory extraction endpoint (called fire-and-forget from client).

**Input**:
```json
{
  "sessionId": "uuid",
  "userMessage": "Hi, I'm Alex from Spain",
  "aiResponse": "Nice to meet you Alex!"
}
```

**Output**:
```json
{
  "extracted": [
    { "key": "name", "value": "Alex", "zone": "green", "confidence": 0.95 },
    { "key": "location_country", "value": "Spain", "zone": "green", "confidence": 0.9 }
  ],
  "saved": 2
}
```

### `/auth/callback` (GET)

Magic Link callback handler.

- Exchanges token for session
- Redirects to home page
- Error handling with user-friendly messages

---

## State Management

### Component State Flow

```
                    ┌─────────────┐
                    │   useAuth   │
                    │ (auth state)│
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ useSession  │ │   useChat   │ │  useVoice   │
    │(session mgmt│ │(conversation│ │(speech I/O) │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                  ┌─────────────────┐
                  │  FullscreenApp  │
                  │  (UI component) │
                  └─────────────────┘
```

### Voice State Machine

```
IDLE ──────► LISTENING ──────► THINKING ──────► SPEAKING ──────► IDLE
  │              │                  │                │              │
  │              │                  │                │              │
  └──────────────┴──────────────────┴────────────────┴──────────────┘
                            (user can cancel at any state)
```

---

## Security

### API Key Protection

- `ANTHROPIC_API_KEY` - Vercel env var, never exposed
- `OPENAI_API_KEY` - Vercel env var, never exposed
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only, bypasses RLS

### Row Level Security

- **Guests**: Can create sessions, conversations, messages (anonymous)
- **Authenticated**: Use server API with service role (bypasses RLS)
- **Data isolation**: Users only see their own data

### Input Validation

- All API inputs validated
- No SQL injection (Supabase client handles)
- XSS prevention (React escapes by default)

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server only!

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional
NEXT_PUBLIC_SITE_URL=https://cubiqo.ai
```

---

## Deployment

### Vercel Configuration

- **Framework**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Node Version**: 18.x

### Branches

- `main` - Production (cubiqo.ai)
- `phase2` - Development (preview URLs)

---

---

## Generator System (Regional Routing)

CUBIQO supports region-based customization through geo-routing.

### Architecture

```
generator/
├── config/
│   ├── schema.json          # JSON schema for validation
│   └── regions/
│       └── uk.json          # UK regional config
│
└── templates/
    └── world/
        ├── page.tsx         # Regional landing template
        └── layout.tsx       # Regional layout
```

### Regional Routing Flow

```
User visits cubiqo.ai
        │
        ▼
Middleware checks x-vercel-ip-country header
        │
        ├─ GB → Redirect to /uk
        ├─ IN → Redirect to /in (future)
        └─ Other → Stay on /
        │
        ▼
/[region]/layout.tsx loads RegionConfig
        │
        ▼
RegionProvider wraps children
        │
        ▼
AI prompt includes regional tone modifiers
```

### Key Files

| File | Purpose |
|------|---------|
| `src/middleware.ts` (proxy.ts) | Geo-routing based on country |
| `src/lib/config/regions.ts` | RegionConfig interface |
| `src/app/[region]/layout.tsx` | Regional layout with context |
| `generator/config/regions/*.json` | Regional configurations |

---

## Settings Cube (PoC)

Interactive demo showcasing real-time cube configuration via terminal commands.

### Data Flow

```
CommandInput.tsx → onExecute(cmd)
        ↓
SettingsCubeApp.tsx → parseCommand() → executeCommand() → setConfig(newConfig)
        ↓
SettingsCube.tsx → colorConfig changes → useFrame updates material
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `SettingsCubeApp` | Main container with Canvas + CommandInput |
| `SettingsCube` | 3D cube with materialRef + color lerp in useFrame |
| `CommandInput` | Terminal-style input with preset buttons |
| `useCodeTexture` | Canvas texture for code panels on side faces |

### Command API

```typescript
cubiqo.color.lock('RED')        // Change cube color
cubiqo.color.lock('YELLOW')
cubiqo.color.lock('GREEN_BLUE')
cubiqo.color.lock('ORANGE')

cubiqo.animation.set('listening')  // Change animation
cubiqo.animation.set('thinking')
cubiqo.animation.set('speaking')

cubiqo.reset()                     // Reset to defaults
```

### Key Pattern: Material Updates in R3F

**Wrong** (useEffect + materialsRef mutation):
```typescript
// Does NOT trigger React re-render
useEffect(() => {
  materialsRef.current = [new THREE.Material(...)]
}, [colorConfig])
```

**Correct** (materialRef + useFrame lerp):
```typescript
const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)

useMemo(() => {
  stateRef.current.targetColor = new THREE.Color(colorConfig.hex)
}, [colorConfig])

useFrame((_, delta) => {
  state.currentColor.lerp(state.targetColor, delta * 3)
  materialRef.current.color.copy(state.currentColor)
})

// In JSX
<meshPhysicalMaterial ref={materialRef} color={colorConfig.hex} />
```

---

## BYO Mode (Bring Your Own API Keys)

Users can use their own API keys for complete cost isolation.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BYOSettings.tsx (UI in hamburger menu)                        │
│      ↓                                                          │
│  useBYO.ts → localStorage: cubiqo_byo_config                   │
│  {                                                              │
│    enabled: boolean,                                            │
│    claudeApiKey: string | null,                                │
│    openaiApiKey: string | null                                 │
│  }                                                              │
│      ↓                                                          │
│  useChat.ts → getBYOHeaders()                                  │
│      ↓                                                          │
│  HTTP Headers: x-byo-claude-key, x-byo-openai-key              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER SIDE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /api/chat/route.ts                                            │
│      ├─ Read: x-byo-claude-key, x-byo-openai-key               │
│      └─ Use BYO key || process.env fallback                    │
│                                                                 │
│  /api/extract-memories/route.ts                                │
│      ├─ Read: x-byo-claude-key                                 │
│      └─ Use BYO key || process.env fallback                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/byo/types.ts` | BYOConfig interface + localStorage key |
| `src/hooks/useBYO.ts` | Hook for managing BYO state |
| `src/components/byo/BYOSettings.tsx` | UI panel for key input |
| `src/hooks/useChat.ts` | Adds BYO headers to API calls |
| `src/app/api/chat/route.ts` | Reads BYO headers, uses for AI calls |
| `src/app/api/extract-memories/route.ts` | Reads BYO header for memory extraction |

### Security

- Keys stored only in client localStorage
- Transmitted via HTTPS headers (not body)
- Server never logs full keys (only boolean `!!key`)
- No fallback to server key when BYO enabled (full isolation)

### User Flow

1. Open menu → Settings → BYO Mode
2. Toggle ON
3. Enter Claude API key (and/or OpenAI)
4. Click "Save Keys"
5. All subsequent API calls use user's key

---

**Architecture Version**: 3.3.0
**Last Updated**: December 7, 2025
**Status**: Phase 2 Complete + Generator PoC + Settings Cube + BYO Mode
