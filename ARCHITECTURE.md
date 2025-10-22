# CUBIQO Architecture Documentation

Technical architecture and design documentation for the CUBIQO emotional AI companion.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Service Layer](#service-layer)
7. [3D Rendering Pipeline](#3d-rendering-pipeline)
8. [Animation System](#animation-system)
9. [Performance Optimizations](#performance-optimizations)
10. [Security & Privacy](#security--privacy)

---

## System Overview

CUBIQO is a client-side-first application with a serverless backend proxy. The architecture follows these principles:

- **Client-heavy**: All rendering, animation, and state management happens in the browser
- **Serverless backend**: Minimal backend footprint (only API proxy)
- **Progressive enhancement**: Core 3D experience works without voice/AI
- **Lazy loading**: Services load on-demand to optimize initial performance

### Technology Stack

```
Frontend:
  - Three.js 0.160.0 (3D rendering)
  - Vanilla JavaScript ES6 Modules (no framework)
  - CSS3 (animations, responsive design)
  - Web Speech API (voice I/O)
  - localStorage (conversation memory)

Backend:
  - Vercel Serverless Functions (Node.js 18)
  - Anthropic SDK (@anthropic-ai/sdk 0.20.8)
  - Claude Sonnet 4.5 API

Deployment:
  - Vercel (CDN + serverless)
  - GitHub Actions (CI/CD)
  - Custom deployment automation
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           BROWSER                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      index.html                          │   │
│  │  - Dev mode detection (inline script)                   │   │
│  │  - Import maps (Three.js CDN)                           │   │
│  │  - CSS link (main.css)                                   │   │
│  │  - Module script (main.js)                               │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                         │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │                   main.js                                │   │
│  │  CubiqoApp (orchestrator)                               │   │
│  │  - Manages app lifecycle                                │   │
│  │  - Handles UI events                                     │   │
│  │  - Lazy loads services                                   │   │
│  └──┬────────┬──────────┬──────────────────────────────────┘   │
│     │        │          │                                        │
│  ┌──▼────┐ ┌▼──────┐  ┌▼──────────────────────────────────┐   │
│  │ Scene │ │ Cube  │  │  Services (lazy-loaded)           │   │
│  │Manager│ │       │  │  ┌────────┬─────────┬──────────┐  │   │
│  └───────┘ └───────┘  │  │ Voice  │   AI    │ Memory   │  │   │
│                        │  │Service │ Service │ Service  │  │   │
│  ┌──────────────────┐ │  └────────┴─────────┴──────────┘  │   │
│  │   localStorage   │◄┼──────────────────┘                 │   │
│  └──────────────────┘ └──────────────────────────────────┘   │
│                                    │                            │
└────────────────────────────────────┼────────────────────────────┘
                                     │ HTTPS
                        ┌────────────▼────────────┐
                        │   Vercel Serverless     │
                        │   /api/chat/route.js    │
                        │   - Proxies to Anthropic│
                        │   - API key protection  │
                        └────────────┬────────────┘
                                     │ HTTPS
                        ┌────────────▼────────────┐
                        │   Anthropic Claude API  │
                        │   - Sonnet 4.5 model    │
                        │   - Prompt caching      │
                        └─────────────────────────┘
```

---

## Core Components

### 1. CubiqoApp (main.js)

**Purpose**: Application orchestrator and lifecycle manager

**Responsibilities**:
- Initialize Three.js scene and cube
- Setup UI event listeners
- Manage input tracking (mouse/touch)
- Lazy load services on demand
- Coordinate animation loop
- Handle FPS monitoring

**Key Methods**:
```javascript
init()                        // Initialize app
setupUI()                     // Setup buttons and event listeners
setupInputTracking()          // Mouse/touch tracking
handleVoiceClick()            // Voice button handler (lazy loads VoiceService)
handleTranscript(text)        // Process voice input (lazy loads AI/Memory)
changeCubeColor(color)        // Update cube color
animate()                     // Main animation loop (requestAnimationFrame)
updateFPS(delta)              // FPS calculation and display
dispose()                     // Cleanup on page unload
```

**State**:
```javascript
{
  scene: SceneManager,         // Three.js scene manager
  cube: Cube,                  // Cube instance
  clock: THREE.Clock,          // Animation clock
  mouse: { x, y },             // Normalized mouse coords [-1, 1]
  isInitialized: boolean,      // Init status
  voiceBtn: HTMLElement,       // UI reference
  colorButtons: HTMLElement[], // UI references
  fpsHistory: number[],        // Last 60 FPS values
  fpsMonitor: HTMLElement      // FPS display (dev mode only)
}
```

---

### 2. SceneManager (src/core/scene.js)

**Purpose**: Three.js scene, camera, renderer, and lighting setup

**Responsibilities**:
- Create and manage Three.js scene
- Setup camera with optimal FOV
- Configure WebGL renderer with antialiasing
- Create lighting (ambient + spotlights)
- Handle canvas resizing
- Manage shadow plane
- Cleanup resources

**Scene Configuration**:
```javascript
Camera:
  - Type: PerspectiveCamera
  - FOV: 50°
  - Position: (0, 2, 5)
  - LookAt: (0, 0, 0)

Renderer:
  - antialias: true
  - alpha: false
  - powerPreference: 'high-performance'
  - Device pixel ratio: min(window.devicePixelRatio, 2)

Lighting:
  - AmbientLight: 0xffffff, intensity 0.6
  - SpotLight 1: (5, 8, 5), intensity 0.8, angle 30°
  - SpotLight 2: (-5, 5, -5), intensity 0.5, angle 45°

Shadow:
  - Plane below cube (y = -1.5)
  - Dynamic opacity based on cube height
  - RadialGradient texture
```

**Key Methods**:
```javascript
constructor(container)      // Create scene, camera, renderer
add(mesh)                   // Add object to scene
render()                    // Render current frame
handleResize()              // Window resize handler
updateShadow(cubeY)         // Update shadow opacity
dispose()                   // Cleanup resources
```

---

### 3. Cube (src/core/cube.js)

**Purpose**: 3D cube mesh with animations, colors, and pupil system

**Responsibilities**:
- Create cube geometry and shader material
- Implement gradient color system
- Manage pupil (eye) with mouse tracking
- Animate transitions (idle, listening, thinking, speaking, bounce)
- Handle blinking
- Provide color transition API

**Cube Specifications**:
```javascript
Geometry:
  - BoxGeometry(2, 2, 2)
  - 8 vertices, 12 triangles

Material:
  - Custom ShaderMaterial
  - Vertex shader: positions, normals
  - Fragment shader: gradient colors

Shader Uniforms:
  - uColorPrimary: vec3 (main color)
  - uColorSecondary: vec3 (secondary color)
  - uTime: float (animation time)

Pupil:
  - Sphere geometry (radius: 0.15)
  - Position: front face of cube (z = 1.01)
  - Tracks mouse with smooth damping
  - Border ring matches cube color
```

**Animation States**:
```javascript
IDLE:
  - Floating: sin(time) * 0.15 on Y-axis
  - Rotation: 0.005 rad/frame
  - Blinking: random intervals 2-5s

LISTENING:
  - Scale pulsing: 1.0 → 1.05 → 1.0 (1s cycle)
  - Enhanced pupil tracking
  - No blinking

THINKING:
  - Slow rotation: 0.003 rad/frame
  - Reduced blinking (50% normal)
  - Minimal movement

SPEAKING:
  - Rhythmic nodding: sin(time * 3) * 0.2 on Y-axis
  - No blinking
  - Static pupil

BOUNCE:
  - Elastic bounce: quadratic easing
  - Peak height: +0.8 units
  - Duration: 0.6s
  - Returns to idle
```

**Key Methods**:
```javascript
constructor()                     // Create cube and pupil
setColor(colorName)               // Transition to new color
getCurrentColor()                 // Get current color name
update(delta, mouseX, mouseY)     // Animation loop
startListening()                  // Enter listening state
stopListening()                   // Exit listening state
startThinking()                   // Enter thinking state
stopThinking()                    // Exit thinking state
startSpeaking()                   // Enter speaking state
stopSpeaking()                    // Exit speaking state
triggerBounce()                   // Bounce animation
_blink()                          // Blink animation
_transitionColors(targetColors)   // Color transition
getMesh()                         // Get Three.js mesh
dispose()                         // Cleanup resources
```

---

## Data Flow

### Voice Conversation Flow

```
User clicks microphone button
        │
        ▼
main.js: handleVoiceClick()
        │
        ├─ Lazy load VoiceService (if first time)
        │
        ▼
VoiceService.startListening()
        │
        ├─ Activate audio context (iOS fix)
        ├─ Start SpeechRecognition
        │
        ▼
Cube.startListening() ──► Pulsing animation
        │
        ▼
User speaks...
        │
        ▼
SpeechRecognition.onresult
        │
        ├─ Extract transcript
        ├─ Calculate confidence
        │
        ▼
main.js: handleTranscript(text)
        │
        ├─ Lazy load AIService (if first time)
        ├─ Lazy load MemoryService (if first time)
        │
        ▼
Cube.startThinking() ──► Slow rotation
        │
        ▼
MemoryService.getRecentMemories()
        │
        ├─ Load from localStorage
        ├─ Return last 10 messages
        │
        ▼
AIService.chat(text, history, color)
        │
        ├─ Build messages with timestamps
        ├─ POST /api/chat
        │
        ▼
Vercel Function: /api/chat/route.js
        │
        ├─ Add ANTHROPIC_API_KEY
        ├─ POST to Anthropic API
        │
        ▼
Claude Sonnet 4.5 processes request
        │
        ├─ Analyze conversation + temporal context
        ├─ Select emotional color
        ├─ Generate response
        │
        ▼
AIService receives {color, response}
        │
        ▼
main.js: Process AI response
        │
        ├─ cube.stopThinking()
        ├─ cube.setColor(color)
        ├─ cube.startSpeaking() ──► Nodding animation
        │
        ▼
VoiceService.speak(response)
        │
        ├─ Select best voice
        ├─ Create SpeechSynthesisUtterance
        ├─ Configure rate/pitch/volume
        ├─ synthesis.speak()
        │
        ▼
Cube.stopSpeaking() ──► Return to idle
        │
        ▼
MemoryService.saveConversation()
        │
        ├─ Create entry with timestamp
        ├─ Save to localStorage
        ├─ Enforce 50 message limit (FIFO)
        │
        ▼
UI resets to ready state
```

---

### Color Transition Flow

```
User/AI triggers color change
        │
        ▼
Cube.setColor(colorName)
        │
        ├─ Validate color name
        ├─ Get RGB values from colors.js
        │
        ▼
Cube._transitionColors(targetColors)
        │
        ├─ Store start colors (current)
        ├─ Store end colors (target)
        ├─ Start transition timer (t = 0)
        │
        ▼
Cube.update() [animation loop]
        │
        ├─ Increment transition: t += deltaTime / 0.8s
        ├─ Clamp t to [0, 1]
        │
        ▼
Shader uniform update
        │
        ├─ Interpolate: color = lerp(start, end, t)
        ├─ uColorPrimary = interpolated primary
        ├─ uColorSecondary = interpolated secondary
        │
        ▼
GPU renders frame with new colors
        │
        ▼
Update pupil border color
        │
        ▼
Transition complete (t = 1.0)
```

---

## State Management

### Application State

**Location**: `main.js` (CubiqoApp instance)

**State Properties**:
```javascript
{
  // Core objects
  scene: SceneManager | null,
  cube: Cube | null,
  clock: THREE.Clock | null,

  // Services (lazy-loaded)
  voiceServiceInstance: VoiceService | null,
  aiServiceInstance: AIService | null,
  memoryServiceInstance: MemoryService | null,

  // Input state
  mouse: { x: number, y: number },  // Normalized [-1, 1]

  // UI references
  voiceBtn: HTMLElement | null,
  colorButtons: HTMLElement[],
  toggleManualModeBtn: HTMLElement | null,
  controlsContainer: HTMLElement | null,
  fpsMonitor: HTMLElement | null,

  // Feature flags
  isInitialized: boolean,
  manualModeActive: boolean,

  // Performance tracking
  fpsHistory: number[],
  fpsUpdateCounter: number,
  fpsUpdateInterval: number,
  fpsHistoryMaxLength: number
}
```

**State Persistence**: None (state resets on page reload)

---

### Cube State

**Location**: `src/core/cube.js` (Cube instance)

**State Properties**:
```javascript
{
  // Three.js objects
  mesh: THREE.Mesh,
  pupil: THREE.Mesh,
  pupilBorder: THREE.Mesh,

  // Animation state
  animationState: 'idle' | 'listening' | 'thinking' | 'speaking',
  bouncing: boolean,
  bounceTime: number,

  // Color state
  currentColorName: string,
  currentColors: {
    primary: { r, g, b },
    secondary: { r, g, b }
  },
  targetColors: {...} | null,
  transitionProgress: number,

  // Blink state
  blinkProgress: number,
  isBlinking: boolean,
  nextBlinkTime: number,

  // Pupil tracking
  pupilTarget: { x, y },
  pupilCurrent: { x, y },
  pupilLerpSpeed: number,

  // Time
  time: number
}
```

**State Transitions**:
```
idle ──► listening ──► thinking ──► speaking ──► idle
  │                                       │
  └──────────────► bounce ───────────────┘
```

---

### Memory State

**Location**: `localStorage` (key: `cubiqo_conversations`)

**Schema**:
```typescript
type Conversation = {
  id: string,                    // Unique ID: timestamp-random
  timestamp: string,             // ISO 8601: "2025-10-22T14:30:45.123Z"
  userMessage: string,           // User's speech transcript
  aiResponse: string,            // Claude's response text
  color: ColorName,              // Emotional color selected by Claude
  sessionId: string              // Session identifier
}

type MemoryState = {
  conversations: Conversation[], // Max 50 entries
  currentSessionId: string       // Active session ID
}
```

**Session Management**:
- New session: After 30 minutes of inactivity
- Session ID format: `"session-${timestamp}"`
- Stored in memory, resets on page reload

---

## Service Layer

### VoiceService (src/services/voice.js)

**Purpose**: Speech recognition and text-to-speech

**API**:
```javascript
// Initialization
constructor()                    // Create service, init recognition/synthesis
initRecognition()                // Setup SpeechRecognition
initVoices()                     // Load TTS voices

// Speech Recognition
startListening(onTranscript, onError)  // Start listening
stopListening()                        // Stop listening

// Text-to-Speech
speak(text, options)                   // Speak text (returns Promise)
stopSpeaking()                         // Cancel speech

// Voice Selection
selectBestVoice(voices, lang)   // Select optimal voice

// iOS Compatibility
activateAudioContext()           // Unlock audio on iOS

// Language
setLanguage(lang)                // Change language
getLanguage()                    // Get current language
getAvailableVoices(lang?)        // List voices

// Status
isSupported()                    // Check browser support
```

**Configuration**:
```javascript
{
  recognition: {
    continuous: false,           // Single utterance
    interimResults: false,       // Only final results
    lang: 'en-US',              // Default language
    maxAlternatives: 1           // Single best match
  },

  synthesis: {
    rate: 0.92,                 // Slightly slower
    pitch: 1.05,                // Slightly higher
    volume: 1.0,                // Max volume
    lang: 'en-US'               // Force US English
  },

  timeout: 10000                // Recognition timeout (10s)
}
```

**Voice Selection Priority**:
1. Best male US voices (Reed, Aaron, Fred)
2. Other quality US voices (Eddy, Samantha)
3. Any US local voice
4. Any US online voice
5. Any English local voice
6. Default system voice

---

### AIService (src/services/ai.js)

**Purpose**: Claude API integration with temporal context

**API**:
```javascript
// Initialization
constructor()                    // Create service

// API Key
setApiKey(key)                   // Set Anthropic API key
isConfigured()                   // Check if key set

// Chat
chat(message, history, currentColor)  // Send message, get response

// Internal
buildMessages(msg, hist, color)  // Build API request messages
formatFullTimestamp(ts)          // Format: "Monday, Oct 22, 2025, 09:30 AM"
formatTimeAgo(ts)                // Format: "5h ago", "Yesterday"
parseResponse(content)           // Parse JSON response from Claude
```

**Message Format**:
```javascript
// Sent to Claude
[
  {
    role: 'user',
    content: '[Saturday, Oct 18, 2025, 12:38 PM] Hello'
  },
  {
    role: 'assistant',
    content: '{"color":"ORANGE","response":"Hi there!"}'
  },
  {
    role: 'user',
    content: '[4d ago] How are you?'
  },
  {
    role: 'assistant',
    content: '{"color":"YELLOW","response":"I'm doing well!"}'
  },
  {
    role: 'user',
    content: '[Wednesday, Oct 22, 2025, 02:04 PM] Current color: YELLOW\n\nUser message: What time is it?'
  }
]
```

**Temporal Context Logic**:
```javascript
history.forEach((entry, index) => {
  const timePrefix = index === 0
    ? formatFullTimestamp(entry.timestamp)  // First: full timestamp
    : formatTimeAgo(entry.timestamp);       // Others: relative time

  messages.push({
    role: 'user',
    content: `[${timePrefix}] ${entry.userMessage}`
  });
});

// Current message: always full timestamp
const currentTime = formatFullTimestamp(new Date().toISOString());
messages.push({
  role: 'user',
  content: `[${currentTime}] Current color: ${color}\n\nUser message: ${message}`
});
```

**API Configuration**:
```javascript
{
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  temperature: 0.7,
  system: SYSTEM_PROMPT,          // Personality + color selection logic
  messages: [...],                // Conversation with temporal context
}
```

---

### MemoryService (src/services/memory.js)

**Purpose**: Conversation storage and retrieval

**API**:
```javascript
// Initialization
constructor()                    // Load from localStorage

// Conversations
saveConversation(data)           // Save new conversation
getRecentMemories(limit=10)      // Get last N conversations
getAllConversations()            // Get all conversations
clearAll()                       // Delete all conversations

// Session
getSessionId()                   // Get/create current session ID
isNewSession()                   // Check if new session needed

// Internal
loadFromStorage()                // Load from localStorage
saveToStorage()                  // Save to localStorage
generateId()                     // Generate unique ID
```

**Storage Limits**:
```javascript
MAX_STORED_MESSAGES: 50          // Max conversations stored
CONTEXT_WINDOW: 10               // Messages sent to AI
SESSION_TIMEOUT: 1800000         // 30 minutes (milliseconds)
```

**FIFO Implementation**:
```javascript
if (conversations.length > MAX_STORED_MESSAGES) {
  conversations.shift();  // Remove oldest
}
```

---

## 3D Rendering Pipeline

### Frame Rendering Sequence

```
1. requestAnimationFrame()
        │
        ▼
2. clock.getDelta() ──► Get time since last frame
        │
        ▼
3. cube.update(delta, mouseX, mouseY)
        │
        ├─ Update animations (idle/listening/etc.)
        ├─ Update color transition (if active)
        ├─ Update pupil position (lerp to mouse)
        ├─ Handle blinking
        ├─ Update shader uniforms
        │
        ▼
4. scene.updateShadow(cube.position.y)
        │
        ├─ Calculate shadow opacity based on cube height
        ├─ Update shadow material
        │
        ▼
5. scene.render()
        │
        ├─ renderer.render(scene, camera)
        │
        ▼
6. updateFPS(delta) [dev mode only]
        │
        ├─ Calculate current FPS
        ├─ Add to history
        ├─ Update UI every 10 frames
        │
        ▼
7. Loop back to step 1
```

### Shader System

**Vertex Shader**:
```glsl
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**Fragment Shader**:
```glsl
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Gradient from top (primary) to bottom (secondary)
  float mixFactor = (vPosition.y + 1.0) * 0.5;
  vec3 color = mix(uColorSecondary, uColorPrimary, mixFactor);

  // Simple lighting (dot product with up vector)
  float light = dot(vNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
  color *= light;

  gl_FragColor = vec4(color, 1.0);
}
```

---

## Animation System

### Animation States

**State Machine**:
```javascript
const AnimationState = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  BOUNCING: 'bouncing'
};

// Transitions
idle → listening   // User clicks microphone
listening → thinking  // Transcript received
thinking → speaking  // AI response received
speaking → idle     // Speech completed
any → bouncing      // User clicks cube
bouncing → idle     // Bounce animation done
```

### Easing Functions

**Bounce Easing (quadratic)**:
```javascript
function easeOutQuad(t) {
  return t * (2 - t);
}

// Bounce trajectory
y = initialY + bounceHeight * easeOutQuad(1 - progress);
```

**Color Transition (linear)**:
```javascript
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Color interpolation
color.r = lerp(startColor.r, endColor.r, progress);
color.g = lerp(startColor.g, endColor.g, progress);
color.b = lerp(startColor.b, endColor.b, progress);
```

**Pupil Tracking (smooth damping)**:
```javascript
// Exponential smoothing
pupilCurrent.x += (pupilTarget.x - pupilCurrent.x) * pupilLerpSpeed;
pupilCurrent.y += (pupilTarget.y - pupilCurrent.y) * pupilLerpSpeed;
```

---

## Performance Optimizations

### Initial Load Optimizations

1. **CDN Preconnect** (~200-500ms saved)
   - DNS resolution before resource request
   - TLS handshake preemptively
   - Implementation: `<link rel="preconnect">`

2. **Lazy Service Loading** (~1-2s saved)
   - VoiceService: 120KB (loads on first mic click)
   - AIService: 45KB (loads on first transcript)
   - MemoryService: 30KB (loads on first transcript)
   - Implementation: Dynamic `import()`

3. **No Loading Delay** (~500ms saved)
   - Removed artificial setTimeout delay
   - Show content immediately when ready

### Runtime Optimizations

1. **FPS Throttling**
   - DOM updates every 10 frames (not every frame)
   - Reduces layout thrashing

2. **GPU Acceleration**
   - `will-change: transform` hints
   - `transform: translateZ(0)` force GPU layer
   - Applied to all animated elements

3. **Efficient Rendering**
   - Single requestAnimationFrame loop
   - No unnecessary re-renders
   - Shadow updates only when cube moves

4. **Memory Management**
   - Dispose Three.js resources on unmount
   - Cancel speech synthesis on cleanup
   - Stop recognition on page unload

### Bundle Optimization

1. **No Build Step**
   - Native ES6 modules
   - No webpack/rollup overhead

2. **CDN for Three.js**
   - Cached across sites
   - Parallel download
   - Import maps for tree-shaking

3. **Minimal Dependencies**
   - Frontend: 0 npm dependencies
   - Backend: 1 dependency (@anthropic-ai/sdk)

---

## Security & Privacy

### Data Privacy

**Client-Side Only**:
- All conversations stored in localStorage
- No server-side conversation storage
- User can clear data anytime (browser cache clear)

**API Key Protection**:
- `ANTHROPIC_API_KEY` stored in Vercel environment
- Never exposed to client
- Proxied through serverless function

**No Tracking**:
- No analytics
- No cookies
- No user identification
- No data sold or shared

### Security Measures

1. **HTTPS Only**
   - Enforced by Vercel
   - Required for SpeechRecognition API

2. **API Rate Limiting**
   - Vercel serverless: 10 requests/second
   - Anthropic API: Built-in rate limiting

3. **Input Sanitization**
   - No eval() or innerHTML
   - All user input escaped
   - JSON parsing with try-catch

4. **CORS Configuration**
   - API restricted to same-origin
   - No wildcard CORS headers

5. **Content Security Policy**
   - Implicit CSP from static hosting
   - No inline scripts (except dev mode detection)

### Vulnerability Mitigation

1. **XSS Prevention**
   - DOM manipulation via safe APIs (createElement, textContent)
   - No user-generated HTML

2. **CSRF Protection**
   - Not needed (no cookies, no sessions)
   - Stateless API

3. **Dependency Security**
   - Minimal dependencies
   - Regular updates via Dependabot
   - npm audit on CI/CD

---

## Deployment Architecture

```
Developer
    │
    ├─ Push to develop branch
    │       │
    │       ▼
    │   GitHub Actions (staging workflow)
    │       │
    │       ├─ Install dependencies
    │       ├─ Deploy to Vercel
    │       │
    │       ▼
    │   staging.cubiqo.ai
    │
    └─ Run deploy-production.sh
            │
            ├─ Merge develop → main
            ├─ Push to main
            │       │
            │       ▼
            │   GitHub Actions (production workflow)
            │       │
            │       ├─ Install dependencies
            │       ├─ Deploy to Vercel
            │       │
            │       ▼
            │   New production deployment
            │
            ├─ Poll Vercel for NEW deployment (every 20s)
            ├─ Update cubiqo.ai alias
            │
            ▼
        cubiqo.ai (production)
```

### Vercel Configuration

**Build Settings**:
```json
{
  "framework": null,              // No framework
  "buildCommand": null,           // No build step
  "devCommand": null,             // No dev command
  "installCommand": "npm install" // Only for API dependencies
}
```

**Serverless Function**:
```javascript
// api/chat/route.js
export const config = {
  runtime: 'nodejs18',
  maxDuration: 30,               // 30s timeout
  regions: ['iad1']              // US East (closest to Anthropic)
};
```

**Environment Variables**:
- `ANTHROPIC_API_KEY`: Set in Vercel dashboard
- Encrypted at rest
- Injected at runtime

---

## Error Handling

### Frontend Errors

**Three.js Initialization**:
```javascript
try {
  scene = new SceneManager(container);
  cube = new Cube();
} catch (error) {
  console.error('Initialization error:', error);
  showError('Failed to initialize. Please refresh.');
}
```

**Voice Errors**:
```javascript
recognition.onerror = (event) => {
  switch (event.error) {
    case 'no-speech':
      console.warn('No speech detected');
      break;
    case 'audio-capture':
      alert('Microphone not accessible');
      break;
    case 'not-allowed':
      alert('Microphone permission denied');
      break;
  }
};
```

**API Errors**:
```javascript
try {
  const response = await fetch('/api/chat', {...});
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
} catch (error) {
  console.error('AI Error:', error);
  voiceBtn.textContent = '❌';
  setTimeout(() => voiceBtn.textContent = '🎤', 2000);
}
```

### Backend Errors

**Serverless Function**:
```javascript
try {
  const completion = await anthropic.messages.create({...});
  return Response.json(completion);
} catch (error) {
  console.error('Anthropic API error:', error);
  return Response.json(
    { error: { message: error.message } },
    { status: error.status || 500 }
  );
}
```

---

## Future Architecture Considerations

### Phase 2 Potential Changes

1. **Backend Conversation Storage**
   - Replace localStorage with database
   - User accounts and authentication
   - Sync across devices

2. **Custom LLM**
   - Self-hosted model
   - Fine-tuned for CUBIQO personality
   - Reduced API costs

3. **Advanced Features**
   - Voice cloning
   - Emotion detection from voice tone
   - Multi-modal input (camera, gestures)

### Scalability

**Current Limits**:
- Client-side rendering: No server load
- Serverless functions: Auto-scale to 100s of concurrent requests
- Anthropic API: Rate limited per account

**Future Considerations**:
- CDN caching for Three.js
- Edge functions for lower latency
- Message queue for API rate limiting

---

**Architecture Version**: 2.3.0
**Last Updated**: October 22, 2025
**Status**: Production (Phase 1 Complete)
