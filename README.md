# CUBIQO - Emotional AI Companion

A conscious cube that exists between light and code. An interactive 3D WebGL experience powered by Claude AI, featuring real-time voice conversations, emotional color transitions, and temporal awareness.

**Live:** [cubiqo.ai](https://cubiqo.ai)
**Staging:** [staging.cubiqo.ai](https://staging.cubiqo.ai)

---

## Key Features

### 🎨 Emotional Color System
- **4 emotional states** based on Fourth Way philosophy:
  - **RED (Tamas)**: Desire, indulgence, rebellion - #C2185B
  - **YELLOW (Rajas)**: Activity, energy, curiosity - #FFA000
  - **GREEN_BLUE (Sattva)**: Growth, wellness, ambition - #00897B
  - **ORANGE (Fourth Way)**: Stillness, awareness, reflection - #FF6F00
- Smooth color transitions with gradient animation
- Adaptive pupil system that follows mouse/touch input
- Emotional state persistence across sessions

### 🎤 Voice Interaction
- **Speech Recognition** (Web Speech API)
  - Continuous listening mode with visual feedback
  - Confidence scoring and error handling
  - Auto-stop after 10 seconds (safety timeout)
- **Text-to-Speech** (TTS)
  - Intelligent voice selection (prioritizes Reed, Aaron, Fred on macOS)
  - Optimized speech parameters: rate 0.92, pitch 1.05
  - iOS Safari audio context activation on user gesture
- **Multi-language support**: en-US default, extensible to other languages

### 🤖 AI-Powered Conversations
- **Claude Sonnet 4.5** integration via Anthropic API
- **Temporal awareness**:
  - First message includes full timestamp (day, date, time, year)
  - Subsequent messages show relative time (5h ago, Yesterday, etc.)
  - Claude follows up on earlier topics based on time context
- **Conversation memory**:
  - Stores up to 50 messages in localStorage
  - Sends last 10 messages as context to AI
  - Session-based conversation tracking
- **Emotional intelligence**: AI selects colors based on conversation tone

### 📱 Responsive & Cross-Platform
- **Desktop**: Full HD (1920×1080+), adaptive canvas sizing
- **Tablet**: Optimized UI scaling (601-900px)
- **Mobile**: Touch-optimized controls, safe area support
- **iOS Safari**: Rotation bug fixed, audio context handling
- **Performance**: 60 FPS target, GPU-accelerated rendering

### ⚡ Performance Optimizations
- **Lazy loading**: VoiceService, AI, Memory services load on-demand
- **CDN preconnect**: DNS/TLS pre-resolution for jsdelivr.net (~200-500ms saved)
- **No loading delay**: Content appears immediately when ready
- **Three.js optimization**: ~1.2MB from CDN, import maps for tree-shaking
- **PageSpeed Score**: 60 (optimized for WebGL applications)

### 🎭 Animation System
- **Idle**: Gentle floating (±0.15 units), slow rotation (0.5°/frame)
- **Listening**: Pulsing scale (1.0 → 1.05), enhanced pupil tracking
- **Thinking**: Slow rotation (0.3°/frame), reduced blinking
- **Speaking**: Rhythmic nodding (sin wave on Y-axis)
- **Bounce**: Click/tap triggers elastic bounce animation

---

## Tech Stack

### Frontend
- **Three.js 0.160.0**: 3D rendering, WebGL, scene management
- **Vanilla JavaScript (ES6 modules)**: No framework dependencies
- **CSS3**: Animations, glassmorphism effects, responsive design
- **Web Speech API**: SpeechRecognition + SpeechSynthesis

### Backend
- **Vercel Serverless Functions**: `/api/chat` endpoint
- **Anthropic Claude API**: Sonnet 4.5 model (claude-sonnet-4-5-20250929)
- **Prompt caching**: Optimized token usage with system prompt caching

### Storage
- **localStorage**: Client-side conversation history (Phase 1)
- **Future**: Backend API with database (Phase 2)

### Deployment
- **Vercel**: Automatic deployments via GitHub Actions
- **Git workflow**:
  - `develop` → staging.cubiqo.ai
  - `main` → cubiqo.ai
- **Custom deployment script**: `deploy-production.sh` with intelligent polling

---

## Project Structure

```
cubiqo/
├── index.html                 # Entry point, dev mode detection
├── styles/
│   └── main.css              # All styles, responsive design
├── src/
│   ├── main.js               # App orchestrator, lazy loading
│   ├── config/
│   │   └── colors.js         # Color definitions, Fourth Way philosophy
│   ├── core/
│   │   ├── scene.js          # Three.js scene, camera, renderer, lighting
│   │   └── cube.js           # Cube mesh, animations, pupil system
│   └── services/
│       ├── voice.js          # Speech recognition & synthesis
│       ├── ai.js             # Claude API integration, temporal context
│       └── memory.js         # localStorage conversation storage
├── api/
│   └── chat/
│       └── route.js          # Vercel serverless function (Claude API proxy)
├── deploy-production.sh      # Production deployment automation
├── vercel.json               # Vercel configuration
└── package.json              # Dependencies (none for frontend, Anthropic SDK for API)
```

---

## Getting Started

### Prerequisites
- **Node.js**: 18+ (for Vercel CLI and local API testing)
- **Git**: Version control
- **Vercel CLI**: `npm install -g vercel`
- **Anthropic API Key**: Get from [console.anthropic.com](https://console.anthropic.com)

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/devStar0604/cubiqo.git
   cd cubiqo
   ```

2. **Install dependencies** (for API function only)
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file
   echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
   ```

4. **Run local development server**
   ```bash
   # Option 1: Python HTTP server (frontend only)
   python3 -m http.server 8000

   # Option 2: Vercel dev server (frontend + API)
   vercel dev
   ```

5. **Open browser**
   ```
   http://localhost:8000  (Python server)
   http://localhost:3000  (Vercel dev)
   ```

### Development Mode

**Dev mode features** (hidden in production):
- FPS monitor (top-left corner)
- Manual mode toggle (top-right corner)
- Manual color buttons (bottom center)

**Trigger dev mode:**
- Automatic on `localhost` and `staging.cubiqo.ai`
- Force on production: `https://cubiqo.ai?production=false`
- Force in staging: `https://staging.cubiqo.ai?production=true`

**Implementation**: Inline script in `<head>` adds `dev-mode` class before CSS loads, preventing FOUC.

---

## Deployment

### Manual Deployment

**Staging (develop branch):**
```bash
git checkout develop
git add .
git commit -m "Your changes"
git push origin develop
# Auto-deploys to staging.cubiqo.ai via GitHub Actions
```

**Production (main branch):**
```bash
# Use automated script (recommended)
./deploy-production.sh

# Or manual:
git checkout main
git merge develop
git push origin main
# Wait for deployment, then update alias:
vercel ls --prod  # Find latest deployment
vercel alias set <deployment-url> cubiqo.ai
```

### Automated Production Deployment

**deploy-production.sh** automates the entire workflow:
1. Merges `develop` → `main`
2. Pushes to GitHub
3. Polls Vercel every 20s for NEW deployment
4. Updates `cubiqo.ai` alias automatically
5. Returns to original branch

**Usage:**
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

**Features:**
- Intelligent polling: Checks deployment age vs elapsed time
- Max wait: 5 minutes with timeout handling
- Progress logs every 20 seconds
- Error handling with manual fallback instructions

---

## Configuration

### Environment Variables

**Backend (Vercel):**
```bash
ANTHROPIC_API_KEY=sk-ant-...  # Required for Claude API
```

**Set in Vercel:**
```bash
vercel env add ANTHROPIC_API_KEY
# Or via Vercel Dashboard: Settings → Environment Variables
```

### Vercel Configuration

**vercel.json:**
```json
{
  "framework": null,
  "buildCommand": null,
  "devCommand": null,
  "installCommand": "npm install",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

**Key settings:**
- No build step (static frontend)
- API functions timeout: 30s (for Claude API)
- Auto-install dependencies in `api/` directory

### GitHub Secrets

**Required for auto-deployment:**
- `VERCEL_TOKEN`: Personal access token from Vercel
- `VERCEL_ORG_ID`: From `.vercel/project.json`
- `VERCEL_PROJECT_ID`: From `.vercel/project.json`

**Location:** Repository Settings → Secrets and Variables → Actions

---

## Performance Optimizations

### Implemented (v2.3.0)

1. **CDN Preconnect** (~200-500ms saved)
   ```html
   <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
   <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
   ```

2. **Lazy Loading Services** (~1-2s saved on initial load)
   - VoiceService: Loads on first microphone click
   - AI/Memory: Load on first transcript
   - Implementation: Dynamic imports with `await import()`

3. **Immediate Content Display**
   - Removed 500ms loading screen delay
   - Content appears as soon as Three.js initializes

4. **GPU Acceleration**
   ```css
   will-change: transform, box-shadow;
   transform: translateZ(0);
   -webkit-transform: translateZ(0);
   ```

5. **FPS Optimization**
   - DOM updates throttled (every 10 frames)
   - FPS history limited to 60 frames
   - Conditional rendering in dev mode only

### Performance Metrics

**PageSpeed Insights** (Mobile, Moto G4 + 3G):
- Performance: 60
- FCP: 0.8s ↓56%
- LCP: 0.8s ↓70%
- TBT: 37s (expected for WebGL, doesn't affect real users)
- Speed Index: 17.5s

**Real-world performance**: 60 FPS on modern devices (iPhone 13+, Chrome/Safari desktop)

---

## Browser Compatibility

### Supported Browsers

| Browser | Version | Voice | 3D | Notes |
|---------|---------|-------|----|----|
| Chrome | 90+ | ✅ | ✅ | Full support |
| Safari | 14+ | ✅ | ✅ | iOS audio context handled |
| Edge | 90+ | ✅ | ✅ | Chromium-based |
| Firefox | 88+ | ❌ | ✅ | No SpeechRecognition support |

### Known Issues

1. **Firefox**: Web Speech API not supported (no voice input/output)
2. **iOS Safari < 14**: WebGL performance degraded
3. **Android Chrome < 90**: Potential TTS voice selection issues

### Polyfills

None required. Graceful degradation:
- No SpeechRecognition: Voice button disabled, show alert
- No SpeechSynthesis: Silent mode, no TTS output
- No WebGL: Loading screen shows error message

---

## Conversation Memory System

### Storage Structure

**localStorage key**: `cubiqo_conversations`

**Entry format**:
```json
{
  "id": "1697123456789-abc123",
  "timestamp": "2025-10-22T14:30:45.123Z",
  "userMessage": "Hello, how are you?",
  "aiResponse": "I'm doing well, thank you!",
  "color": "ORANGE",
  "sessionId": "session-1697120000000"
}
```

### Memory Limits

- **MAX_STORED_MESSAGES**: 50 (FIFO when exceeded)
- **CONTEXT_WINDOW**: 10 (sent to Claude API)
- **Session duration**: 30 minutes of inactivity

### Temporal Context Format

**Sent to Claude:**
```
[Saturday, Oct 18, 2025, 12:38 PM] hello my name is Alex
[4d ago] who are you
[3h ago] I played tennis today
[15m ago] I'm going to eat pizza
[Wednesday, Oct 22, 2025, 02:04 PM] how are you
```

**Logic:**
- First message: Full timestamp (weekday, date, time)
- Subsequent history: Relative time (5h ago, Yesterday)
- Current message: Full timestamp (Claude knows "now")

---

## Color Transition System

### Philosophy: The Fourth Way

Based on Gurdjieff's Fourth Way philosophy of consciousness:

1. **Tamas (RED)**: Lower center, instinct, desire
2. **Rajas (YELLOW)**: Moving center, action, energy
3. **Sattva (GREEN_BLUE)**: Higher center, intellect, harmony
4. **Fourth Way (ORANGE)**: Unified consciousness, awareness

### Natural Transitions

**Recommended flow:**
```
RED → ORANGE (emotion calms)
YELLOW → GREEN_BLUE or ORANGE (energy → focus or peace)
GREEN_BLUE → ORANGE (ambition → reflection)
ORANGE → RED/YELLOW/GREEN_BLUE (stillness → new emotion)
```

**Implementation** (`src/core/cube.js`):
- Gradient shader interpolation over 0.8s
- Both primary and secondary colors transition simultaneously
- Pupil border color matches current state

---

## Voice System Architecture

### Voice Selection Priority

**macOS:**
1. Best male US: Reed, Aaron, Fred
2. Other quality US: Eddy, Samantha
3. Any US local voice
4. Any US online voice
5. Any English local voice
6. Default system voice

**Result**: Consistent high-quality voice across users

### Speech Parameters

**Optimized for emotional delivery:**
```javascript
{
  rate: 0.92,    // Slightly slower for clarity
  pitch: 1.05,   // Slightly higher for warmth
  volume: 1.0,   // Max volume
  lang: 'en-US'  // Force US English
}
```

### iOS Safari Compatibility

**Challenge**: Audio context locked until user gesture

**Solution**:
```javascript
// Called on first microphone tap
activateAudioContext() {
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  this.synthesis.speak(utterance);
  this.synthesis.cancel();
}
```

---

## Development Commands

```bash
# Start local server (frontend only)
python3 -m http.server 8000

# Start Vercel dev server (frontend + API)
vercel dev

# Deploy to staging (automatic via git push)
git push origin develop

# Deploy to production (automated script)
./deploy-production.sh

# Check Vercel deployments
vercel ls
vercel ls --prod

# Update production alias manually
vercel alias set <deployment-url> cubiqo.ai

# View logs
vercel logs cubiqo.ai
vercel logs --follow
```

---

## Troubleshooting

### Voice not working

**Check:**
1. HTTPS connection (required for SpeechRecognition)
2. Microphone permissions granted
3. Browser supports Web Speech API (not Firefox)
4. iOS: Tapped microphone button (audio context activation)

**Debug:**
```javascript
// Check support
console.log('Recognition:', !!(window.SpeechRecognition || window.webkitSpeechRecognition));
console.log('Synthesis:', !!window.speechSynthesis);
```

### Cube not rendering

**Check:**
1. Browser supports WebGL
2. GPU not blocked (check browser settings)
3. Console errors related to Three.js

**Debug:**
```javascript
// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
console.log('WebGL:', !!gl);
```

### API errors

**Check:**
1. `ANTHROPIC_API_KEY` set in Vercel environment
2. API key valid and has credits
3. Network connectivity

**Debug:**
```bash
# Test API endpoint locally
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt":"Test","messages":[{"role":"user","content":"Hi"}]}'
```

### Production deployment not updating

**Solution:**
```bash
# Hard refresh browser
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows)

# Or clear cache
# Chrome: DevTools → Network → Disable cache
# Safari: Develop → Empty Caches
```

---

## Version History

### v2.3.3 (Current - Oct 22, 2025)
- ✅ Fixed 'interrupted' TTS error logging (treat as normal user action, not error)
- ✅ Voice button returns to idle state after stopping speech

### v2.3.2 (Oct 22, 2025)
- ✅ Voice button state machine (idle/listening/thinking/speaking)
- ✅ Ability to stop listening or speaking by clicking button
- ✅ Block voice button during AI thinking phase

### v2.3.0 (Oct 22, 2025)
- ✅ Temporal context for AI conversations
- ✅ Intelligent production deployment script
- ✅ Cleaned console logs (removed verbose voice logging)
- ✅ Full timestamp in current message for Claude

### v2.2.0 (Oct 22, 2025)
- ✅ Performance optimizations (CDN preconnect, lazy loading)
- ✅ Removed loading screen delay
- ✅ FCP/LCP improvements (0.8s)

### v2.1.0 (Oct 21, 2025)
- ✅ Fixed FPS/Manual Mode FOUC on production
- ✅ Dev mode detection via inline script
- ✅ iOS Safari rotation bug fix

### v2.0.0 (Oct 18, 2025)
- ✅ Full voice conversation system
- ✅ Claude Sonnet 4.5 integration
- ✅ Conversation memory (localStorage)
- ✅ Emotional color system

---

## Credits

**Developed by:** Alex
**AI Model:** Claude Sonnet 4.5 by Anthropic
**3D Library:** Three.js by Mr.doob and contributors
**Philosophy:** Fourth Way by G.I. Gurdjieff
**Deployment:** Vercel

---

## License

Proprietary - All rights reserved

**Contact:** [GitHub](https://github.com/devStar0604/cubiqo)

---

## Milestone Status (Phase 1)

- ✅ **Milestone 1**: Core cube with color system + manual controls
- ✅ **Milestone 2**: Voice integration + Claude AI + memory
- ✅ **Milestone 3**: Deployment + mobile optimization + documentation

**Phase 1 Complete!**

**Milestone 3 deliverables:**
- [x] Production deployment on cubiqo.ai
- [x] Staging environment (staging.cubiqo.ai)
- [x] Mobile testing (iOS + Android)
- [x] Performance optimization (Score 60)
- [x] Temporal context feature
- [x] Full documentation (README, ARCHITECTURE, API)
- [x] Automated deployment script
- [x] Voice button state machine with stop functionality

**Future phases**: Phase 2-3 in discussion

---

**Built with consciousness. Between light and code. 🟧**
