# CubiQo Production API Documentation

Complete API reference for CubiQo React hooks, API routes, TypeScript interfaces, and deployment configurations.

**Version:** 4.0.0 (Production Release)  
**Last Updated:** February 8, 2025  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Deployment Architecture](#deployment-architecture)
3. [React Hooks](#react-hooks)
4. [API Routes](#api-routes)
5. [AI Integration](#ai-integration)
6. [Voice System](#voice-system)
7. [TypeScript Types](#typescript-types)
8. [Color System](#color-system)
9. [Security & Spending](#security--spending)
10. [Error Handling](#error-handling)

---

## Overview

CubiQo is a multi-modal AI companion featuring:

- **Voice-First Interface** - Natural speech interaction with emotional modulation
- **Emotional Color System** - 8-color consciousness representing different emotional states
- **Multi-Provider AI** - MiniMax (primary), Mixtral, Llama, Claude Haiku with intelligent routing
- **BYO Keys Mode** - Users can bring their own API keys for cost isolation
- **Admin Controls** - Comprehensive spending caps and user management

### Deployment Targets

- **Prod-A (Admin)**: Full admin features, unified API keys, analytics dashboard
- **Prod-B (Public)**: Public-facing, BYO keys mode, rate-limited

---

## Deployment Architecture

### Prod-A: Admin Deployment

**Domain:** `admin.cubiqo.com` (or `a.cubiqo.com`)  
**Purpose:** Owner/admin access with full control panel

**Features:**
- Admin dashboard with user management
- API key management for multiple providers
- Analytics and spending caps monitoring
- Browser headless automation controls
- Supabase admin access
- Full feature set without restrictions

**Environment Variables:**
```env
# AI Providers
MINIMAX_API_KEY=***
MISTRAL_API_KEY=***
TOGETHER_API_KEY=***
ANTHROPIC_API_KEY=***
ELEVENLABS_API_KEY=***

# Admin Features
NEXT_PUBLIC_ADMIN_MODE=true
NEXT_PUBLIC_SHOW_API_MANAGEMENT=true
NEXT_PUBLIC_SHOW_ANALYTICS=true
NEXT_PUBLIC_SHOW_USER_MANAGEMENT=true

# Database
DATABASE_URL=${SUPABASE_DATABASE_URL}

# Deployment
NEXT_PUBLIC_APP_URL=https://admin.cubiqo.com
```

### Prod-B: Public Deployment

**Domain:** `cubiqo.com` (or `app.cubiqo.com`)  
**Purpose:** Public users with BYO keys mode

**Features:**
- Public-facing CubiQo experience
- Voice interaction with the cube
- AI chat (user's own keys required)
- Rate limiting: 100 requests/hour
- Spending cap: $10/day per user
- No admin panels or raw API access

**Environment Variables:**
```env
# Public Mode - Users bring their own keys
NEXT_PUBLIC_BYO_KEYS_MODE=true

# Public Features Only
NEXT_PUBLIC_ADMIN_MODE=false
NEXT_PUBLIC_SHOW_API_MANAGEMENT=false
NEXT_PUBLIC_SHOW_ANALYTICS=false
NEXT_PUBLIC_SHOW_USER_MANAGEMENT=false

# Rate Limiting
NEXT_PUBLIC_RATE_LIMIT_ENABLED=true
NEXT_PUBLIC_MAX_REQUESTS_PER_HOUR=100
NEXT_PUBLIC_MAX_SPENDING_PER_DAY=10

# Database (session management only)
DATABASE_URL=${SUPABASE_DATABASE_URL}

# Deployment
NEXT_PUBLIC_APP_URL=https://cubiqo.com
```

### Feature Comparison

| Feature | Prod-A (Admin) | Prod-B (Public) |
|---------|----------------|-----------------|
| AI Chat | ✅ Unified keys | ✅ BYO keys only |
| Voice TTS | ✅ Unlimited | ✅ Rate limited |
| Admin Dashboard | ✅ Full access | ❌ Not available |
| API Management | ✅ Yes | ❌ No |
| Analytics | ✅ Yes | ❌ No |
| User Management | ✅ Yes | ❌ No |
| Spending Caps | ✅ Monitor all | ✅ Per-user only |
| Rate Limits | ❌ No limits | ✅ 100 req/hour |

---

## React Hooks

---

## React Hooks

### useSession

**Location**: `src/hooks/useSession.ts`

**Purpose**: Session management with auth-first approach

```typescript
import { useSession } from '@/hooks/useSession'

function MyComponent() {
  const {
    session,           // Session | null
    isLoading,         // boolean
    isGuest,           // boolean
    error,             // string | null
    createGuestSession,
    convertToAuthenticated,
    refreshSession,
    clearSession
  } = useSession()
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `session` | `Session \| null` | Current session object |
| `isLoading` | `boolean` | Session initialization in progress |
| `isGuest` | `boolean` | True if guest session |
| `error` | `string \| null` | Error message if any |

#### Methods

##### `createGuestSession()`

Create new guest session.

```typescript
const session = await createGuestSession()
```

**Returns**: `Promise<Session | null>`

##### `convertToAuthenticated(userId: string)`

Convert guest session to authenticated.

```typescript
const success = await convertToAuthenticated(userId)
```

**Returns**: `Promise<boolean>`

##### `refreshSession()`

Reload session from database.

```typescript
await refreshSession()
```

##### `clearSession()`

Clear session and localStorage.

```typescript
clearSession()
```

---

### useChat

**Location**: `src/hooks/useChat.ts`

**Purpose**: Conversation management and AI messaging

```typescript
import { useChat } from '@/hooks/useChat'

function MyComponent() {
  const {
    sendMessage,
    clearHistory,
    clearError,
    isLoading,
    error,
    conversationHistory,
    lastProvider,
    isInitialized
  } = useChat({
    sessionId: session?.id || null,
    isGuest: true,
    onColorChange: (color) => console.log('Color:', color)
  })
}
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `sessionId` | `string \| null` | Current session ID |
| `isGuest` | `boolean` | Guest mode flag |
| `onColorChange` | `(color: ColorName) => void` | Color change callback |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isLoading` | `boolean` | AI request in progress |
| `error` | `string \| null` | Error message |
| `conversationHistory` | `ConversationEntry[]` | Message history |
| `lastProvider` | `'minimax' \| 'mixtral' \| 'llama' \| 'claude' \| null` | Last AI provider used |
| `isInitialized` | `boolean` | Chat ready for use |

#### Methods

##### `sendMessage(message, currentColor)`

Send message to AI.

```typescript
const response = await sendMessage('Hello!', 'ORANGE')
// { color: 'YELLOW', response: 'Hi there!' }
```

**Parameters**:
- `message: string` - User message
- `currentColor: ColorName` - Current cube color

**Returns**: `Promise<AIResponse | null>`

##### `clearHistory()`

Clear conversation history.

```typescript
await clearHistory()
```

##### `clearError()`

Clear error state.

```typescript
clearError()
```

---

### useAuth

**Location**: `src/hooks/useAuth.ts`

**Purpose**: Supabase authentication state

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isGuest,
    signInWithEmail,
    signOut,
    refreshProfile
  } = useAuth()
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Supabase auth user |
| `profile` | `Profile \| null` | User profile from DB |
| `isLoading` | `boolean` | Auth state loading |
| `isAuthenticated` | `boolean` | User is authenticated |
| `isGuest` | `boolean` | User is guest |

#### Methods

##### `signInWithEmail(email)`

Send Magic Link email.

```typescript
await signInWithEmail('user@example.com')
```

**Returns**: `Promise<{ success: boolean }>`

##### `signOut()`

Sign out current user.

```typescript
await signOut()
```

##### `refreshProfile()`

Reload profile from database.

```typescript
await refreshProfile()
```

---

### useVoice

**Location**: `src/hooks/useVoice.ts`

**Purpose**: Speech recognition and text-to-speech

```typescript
import { useVoice } from '@/hooks/useVoice'

function MyComponent() {
  const {
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported
  } = useVoice()
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isListening` | `boolean` | Speech recognition active |
| `isSpeaking` | `boolean` | TTS active |
| `transcript` | `string` | Last recognized text |
| `error` | `string \| null` | Error message |
| `isSupported` | `boolean` | Browser supports voice |

#### Methods

##### `startListening()`

Start speech recognition.

```typescript
startListening()
```

##### `stopListening()`

Stop speech recognition.

```typescript
stopListening()
```

##### `speak(text)`

Speak text using TTS.

```typescript
await speak('Hello, how are you?')
```

**Returns**: `Promise<void>`

##### `stopSpeaking()`

Stop current speech.

```typescript
stopSpeaking()
```

---

## API Routes

### POST /api/session

Server-side session management with service role key.

#### Actions

##### `ensure_authenticated_session`

Create or find session for authenticated user.

**Request**:
```json
{
  "action": "ensure_authenticated_session",
  "userId": "uuid",
  "email": "user@example.com",
  "deviceInfo": {}
}
```

**Response**:
```json
{
  "session": {
    "id": "uuid",
    "user_id": "uuid",
    "is_guest": false,
    "created_at": "2025-11-27T10:00:00Z"
  }
}
```

##### `convert_guest_session`

Convert guest session to authenticated, migrate conversations.

**Request**:
```json
{
  "action": "convert_guest_session",
  "userId": "uuid",
  "sessionId": "guest-session-uuid",
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "session": {
    "id": "uuid",
    "user_id": "uuid",
    "is_guest": false
  }
}
```

##### `ensure_conversation`

Create or find conversation for session.

**Request**:
```json
{
  "action": "ensure_conversation",
  "sessionId": "uuid"
}
```

**Response**:
```json
{
  "conversation": {
    "id": "uuid",
    "color_state": "ORANGE"
  }
}
```

##### `get_messages`

Get messages for conversation.

**Request**:
```json
{
  "action": "get_messages",
  "conversationId": "uuid"
}
```

**Response**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "color": "ORANGE",
      "created_at": "2025-11-27T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Hi there!",
      "color": "YELLOW",
      "created_at": "2025-11-27T10:00:01Z"
    }
  ]
}
```

##### `save_message`

Save message to conversation.

**Request**:
```json
{
  "action": "save_message",
  "conversationId": "uuid",
  "role": "user",
  "content": "Hello",
  "color": "ORANGE"
}
```

**Response**:
```json
{
  "success": true
}
```

---

### POST /api/chat

AI chat endpoint with multi-provider routing and memory personalization.

**Provider Chain:**
1. **MiniMax** (M2 model) - Primary, fastest response
2. **Mixtral** (via Mistral API) - Fallback
3. **Llama** (via Together API) - Secondary fallback
4. **Claude Haiku** - Final fallback

**Request**:
```json
{
  "message": "Hello, how are you?",
  "conversationHistory": [
    {
      "userMessage": "Hi",
      "aiResponse": "Hello!",
      "color": "ORANGE",
      "timestamp": "2025-11-27T09:00:00Z"
    }
  ],
  "currentColor": "ORANGE",
  "isGuest": false,
  "messageCount": 5,
  "sessionId": "uuid"
}
```

**Response**:
```json
{
  "response": "I'm doing great, thank you for asking!",
  "color": "YELLOW",
  "provider": "claude"
}
```

**Error Response**:
```json
{
  "error": "Rate limit exceeded",
  "provider": "claude"
}
```

---

### POST /api/extract-memories

Async memory extraction endpoint. Called fire-and-forget after chat responses.

**Request**:
```json
{
  "sessionId": "uuid",
  "userMessage": "Hi, I'm Alex from Spain. I'm a developer.",
  "aiResponse": "Nice to meet you Alex! What kind of development do you do?"
}
```

**Response**:
```json
{
  "extracted": [
    { "key": "name", "value": "Alex", "zone": "green", "confidence": 0.95 },
    { "key": "location_country", "value": "Spain", "zone": "green", "confidence": 0.9 },
    { "key": "occupation", "value": "developer", "zone": "green", "confidence": 0.85 }
  ],
  "saved": 3
}
```

**Extracted Categories**:
- Identity: name, age, location, occupation
- Preferences: food, music, hobbies
- Dates: birthday, anniversary
- Personality: psychotype, communication style
- Relationships: family, pets

**Memory Zones**:
- `green` - General info
- `yellow` - Personal info
- `red` - Sensitive info

---

### GET /auth/callback

Magic Link callback handler.

**Query Parameters**:
- `code` - Auth code from email link
- `error` - Error if any
- `error_description` - Error details

**Behavior**:
- Exchanges code for session
- Redirects to `/` on success
- Shows error message on failure

---

## TypeScript Types

### Session

```typescript
interface Session {
  id: string
  user_id: string | null
  is_guest: boolean
  device_info: Record<string, unknown>
  geo_location: string | null
  expires_at: string | null
  created_at: string
}
```

### Profile

```typescript
interface Profile {
  id: string
  email: string | null
  handle: string | null
  display_name: string | null
  avatar_url: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}
```

### ConversationEntry

```typescript
interface ConversationEntry {
  userMessage: string
  aiResponse: string
  color: ColorName
  timestamp: string
}
```

### AIResponse

```typescript
interface AIResponse {
  color: ColorName
  response: string
}
```

### ColorName

```typescript
type ColorName =
  | 'RED'
  | 'ORANGE'
  | 'YELLOW'
  | 'GREEN'
  | 'GREEN_BLUE'
  | 'BLUE'
  | 'PURPLE'
  | 'PINK'
```

---

## Color System

**Location**: `src/config/colors.ts`

### Color Definitions

```typescript
const COLORS = {
  ORANGE: {
    primary: '#FF6F00',
    secondary: '#FF9800',
    meaning: 'Neutral, curious, engaged'
  },
  YELLOW: {
    primary: '#FFA000',
    secondary: '#FFB74D',
    meaning: 'Happy, excited, playful'
  },
  RED: {
    primary: '#C2185B',
    secondary: '#E91E63',
    meaning: 'Passionate, urgent, intense'
  },
  BLUE: {
    primary: '#1976D2',
    secondary: '#42A5F5',
    meaning: 'Calm, thoughtful, reflective'
  },
  GREEN: {
    primary: '#388E3C',
    secondary: '#66BB6A',
    meaning: 'Peaceful, balanced, content'
  },
  GREEN_BLUE: {
    primary: '#00897B',
    secondary: '#26A69A',
    meaning: 'Serene, wise, supportive'
  },
  PURPLE: {
    primary: '#7B1FA2',
    secondary: '#AB47BC',
    meaning: 'Creative, mysterious, inspired'
  },
  PINK: {
    primary: '#C2185B',
    secondary: '#F06292',
    meaning: 'Loving, gentle, caring'
  }
}
```

### Utility Functions

```typescript
// Get color by name
import { getColor } from '@/config/colors'
const color = getColor('YELLOW')

// Get all color names
import { getColorNames } from '@/config/colors'
const names = getColorNames() // ['RED', 'ORANGE', ...]

// Validate color name
import { isValidColor } from '@/config/colors'
const valid = isValidColor('YELLOW') // true
```

---

## Error Handling

### Hook Errors

All hooks provide an `error` property:

```typescript
const { error } = useChat(options)

if (error) {
  console.error('Chat error:', error)
}
```

### API Errors

API routes return errors with status codes:

| Status | Description |
|--------|-------------|
| 400 | Bad request (missing params) |
| 401 | Unauthorized |
| 429 | Rate limited |
| 500 | Server error |

### Voice Errors

```typescript
const { error: voiceError } = useVoice()

// Common errors:
// - 'no-speech': No speech detected
// - 'not-allowed': Mic permission denied
// - 'audio-capture': Mic not available
```

---

## AI Integration

### Multi-Provider Architecture

CubiQo supports multiple AI providers with intelligent fallback:

```typescript
// Provider chain (in order of preference)
1. MiniMax M2 (fastest, cost-effective)
2. Mixtral (via Mistral API)
3. Llama (via Together API)
4. Claude Haiku (final fallback)
```

### BYO Keys Mode (Prod-B)

**Purpose:** Users provide their own API keys

**Flow:**
1. User opens Settings → BYO Mode
2. Enters API keys (MiniMax, Mistral, Together, Claude)
3. Keys stored in localStorage only
4. Transmitted via HTTP headers

**Client-Side:**
```typescript
// useBYO.ts hook
const { config, updateConfig, enabled } = useBYO()

// Keys stored in localStorage: cubiqo_byo_config
{
  enabled: true,
  minimaxApiKey: "***",
  mistralApiKey: "***",
  togetherApiKey: "***",
  claudeApiKey: "sk-ant-***"
}

// Headers sent to API
{
  "x-byo-minimax-key": "***",
  "x-byo-mistral-key": "***",
  "x-byo-together-key": "***",
  "x-byo-claude-key": "sk-ant-***"
}
```

**Server-Side:**
```typescript
// /api/chat/route.ts
const byoMinimaxKey = request.headers.get('x-byo-minimax-key')
const byoMistralKey = request.headers.get('x-byo-mistral-key')
const byoTogetherKey = request.headers.get('x-byo-together-key')
const byoClaudeKey = request.headers.get('x-byo-claude-key')

const apiKey = byoMinimaxKey || process.env.MINIMAX_API_KEY
// Use BYO key if provided, fallback to env
```

### Provider Configuration Files

**Location:** `src/lib/ai/providers.ts`

```typescript
export const MINIMAX_CONFIG: ProviderConfig = {
  name: 'minimax',
  model: 'MiniMax-M2',
  maxTokens: 200,
  apiKeyEnv: 'MINIMAX_API_KEY'
}

export const MISTRAL_CONFIG: ProviderConfig = {
  name: 'mixtral',
  model: 'mixtral-8x7b-32768',
  maxTokens: 200,
  apiKeyEnv: 'MISTRAL_API_KEY'
}

export const LLAMA_CONFIG: ProviderConfig = {
  name: 'llama',
  model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  maxTokens: 200,
  apiKeyEnv: 'TOGETHER_API_KEY'
}

export const CLAUDE_CONFIG: ProviderConfig = {
  name: 'claude',
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 200,
  apiKeyEnv: 'ANTHROPIC_API_KEY'
}
```

### OpenClaw Integration (Advanced)

**Purpose:** Enhanced AI with tool use via Clawdbot

**Configuration:**
```env
OPENCLAW_BASE_URL=http://localhost:18789
OPENCLAW_API_KEY=your_key_here
```

**Usage:**
```typescript
import { callOpenClaw } from '@/lib/ai/openclaw'

const response = await callOpenClaw(
  systemPrompt,
  messages,
  apiKey
)
```

**Features:**
- Compatible API endpoint
- Tool use capabilities
- Memory and context management
- Enhanced reasoning with Claude Sonnet 4.5

---

## Voice System

### Text-to-Speech API

**Endpoint:** `POST /api/tts`

**Voice Provider:** ElevenLabs (Daniel voice - British, husky)

**Features:**
- Dynamic voice modulation (madhyama marg philosophy)
- Mood-based parameter adjustment
- Natural variation to avoid robotic sound
- Streaming for faster playback
- Spending cap: $200/month
- Rate limit: 10 requests/minute per session

**Request:**
```json
{
  "text": "Hello, how are you today?",
  "voiceId": "onwK4e9ZLuTAKqWW03F9",
  "mood": "candid",
  "sessionId": "uuid"
}
```

**Response:**
- Content-Type: `audio/mpeg`
- Headers:
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-Spending-Remaining`: Budget remaining

### Voice Modulation (Madhyama Marg)

**Philosophy:** Balance between too-human (fake) and too-robotic (cold)

**Moods:**

| Mood | Stability | Similarity | Style | Use Case |
|------|-----------|------------|-------|----------|
| **sincere** | 0.75 | 0.75 | 0.15 | Professional, explaining |
| **candid** | 0.40 | 0.70 | 0.65 | Playful, casual, laughter |
| **intimate** | 0.60 | 0.85 | 0.25 | Whisper, romantic, vulnerable |
| **neutral** | 0.65 | 0.75 | 0.30 | Balanced default |

**Auto-Detection:**
```typescript
import { detectVoiceMood, getVoiceSettings } from '@/lib/voice-modulation'

// Detect mood from content
const mood = detectVoiceMood(text)
// Returns: 'sincere' | 'candid' | 'intimate' | 'neutral'

// Get dynamic settings with natural variation
const settings = getVoiceSettings(text, mood, true)
```

**Keywords:**
- **Intimate:** whisper, softly, secret, confession, ❤️, 💕
- **Candid:** haha, lol, funny, literally, 😂, 😄
- **Sincere:** important, explain, analysis, research, evidence

**Natural Variation:**
- 5% variance added to prevent mechanical sound
- Smaller variance on similarity (maintain voice identity)
- Applied automatically unless disabled

### Speech Recognition

**Technology:** Web Speech API (browser-based)

**Flow:**
1. User taps microphone
2. `useVoice.startListening()` activates
3. Real-time transcript updates
4. Final transcript sent to AI
5. Response spoken via TTS

**Error Handling:**
- `no-speech`: Timeout waiting for speech
- `not-allowed`: Microphone permission denied
- `audio-capture`: Microphone unavailable
- `network`: Internet connection lost

---

## Security & Spending

### Spending Caps

**Purpose:** Prevent runaway costs on all AI APIs

**Limits:**
- MiniMax: $200/month
- Mistral (Mixtral): $200/month
- Together (Llama): $200/month
- Anthropic (Claude Haiku): $200/month
- ElevenLabs (TTS): $200/month

**Implementation:**
```typescript
import { 
  checkSpendingCap, 
  recordSpending,
  getSpendingStatus 
} from '@/lib/spending-caps'

// Check before API call
const capCheck = checkSpendingCap('anthropic')
if (!capCheck.allowed) {
  throw new Error('Spending cap reached')
}

// Record after successful call
const cost = estimateAnthropicCost(inputTokens, outputTokens)
recordSpending('anthropic', cost)

// Get status for dashboard
const status = getSpendingStatus()
// {
//   minimax: { spent: 15.30, cap: 200, remaining: 184.70, percentUsed: 8 },
//   mistral: { spent: 8.45, cap: 200, remaining: 191.55, percentUsed: 4 },
//   together: { spent: 5.20, cap: 200, remaining: 194.80, percentUsed: 3 },
//   anthropic: { spent: 45.23, cap: 200, remaining: 154.77, percentUsed: 23 },
//   elevenlabs: { spent: 89.10, cap: 200, remaining: 110.90, percentUsed: 45 }
// }
```

**Cost Estimation:**
- MiniMax: ~$2/1M input tokens, ~$6/1M output tokens
- Mixtral: ~$0.70/1M input tokens, ~$0.70/1M output tokens
- Llama: ~$0.20/1M input tokens, ~$0.20/1M output tokens
- Claude Haiku: ~$0.80/1M input tokens, ~$4/1M output tokens
- ElevenLabs: ~$0.30 per 1000 characters

**Reset Logic:**
- Automatic monthly reset (1st of each month)
- Manual reset via admin function
- In-memory storage (use database for production)

### Rate Limiting

**Prod-A (Admin):**
- No rate limits
- Unlimited API usage

**Prod-B (Public):**
- 100 requests per hour
- $10 spending cap per day per user
- Per-session tracking
- 60-second reset window

**TTS Rate Limiting:**
- 10 requests per minute per session
- Applies to all deployments
- Prevents ElevenLabs quota abuse

### BYO Keys Security

**Storage:**
- Client-side only (localStorage)
- Never sent to server database
- Transmitted via HTTPS headers only

**Server Handling:**
- Keys used only for immediate API call
- Never logged in full (only `!!key` boolean)
- No fallback to server keys when BYO enabled
- Complete cost isolation

**User Control:**
- Toggle BYO mode on/off
- Clear keys anytime
- Per-provider configuration

---

## Environment Variables

### Production-A (Admin)

```bash
# AI Providers
MINIMAX_API_KEY=***
MISTRAL_API_KEY=***
TOGETHER_API_KEY=***
ANTHROPIC_API_KEY=***
ELEVENLABS_API_KEY=***

# Admin Features
NEXT_PUBLIC_ADMIN_MODE=true
NEXT_PUBLIC_SHOW_API_MANAGEMENT=true
NEXT_PUBLIC_SHOW_ANALYTICS=true
NEXT_PUBLIC_SHOW_USER_MANAGEMENT=true

# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=${SUPABASE_DATABASE_URL}

# Deployment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://admin.cubiqo.com
VERCEL_ENV=production
```

### Production-B (Public)

```bash
# Public Mode
NEXT_PUBLIC_BYO_KEYS_MODE=true

# Public Features Only
NEXT_PUBLIC_ADMIN_MODE=false
NEXT_PUBLIC_SHOW_API_MANAGEMENT=false
NEXT_PUBLIC_SHOW_ANALYTICS=false
NEXT_PUBLIC_SHOW_USER_MANAGEMENT=false

# Rate Limiting
NEXT_PUBLIC_RATE_LIMIT_ENABLED=true
NEXT_PUBLIC_MAX_REQUESTS_PER_HOUR=100
NEXT_PUBLIC_MAX_SPENDING_PER_DAY=10

# Database (session management only)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=${SUPABASE_DATABASE_URL}

# Deployment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://cubiqo.com
VERCEL_ENV=production
```

### Development

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Providers (direct keys for dev)
MINIMAX_API_KEY=***
MISTRAL_API_KEY=***
TOGETHER_API_KEY=***
ANTHROPIC_API_KEY=sk-ant-***
ELEVENLABS_API_KEY=***

# OpenClaw (optional)
OPENCLAW_BASE_URL=http://localhost:18789
OPENCLAW_API_KEY=***

# Dev Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

**API Version**: 4.0.0
**Last Updated**: February 8, 2025
**Status**: Production Release - Prod-A & Prod-B Ready
