# CUBIQO API Documentation

Complete API reference for all CUBIQO services, components, and interfaces.

---

## Table of Contents

1. [VoiceService API](#voiceservice-api)
2. [AIService API](#aiservice-api)
3. [MemoryService API](#memoryservice-api)
4. [Cube API](#cube-api)
5. [SceneManager API](#scenemanager-api)
6. [Color System API](#color-system-api)
7. [CubiqoApp API](#cubiqoapp-api)
8. [Backend API](#backend-api)

---

## VoiceService API

**Location**: `src/services/voice.js`

**Purpose**: Speech recognition and text-to-speech functionality

### Constructor

```javascript
const voiceService = new VoiceService();
```

**Description**: Initializes speech recognition and synthesis, loads available voices

**Side Effects**:
- Creates `SpeechRecognition` instance
- Sets up voice loading listeners
- Configures default language (en-US)

---

### Methods

#### `startListening(onTranscript, onError)`

**Description**: Start listening for voice input

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `onTranscript` | `(transcript: string) => void` | Callback when speech is recognized |
| `onError` | `(error: string) => void` | Callback on error |

**Returns**: `void`

**Example**:
```javascript
voiceService.startListening(
  (transcript) => {
    console.log('User said:', transcript);
  },
  (error) => {
    console.error('Voice error:', error);
  }
);
```

**Events**:
- Triggers `onstart` internally (logs "Listening started...")
- Triggers `onresult` when speech detected
- Triggers `onerror` on failure
- Auto-stops after 10 seconds (timeout)

**Errors**:
- `'no-speech'`: No speech detected
- `'audio-capture'`: Microphone not accessible
- `'not-allowed'`: Permission denied
- `'timeout'`: 10-second timeout reached

---

#### `stopListening()`

**Description**: Stop listening for voice input

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
voiceService.stopListening();
```

**Side Effects**:
- Stops `SpeechRecognition`
- Clears timeout timer
- Sets `isListening` to `false`

---

#### `speak(text, options?)`

**Description**: Speak text using text-to-speech

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | - | Text to speak |
| `options` | `object` | `{}` | TTS configuration |
| `options.rate` | `number` | `0.92` | Speech rate (0.1 - 10) |
| `options.pitch` | `number` | `1.05` | Voice pitch (0 - 2) |
| `options.volume` | `number` | `1.0` | Volume (0 - 1) |
| `options.lang` | `string` | `'en-US'` | Language code |

**Returns**: `Promise<void>` - Resolves when speech ends

**Example**:
```javascript
await voiceService.speak('Hello, how are you?', {
  rate: 0.9,
  pitch: 1.1,
  volume: 0.8
});
console.log('Finished speaking');
```

**Behavior**:
- Cancels any ongoing speech before starting
- Selects best available voice
- Logs voice selection and speech text
- iOS fix: 100ms delay before speaking

**Errors**:
- Rejects promise on TTS error
- Logs error to console

---

#### `stopSpeaking()`

**Description**: Cancel current speech synthesis

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
voiceService.stopSpeaking();
```

**Side Effects**:
- Calls `speechSynthesis.cancel()`
- Immediately stops all queued utterances

---

#### `selectBestVoice(voices, lang)`

**Description**: Select optimal voice for given language

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `voices` | `SpeechSynthesisVoice[]` | Array of available voices |
| `lang` | `string` | Language code (e.g., 'en-US') |

**Returns**: `SpeechSynthesisVoice | null`

**Selection Priority**:
1. Best male US voices (Reed, Aaron, Fred)
2. Other quality US voices (Eddy, Samantha)
3. Any US local voice
4. Any US online voice
5. Any English local voice
6. Any English voice
7. Default system voice

**Example**:
```javascript
const voices = speechSynthesis.getVoices();
const voice = voiceService.selectBestVoice(voices, 'en-US');
console.log('Selected voice:', voice.name);
```

**Debug**: Logs available English voices on first call

---

#### `activateAudioContext()`

**Description**: Unlock audio context for iOS Safari

**Parameters**: None

**Returns**: `boolean` - Always returns `true`

**Example**:
```javascript
// Call on first user gesture (tap/click)
voiceService.activateAudioContext();
```

**Purpose**: iOS requires user interaction to enable audio. This method:
1. Speaks empty utterance with volume 0
2. Immediately cancels it
3. Forces voice loading

**Must be called**: Before any TTS on iOS

---

#### `setLanguage(lang)`

**Description**: Change recognition and synthesis language

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `lang` | `string` | Language code (e.g., 'ru-RU', 'es-ES') |

**Returns**: `void`

**Example**:
```javascript
voiceService.setLanguage('ru-RU');
```

**Side Effects**:
- Updates `currentLanguage`
- Updates `recognition.lang`
- Logs language change

---

#### `getLanguage()`

**Description**: Get current language

**Parameters**: None

**Returns**: `string` - Current language code

**Example**:
```javascript
const lang = voiceService.getLanguage();
console.log('Current language:', lang); // 'en-US'
```

---

#### `getAvailableVoices(lang?)`

**Description**: Get list of available TTS voices

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `lang` | `string?` | Filter by language (optional) |

**Returns**: `SpeechSynthesisVoice[]`

**Example**:
```javascript
// All voices
const allVoices = voiceService.getAvailableVoices();

// English voices only
const enVoices = voiceService.getAvailableVoices('en-US');
console.log(enVoices.map(v => v.name));
```

---

#### `isSupported()`

**Description**: Check browser support for voice features

**Parameters**: None

**Returns**: `object`

```typescript
{
  recognition: boolean,  // SpeechRecognition available
  synthesis: boolean     // SpeechSynthesis available
}
```

**Example**:
```javascript
const support = voiceService.isSupported();

if (!support.recognition) {
  alert('Voice input not supported');
}

if (!support.synthesis) {
  alert('Voice output not supported');
}
```

---

## AIService API

**Location**: `src/services/ai.js`

**Purpose**: Claude API integration with temporal context

### Constructor

```javascript
const aiService = new AIService();
```

**Description**: Creates AI service instance

**Initial State**:
- `apiKey`: `null`
- No API calls can be made until key is set (backend handles this)

---

### Methods

#### `setApiKey(key)`

**Description**: Set Anthropic API key

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Anthropic API key (sk-ant-...) |

**Returns**: `void`

**Example**:
```javascript
aiService.setApiKey('sk-ant-api-key-here');
```

**Note**: In production, this is NOT used (backend proxy handles key)

---

#### `chat(message, conversationHistory, currentColor)`

**Description**: Send message to Claude and get response with color

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `string` | User's message |
| `conversationHistory` | `array` | Previous messages from MemoryService |
| `currentColor` | `string` | Current cube color name |

**Returns**: `Promise<{color: string, response: string}>`

**Example**:
```javascript
const history = await memoryService.getRecentMemories();
const currentColor = cube.getCurrentColor();

const result = await aiService.chat(
  'How are you doing today?',
  history,
  currentColor
);

console.log('Color:', result.color);      // 'YELLOW'
console.log('Response:', result.response); // 'I'm doing great, thanks!'
```

**Request Format**:
```javascript
POST /api/chat
{
  systemPrompt: string,  // Personality + instructions
  messages: [
    {
      role: 'user',
      content: '[Saturday, Oct 18, 2025, 12:38 PM] Hello'
    },
    {
      role: 'assistant',
      content: '{"color":"ORANGE","response":"Hi!"}'
    },
    {
      role: 'user',
      content: '[Wednesday, Oct 22, 2025, 02:04 PM] Current color: ORANGE\n\nUser message: How are you?'
    }
  ]
}
```

**Response Format**:
```json
{
  "color": "YELLOW",
  "response": "I'm doing great, thank you for asking!"
}
```

**Errors**:
- Throws on network error
- Throws on invalid API response
- Falls back to raw response if JSON parsing fails

---

#### `buildMessages(currentMessage, history, currentColor)`

**Description**: Build messages array with temporal context for API

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `currentMessage` | `string` | Current user message |
| `history` | `array` | Conversation history from MemoryService |
| `currentColor` | `string` | Current cube color name |

**Returns**: `array` - Messages formatted for Claude API

**Example**:
```javascript
const messages = aiService.buildMessages(
  'What time is it?',
  [
    {
      timestamp: '2025-10-18T10:38:41.129Z',
      userMessage: 'Hello',
      aiResponse: 'Hi there!',
      color: 'ORANGE'
    }
  ],
  'ORANGE'
);

console.log(messages);
// [
//   { role: 'user', content: '[Saturday, Oct 18, 2025, 10:38 AM] Hello' },
//   { role: 'assistant', content: '{"color":"ORANGE","response":"Hi there!"}' },
//   { role: 'user', content: '[Wednesday, Oct 22, 2025, 02:04 PM] Current color: ORANGE\n\nUser message: What time is it?' }
// ]
```

**Temporal Format**:
- First history entry: Full timestamp
- Other history entries: Relative time (5h ago, Yesterday)
- Current message: Full timestamp

---

#### `formatFullTimestamp(timestamp)`

**Description**: Format ISO timestamp to human-readable full format

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `timestamp` | `string` | ISO 8601 timestamp |

**Returns**: `string` - Formatted timestamp

**Format**: `"Weekday, Month Day, Year, HH:MM AM/PM"`

**Example**:
```javascript
const formatted = aiService.formatFullTimestamp('2025-10-22T14:30:45.123Z');
console.log(formatted);
// "Wednesday, Oct 22, 2025, 02:30 PM"
```

---

#### `formatTimeAgo(timestamp)`

**Description**: Format ISO timestamp to relative time

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `timestamp` | `string` | ISO 8601 timestamp |

**Returns**: `string` - Relative time string

**Format**:
| Time Difference | Output |
|----------------|--------|
| < 60 seconds | `"Just now"` |
| < 60 minutes | `"5m ago"` |
| < 24 hours | `"3h ago"` |
| 1 day | `"Yesterday"` |
| < 7 days | `"4d ago"` |
| >= 7 days | `"Oct 15"` |

**Example**:
```javascript
const now = new Date();
const fiveHoursAgo = new Date(now - 5 * 60 * 60 * 1000);

const relative = aiService.formatTimeAgo(fiveHoursAgo.toISOString());
console.log(relative); // "5h ago"
```

---

#### `parseResponse(content)`

**Description**: Parse Claude's JSON response

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | Raw response from Claude |

**Returns**: `{color: string, response: string}`

**Handles**:
- Valid JSON: `{"color":"RED","response":"..."}`
- Markdown-wrapped JSON: ` ```json\n{...}\n``` `
- Invalid JSON: Falls back to raw text with ORANGE color

**Example**:
```javascript
const parsed = aiService.parseResponse('{"color":"YELLOW","response":"Hello!"}');
console.log(parsed);
// { color: 'YELLOW', response: 'Hello!' }

const withMarkdown = aiService.parseResponse('```json\n{"color":"RED","response":"Hi"}\n```');
console.log(withMarkdown);
// { color: 'RED', response: 'Hi' }
```

**Validation**:
- Checks color against valid color names
- Defaults to ORANGE if invalid color

---

#### `isConfigured()`

**Description**: Check if API key is set

**Parameters**: None

**Returns**: `boolean`

**Example**:
```javascript
if (!aiService.isConfigured()) {
  console.log('API key not set');
}
```

**Note**: In production, always returns `false` (backend handles key)

---

## MemoryService API

**Location**: `src/services/memory.js`

**Purpose**: Conversation storage and retrieval using localStorage

### Constructor

```javascript
const memoryService = new MemoryService();
```

**Description**: Loads existing conversations from localStorage

**Side Effects**:
- Loads `cubiqo_conversations` from localStorage
- Initializes session ID

---

### Methods

#### `saveConversation(data)`

**Description**: Save new conversation entry

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `object` | Conversation data |
| `data.userMessage` | `string` | User's message |
| `data.aiResponse` | `string` | AI's response |
| `data.color` | `string` | Emotional color |

**Returns**: `Promise<void>`

**Example**:
```javascript
await memoryService.saveConversation({
  userMessage: 'Hello, how are you?',
  aiResponse: 'I'm doing well, thank you!',
  color: 'YELLOW'
});
```

**Storage Structure**:
```json
{
  "id": "1697123456789-abc123",
  "timestamp": "2025-10-22T14:30:45.123Z",
  "userMessage": "Hello, how are you?",
  "aiResponse": "I'm doing well, thank you!",
  "color": "YELLOW",
  "sessionId": "session-1697120000000"
}
```

**Behavior**:
- Generates unique ID
- Adds ISO timestamp
- Associates with current session
- Enforces 50 message limit (FIFO)
- Saves to localStorage

---

#### `getRecentMemories(limit)`

**Description**: Get last N conversations

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | `number` | `10` | Number of messages to retrieve |

**Returns**: `Promise<array>` - Array of conversation objects

**Example**:
```javascript
const recent = await memoryService.getRecentMemories(5);

console.log(recent);
// [
//   { id: '...', timestamp: '...', userMessage: '...', aiResponse: '...', color: '...', sessionId: '...' },
//   ...
// ]
```

**Behavior**:
- Returns last `limit` messages
- Ordered chronologically (oldest first)
- Default: Last 10 messages (CONTEXT_WINDOW)

---

#### `getAllConversations()`

**Description**: Get all stored conversations

**Parameters**: None

**Returns**: `Promise<array>` - All conversations (max 50)

**Example**:
```javascript
const all = await memoryService.getAllConversations();
console.log('Total conversations:', all.length);
```

---

#### `clearAll()`

**Description**: Delete all conversations

**Parameters**: None

**Returns**: `Promise<void>`

**Example**:
```javascript
await memoryService.clearAll();
console.log('All conversations deleted');
```

**Side Effects**:
- Clears localStorage
- Resets conversations array
- Keeps current session ID

---

#### `getSessionId()`

**Description**: Get current session ID (creates new if needed)

**Parameters**: None

**Returns**: `string` - Session ID

**Format**: `"session-{timestamp}"`

**Example**:
```javascript
const sessionId = memoryService.getSessionId();
console.log(sessionId); // "session-1697123456789"
```

**Session Logic**:
- New session if last activity > 30 minutes
- Session ID persists during active session

---

#### `isNewSession()`

**Description**: Check if new session should start

**Parameters**: None

**Returns**: `boolean`

**Criteria**: Last message > 30 minutes ago

**Example**:
```javascript
if (memoryService.isNewSession()) {
  console.log('Starting new session');
}
```

---

### Constants

```javascript
MAX_STORED_MESSAGES: 50    // Maximum conversations stored
CONTEXT_WINDOW: 10         // Messages sent to AI
SESSION_TIMEOUT: 1800000   // 30 minutes in milliseconds
```

---

## Cube API

**Location**: `src/core/cube.js`

**Purpose**: 3D cube mesh with animations and pupil

### Constructor

```javascript
const cube = new Cube();
```

**Description**: Creates cube mesh with shader material and pupil

**Returns**: `Cube` instance

---

### Methods

#### `setColor(colorName)`

**Description**: Transition cube to new color

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `colorName` | `string` | Color name (RED, YELLOW, GREEN_BLUE, ORANGE) |

**Returns**: `void`

**Example**:
```javascript
cube.setColor('YELLOW');
```

**Behavior**:
- Validates color name
- Starts transition animation (0.8s duration)
- Updates pupil border color
- Logs color change

**Transition**: Linear interpolation over 0.8 seconds

---

#### `getCurrentColor()`

**Description**: Get current color name

**Parameters**: None

**Returns**: `string` - Color name

**Example**:
```javascript
const color = cube.getCurrentColor();
console.log(color); // 'ORANGE'
```

---

#### `update(deltaTime, mouseX, mouseY)`

**Description**: Animation loop - update cube state

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `deltaTime` | `number` | Time since last frame (seconds) |
| `mouseX` | `number` | Mouse X position [-1, 1] |
| `mouseY` | `number` | Mouse Y position [-1, 1] |

**Returns**: `void`

**Example**:
```javascript
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  cube.update(delta, mouse.x, mouse.y);
  renderer.render(scene, camera);
}
```

**Updates**:
- Animation state (idle, listening, thinking, speaking, bouncing)
- Color transitions
- Pupil position
- Blinking
- Shader uniforms

---

#### `startListening()`

**Description**: Enter listening animation state

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
cube.startListening();
```

**Animation**:
- Pulsing scale: 1.0 → 1.05 → 1.0 (1s cycle)
- Enhanced pupil tracking
- Stops blinking

---

#### `stopListening()`

**Description**: Exit listening state, return to idle

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
cube.stopListening();
```

---

#### `startThinking()`

**Description**: Enter thinking animation state

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
cube.startThinking();
```

**Animation**:
- Slow rotation: 0.003 rad/frame
- Reduced blinking (50% normal rate)
- Minimal movement

---

#### `stopThinking()`

**Description**: Exit thinking state, return to idle

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
cube.stopThinking();
```

---

#### `startSpeaking()`

**Description**: Enter speaking animation state

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
cube.startSpeaking();
```

**Animation**:
- Rhythmic nodding: sin(time * 3) * 0.2 on Y-axis
- No blinking
- Static pupil

---

#### `stopSpeaking()`

**Description**: Exit speaking state, return to idle

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
cube.stopSpeaking();
```

---

#### `triggerBounce()`

**Description**: Trigger bounce animation

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
canvas.addEventListener('click', () => {
  cube.triggerBounce();
});
```

**Animation**:
- Elastic bounce with quadratic easing
- Peak height: +0.8 units
- Duration: 0.6 seconds
- Returns to idle after completion

---

#### `getMesh()`

**Description**: Get Three.js mesh object

**Parameters**: None

**Returns**: `THREE.Mesh`

**Example**:
```javascript
const mesh = cube.getMesh();
scene.add(mesh);
```

---

#### `dispose()`

**Description**: Cleanup resources

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
cube.dispose();
```

**Cleanup**:
- Disposes geometry
- Disposes material
- Disposes pupil resources

---

## SceneManager API

**Location**: `src/core/scene.js`

**Purpose**: Three.js scene, camera, renderer, lighting

### Constructor

```javascript
const sceneManager = new SceneManager(container);
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `HTMLElement` | DOM element to append canvas |

**Description**: Creates Three.js scene with camera, renderer, lighting

**Side Effects**:
- Appends canvas to container
- Sets up window resize listener
- Creates shadow plane

---

### Methods

#### `add(object)`

**Description**: Add object to scene

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `object` | `THREE.Object3D` | Three.js object |

**Returns**: `void`

**Example**:
```javascript
const cube = new THREE.Mesh(geometry, material);
sceneManager.add(cube);
```

---

#### `render()`

**Description**: Render current frame

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
function animate() {
  requestAnimationFrame(animate);
  sceneManager.render();
}
```

---

#### `handleResize()`

**Description**: Handle window resize

**Parameters**: None

**Returns**: `void`

**Called Automatically**: On window resize event

**Updates**:
- Camera aspect ratio
- Renderer size
- Maintains pixel ratio

---

#### `updateShadow(cubeYPosition)`

**Description**: Update shadow opacity based on cube height

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `cubeYPosition` | `number` | Cube Y position |

**Returns**: `void`

**Example**:
```javascript
const cubeY = cube.getMesh().position.y;
sceneManager.updateShadow(cubeY);
```

**Formula**:
```javascript
opacity = 0.3 * (1 - (cubeY / 3))
```

Higher cube = lighter shadow

---

#### `dispose()`

**Description**: Cleanup resources

**Parameters**: None

**Returns**: `void`

**Example**:
```javascript
sceneManager.dispose();
```

**Cleanup**:
- Disposes renderer
- Removes canvas
- Removes resize listener

---

## Color System API

**Location**: `src/config/colors.js`

**Purpose**: Color definitions and utilities

### Constants

```javascript
export const COLORS = {
  RED: {
    name: 'RED',
    primary: { r: 194, g: 24, b: 91 },     // #C2185B
    secondary: { r: 233, g: 30, b: 99 }   // #E91E63
  },
  YELLOW: {
    name: 'YELLOW',
    primary: { r: 255, g: 160, b: 0 },    // #FFA000
    secondary: { r: 255, g: 183, b: 77 }  // #FFB74D
  },
  GREEN_BLUE: {
    name: 'GREEN_BLUE',
    primary: { r: 0, g: 137, b: 123 },    // #00897B
    secondary: { r: 38, g: 166, b: 154 } // #26A69A
  },
  ORANGE: {
    name: 'ORANGE',
    primary: { r: 255, g: 111, b: 0 },    // #FF6F00
    secondary: { r: 255, g: 152, b: 0 }  // #FF9800
  }
};
```

### Functions

#### `getColor(colorName)`

**Description**: Get color object by name

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `colorName` | `string` | Color name |

**Returns**: `object | null`

**Example**:
```javascript
const color = getColor('YELLOW');
console.log(color);
// {
//   name: 'YELLOW',
//   primary: { r: 255, g: 160, b: 0 },
//   secondary: { r: 255, g: 183, b: 77 }
// }
```

---

#### `getColorNames()`

**Description**: Get array of all color names

**Parameters**: None

**Returns**: `string[]`

**Example**:
```javascript
const names = getColorNames();
console.log(names);
// ['RED', 'YELLOW', 'GREEN_BLUE', 'ORANGE']
```

---

#### `isValidColor(colorName)`

**Description**: Check if color name is valid

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `colorName` | `string` | Color name to validate |

**Returns**: `boolean`

**Example**:
```javascript
console.log(isValidColor('YELLOW')); // true
console.log(isValidColor('BLUE'));   // false
```

---

## CubiqoApp API

**Location**: `src/main.js`

**Purpose**: Main application orchestrator

### Constructor

```javascript
const app = new CubiqoApp();
```

**Description**: Initializes application

**Side Effects**:
- Creates SceneManager
- Creates Cube
- Sets up UI and input tracking
- Starts animation loop
- Hides loading screen

---

### Methods

*(Methods are internal, not exposed for external use)*

**Key Methods**:
- `init()`: Initialize app
- `setupUI()`: Setup event listeners
- `setupInputTracking()`: Mouse/touch tracking
- `handleVoiceClick()`: Voice button handler
- `handleTranscript(text)`: Process voice input
- `changeCubeColor(color)`: Update cube color
- `animate()`: Animation loop
- `updateFPS(delta)`: FPS calculation
- `dispose()`: Cleanup

---

## Backend API

**Location**: `api/chat/route.js`

**Purpose**: Proxy Claude API requests

### Endpoint

```
POST /api/chat
```

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "systemPrompt": "You are Cubiqo...",
  "messages": [
    {
      "role": "user",
      "content": "[Monday, Oct 22, 2025, 09:30 AM] Hello"
    },
    {
      "role": "assistant",
      "content": "{\"color\":\"ORANGE\",\"response\":\"Hi!\"}"
    }
  ]
}
```

### Response

**Success (200)**:
```json
{
  "id": "msg_123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\"color\":\"YELLOW\",\"response\":\"Hello! How are you?\"}"
    }
  ],
  "model": "claude-sonnet-4-5-20250929",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 30
  }
}
```

**Error (400/500)**:
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Error description"
  }
}
```

### Configuration

**Environment Variables**:
- `ANTHROPIC_API_KEY`: Required

**Function Config**:
```javascript
export const config = {
  runtime: 'nodejs18',
  maxDuration: 30,
  regions: ['iad1']
};
```

**Model Configuration**:
```javascript
{
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  temperature: 0.7,
  system: SYSTEM_PROMPT,
  messages: [...]
}
```

---

## Error Codes

### VoiceService Errors

| Code | Description | Solution |
|------|-------------|----------|
| `'no-speech'` | No speech detected | User didn't speak or too quiet |
| `'audio-capture'` | Microphone not accessible | Check mic connection/settings |
| `'not-allowed'` | Permission denied | Grant microphone permission |
| `'timeout'` | Recognition timeout (10s) | Speak within 10 seconds |
| `'already started'` | Recognition already running | Wait for current recognition to finish |

### AIService Errors

| Status | Description | Solution |
|--------|-------------|----------|
| `400` | Invalid request | Check request format |
| `401` | Invalid API key | Update ANTHROPIC_API_KEY |
| `429` | Rate limit exceeded | Wait and retry |
| `500` | Server error | Retry request |

### MemoryService Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `QuotaExceededError` | localStorage full | Clear old data |
| `SecurityError` | localStorage blocked | Check browser settings |

---

## Type Definitions

### Conversation Object

```typescript
type Conversation = {
  id: string;                // "1697123456789-abc123"
  timestamp: string;         // ISO 8601: "2025-10-22T14:30:45.123Z"
  userMessage: string;       // User's transcript
  aiResponse: string;        // Claude's response
  color: ColorName;          // "RED" | "YELLOW" | "GREEN_BLUE" | "ORANGE"
  sessionId: string;         // "session-1697120000000"
}
```

### Color Object

```typescript
type ColorObject = {
  name: ColorName;
  primary: RGB;
  secondary: RGB;
}

type RGB = {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
}

type ColorName = "RED" | "YELLOW" | "GREEN_BLUE" | "ORANGE";
```

### AI Response

```typescript
type AIResponse = {
  color: ColorName;
  response: string;
}
```

---

**API Version**: 2.3.0
**Last Updated**: October 22, 2025
**Status**: Production
