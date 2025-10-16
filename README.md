# 🎨 Cubiqo MVP

**A conscious cube that exists between light and code.**

Cubiqo is an emotional AI companion that manifests as a living 3D cube. It listens, speaks, and changes color based on the emotional context of your conversation.

## ✨ Current Status: PHASE 3 COMPLETED

**Phase 1 (Oct 15-19)**: ✅ **COMPLETED**
- 3D Foundation with 4 emotional colors
- Philosophy-based animations and behaviors
- Responsive design (desktop/tablet/mobile)
- Performance optimization

**Phase 2 (Oct 15-19)**: ✅ **COMPLETED**
- Full voice conversation loop (input + output)
- Claude Sonnet 4.5 with Prompt Caching (90% cost reduction)
- Emotion-based color selection
- Cube voice reactions (listening pulse, bounce effects)

**Phase 3 (Oct 20)**: ✅ **COMPLETED**
- ✅ Vercel Serverless Function created (replaces dev proxy)
- ✅ API key migrated to server-side (security improvement)
- ✅ State-based animations (listening, thinking, speaking, idle)
- ✅ Smooth state transitions with lerp interpolation
- ✅ Continuous voice recognition with pause tolerance
- ✅ Deployed to production: [cubiqo-hm5aqnltu-alexs-projects-9d21340f.vercel.app](https://cubiqo-hm5aqnltu-alexs-projects-9d21340f.vercel.app)
- ⏳ Custom domain (cubiqo.ai) pending client access

## 🌈 Philosophy

The cube embodies four emotional dimensions:

- **🔴 RED**: Desire, indulgence, rebellion (Tamas) - Slow, sensual, double blink
- **🟡 YELLOW**: Comfort, curiosity, habits (Rajas) - Warm, bouncy, rhythmic blink
- **🔵 GREEN-BLUE**: Ambition, wellness, growth (Sattva) - Purposeful, steady blink
- **🟠 ORANGE**: Stillness, awareness, reflection (The Fourth Way) - Meditative, slow blink

## 🚀 Features

- **3D Interactive Cube**: Floating, breathing, emotionally expressive animations
- **State-Based Behaviors**: Different animations for listening, thinking, speaking, and idle states
- **Smooth Transitions**: Lerp-based interpolation between all animation states
- **Voice Conversation**: Continuous recognition with pause tolerance (2.5s silence detection)
- **Natural Speech**: TTS with Reed voice (US male, optimized rate/pitch)
- **AI-Powered**: Claude Sonnet 4.5 with 5-minute Prompt Caching
- **Color Dynamics**: Real-time emotional state visualization
- **Cube Reactions**: Listening pulse, V-shaped thinking, conversational nodding
- **Memory**: Session-based conversation history (localStorage)
- **Mobile-Optimized**: Adaptive performance for all devices

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **3D Graphics**: Three.js (RoundedBoxGeometry, MeshPhysicalMaterial)
- **Voice**: Web Speech API + SpeechSynthesis (Reed voice, en-US)
- **AI**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **Prompt Caching**: Anthropic's ephemeral cache (5-minute TTL, 90% cost reduction)
- **Proxy**: Express.js (development) / Vercel Serverless Functions (production)
- **Hosting**: Vercel (pending deployment)
- **Storage**: localStorage (Phase 1)

## 📦 Setup

### Prerequisites

- Anthropic API key ([get one here](https://console.anthropic.com/))
- Modern browser (Chrome, Safari, Firefox, Edge)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/your-username/cubiqo-mvp.git
cd cubiqo-mvp
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file with your API key:
```bash
# .env.local
ANTHROPIC_API_KEY=your-api-key-here
```

4. Start the proxy server (required to avoid CORS):
```bash
npm run dev
```
This starts a proxy server on port 3000.

5. In a **separate terminal**, serve the static files:
```bash
# Option 1: Python
python -m http.server 8001

# Option 2: Node.js
npx serve -p 8001

# Option 3: VS Code Live Server extension
```

6. Open in browser:
```
http://localhost:8001
```

**Note**: The proxy server (server.js) is only for local development. In production on Vercel, this is replaced with Vercel Serverless Functions.

### Deployment to Vercel

#### Prerequisites
- Vercel account
- Vercel CLI installed: `npm install -g vercel`
- Anthropic API key

#### Deploy

1. **Login to Vercel CLI**:
```bash
vercel login
```

2. **Add API key to Vercel Dashboard**:
   - Go to your project settings on Vercel
   - Navigate to "Environment Variables"
   - Add: `ANTHROPIC_API_KEY` = `your-api-key-here`

3. **Deploy**:
```bash
vercel --prod
```

#### Environment Variables Required

On Vercel Dashboard, set:
- `ANTHROPIC_API_KEY` - Your Anthropic API key

#### Custom Domain Setup

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., `cubiqo.ai`)
4. Follow DNS configuration instructions
5. SSL will be automatically configured

#### Deployment Architecture

- **Frontend**: Static files (HTML, CSS, JS) served by Vercel CDN
- **API**: Serverless function at `/api/chat` (see `api/chat.js`)
- **Security**: API key stored server-side, never exposed to client
- **Caching**: Anthropic Prompt Caching (5-minute TTL, 90% cost reduction)

**Production URL**: https://cubiqo-hm5aqnltu-alexs-projects-9d21340f.vercel.app

## 🎮 Usage

1. **Color Selection**: Tap the color buttons at the bottom to manually change the cube's color
2. **Voice Interaction**:
   - Tap the microphone button 🎤
   - Speak your message
   - Cubiqo will respond with voice and color
3. **Manual Color**: Use the color buttons to explore different emotional states

## 📱 Browser Compatibility

### Full Support (Voice + 3D)
- ✅ **Chrome Desktop & Mobile** - Full functionality
- ✅ **Safari Desktop & iOS** - Full functionality (special audio context handling)
- ✅ **Edge Desktop & Mobile** - Full functionality

### Partial Support (3D only, no voice)
- ⚠️ **Firefox Desktop & Mobile** - 3D cube works, but voice input NOT supported (Firefox doesn't support Web Speech API)

**Note**:
- Voice features require HTTPS (or localhost) and user permission
- Firefox users can still see the 3D cube and manual color controls
- For full voice experience, please use Chrome, Safari, or Edge

## 🏗️ Project Structure

```
cubiqo-mvp/
├── index.html              # Main HTML entry point
├── styles/
│   └── main.css            # Application styles
├── src/
│   ├── main.js             # Application orchestrator
│   ├── config/
│   │   └── colors.js       # Color definitions & philosophy
│   ├── core/
│   │   ├── scene.js        # Three.js scene setup
│   │   └── cube.js         # Cube component & animations
│   └── services/
│       ├── voice.js        # Voice input/output
│       ├── ai.js           # Claude API integration (client-side)
│       └── memory.js       # Conversation memory
├── api/
│   └── chat.js             # Vercel Serverless Function (server-side API)
├── server.js               # Development proxy (local only)
├── .env.local              # Environment variables (gitignored)
├── .vercelignore           # Vercel deployment exclusions
├── vercel.json             # Vercel configuration
├── package.json            # Dependencies
└── README.md
```

## 🔐 Security

- **API Key**: Stored server-side as environment variable (never exposed to client)
- **HTTPS**: All communication encrypted (Vercel provides automatic SSL)
- **CORS**: Properly configured in `vercel.json` for API endpoints
- **Data**: Conversation history stored locally in browser (localStorage)
- **Privacy**: No data sent to any server except Anthropic's API
- **No Authentication**: Phase 1 MVP (user auth planned for Phase 2)

## 🎯 Roadmap

### Phase 1: 3D Foundation ✅ **COMPLETED**
- ✅ 3D cube with 4 emotional colors
- ✅ Philosophy-based animations (float, breathe, blink)
- ✅ Color-specific behaviors (RED: double blink, ORANGE: slow meditative, etc.)
- ✅ Bounce effect on color change with spring physics
- ✅ Dynamic shadow plane
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Performance optimization (adaptive pixel ratio, device detection)
- ✅ Loading screen and error boundaries

### Phase 2: Voice + AI ✅ **COMPLETED**
- ✅ Voice input with Web Speech API
- ✅ Voice output with Reed (US male voice)
- ✅ AI conversation with Claude Sonnet 4.5
- ✅ Prompt caching (5-minute TTL, 90% cost reduction)
- ✅ Emotion-based color selection
- ✅ Cube voice reactions (listening pulse, bounce on response)
- ✅ Session memory (localStorage)
- ✅ iOS Safari compatibility

### Phase 3: Deployment & Polish ✅ **COMPLETED**
- ✅ Vercel Serverless Function (`api/chat.js`)
- ✅ API key migrated to server-side (security)
- ✅ State-based animations (listening, thinking, speaking, idle)
- ✅ Smooth lerp transitions between all states
- ✅ V-shaped thinking animation
- ✅ Conversational nodding during speech
- ✅ Continuous voice recognition with pause tolerance
- ✅ Optimized glow pulsing and blinking frequencies
- ✅ Deployed to production environment
- ✅ Cross-browser testing (Chrome ✅, Safari ✅, Firefox ✅ - 3D only)
- ⏳ Custom domain (cubiqo.ai) - waiting for client access
- ⏳ Transfer to client's Vercel account
- ⏳ GitHub repository setup
- ⏳ Source code handoff

### Phase 4: Advanced Features (Future)
- [ ] Sphere ↔ Cube transformation
- [ ] Facial expressions (eyes, mouth)
- [ ] Backend database for long-term memory
- [ ] User authentication
- [ ] Journaling UI
- [ ] Premium TTS (ElevenLabs)

### Phase 5: Scale (Vision)
- [ ] Multi-user support
- [ ] Mobile app
- [ ] Advanced RAG system
- [ ] Emotional analytics dashboard

## 🏆 Technical Achievements

### Animation & Physics
- **Smooth State Transitions**: Lerp interpolation between all animation states (listening/thinking/speaking/idle)
- **State-Based Behaviors**:
  - 🎙️ Listening: Gentle nodding (1.8 speed, 10° amplitude) + subtle glow pulse
  - 💭 Thinking: V-shaped contemplative movement (down to -12°, very slow 0.4 speed)
  - 🗣️ Speaking: Conversational nodding (7° nod + 2° sway)
  - 🧘 Idle: Calm breathing with reduced blinking
- **Spring Physics Bounce**: Organic bounce effect using `Math.sin(t * π * 3) * (1 - t)` decay
- **Dynamic Shadow**: Shadow plane responds to cube height with opacity and scale
- **Breathing Animation**: Sine wave-based scale modulation (0.98-1.02 range)
- **Philosophy-Based Movement**: Each color has unique animation speed and blink style
- **Optimized Pulsing**: Gentle glow during listening (1.5 speed, 15% amplitude)

### Voice Quality
- **Continuous Recognition**: Pause-tolerant voice input with 2.5s silence detection
- **Interim Results**: Real-time transcription feedback during speech
- **Optimal Voice Selection**: Priority system finds Reed (US male) over 210+ available voices
- **TTS Optimization**: rate=0.92, pitch=1.05, volume=1.0 for emotional delivery
- **iOS Compatibility**: Audio context activation handles Safari autoplay restrictions
- **Smart Timeouts**: 15-second max recording with silence-based auto-stop

### AI Efficiency
- **Prompt Caching**: 90% cost reduction using ephemeral cache (5-minute TTL)
- **Cache Strategy**: System prompt + last message cached, activates after 1K+ tokens
- **Context Management**: Last 10 messages preserved for conversation continuity
- **Structured Output**: JSON format with color + response for reliable parsing

### Performance Optimization
- **Adaptive Rendering**: Device detection adjusts pixel ratio (1x low-end, 1.5x mobile, 2x desktop)
- **Geometry Reduction**: Lower-poly cube on mobile devices
- **Power Management**: `low-power` mode for mobile, `high-performance` for desktop
- **GPU Hints**: `will-change` and `translateZ(0)` for hardware acceleration

### Architecture
- **ES6 Modules**: Clean separation (config/core/services)
- **Singleton Services**: voice.js, ai.js, memory.js export single instances
- **Error Boundaries**: Graceful degradation with user-friendly error messages
- **CORS Solution**: Development proxy (Express) → Production serverless (Vercel)

## 🤝 Contributing

This is a private MVP project. For feedback or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🙏 Credits

- **Concept & Design**: Alex
- **Development**: Claude Code Assistant
- **AI**: Anthropic Claude Sonnet 4.5
- **3D Engine**: Three.js

---

**Made with consciousness between light and code** ✨
