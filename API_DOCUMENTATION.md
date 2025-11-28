# CUBIQO Phase 2 API Documentation

Complete API reference for CUBIQO React hooks, API routes, and TypeScript interfaces.

---

## Table of Contents

1. [React Hooks](#react-hooks)
2. [API Routes](#api-routes)
3. [TypeScript Types](#typescript-types)
4. [Color System](#color-system)
5. [Error Handling](#error-handling)

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
| `lastProvider` | `'claude' \| 'openai' \| null` | Last AI provider used |
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

AI chat endpoint with provider fallback and memory personalization.

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

**Providers**:
1. Claude (Anthropic) - primary
2. OpenAI GPT-4o - fallback on error

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

## Environment Variables

```bash
# Required - Public (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Required - Server only
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional
NEXT_PUBLIC_SITE_URL=https://cubiqo.ai
```

---

**API Version**: 3.1.0
**Last Updated**: November 28, 2025
**Status**: Phase 2 Complete + Memory Extraction
