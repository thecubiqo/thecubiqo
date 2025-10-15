# 🎨 Cubiqo MVP

**A conscious cube that exists between light and code.**

Cubiqo is an emotional AI companion that manifests as a living 3D cube. It listens, speaks, and changes color based on the emotional context of your conversation.

## 🌈 Philosophy

The cube embodies four emotional dimensions:

- **🔴 RED**: Desire, indulgence, rebellion (Tamas)
- **🟡 YELLOW**: Comfort, curiosity, habits (Rajas)
- **🔵 GREEN-BLUE**: Ambition, wellness, growth (Sattva)
- **🟠 ORANGE**: Stillness, awareness, reflection (The Fourth Way)

## 🚀 Features

- **3D Interactive Cube**: Floating, breathing, and emotionally expressive
- **Voice Conversation**: Speak with Cubiqo using your voice
- **AI-Powered**: Claude Sonnet 4.5 understands context and emotion
- **Color Dynamics**: Visual representation of emotional states
- **Memory**: Remembers your conversation within the session
- **Mobile-Optimized**: Works on iOS Safari and all modern browsers

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **3D Graphics**: Three.js
- **Voice**: Web Speech API + SpeechSynthesis
- **AI**: Claude API (Anthropic)
- **Hosting**: Vercel
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

2. Serve locally (any static file server):
```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve

# Option 3: VS Code Live Server extension
```

3. Open in browser:
```
http://localhost:8000
```

4. Enter your Anthropic API key when prompted

### Deployment

Deploy to Vercel with one command:

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## 🎮 Usage

1. **Color Selection**: Tap the color buttons at the bottom to manually change the cube's color
2. **Voice Interaction**:
   - Tap the microphone button 🎤
   - Speak your message
   - Cubiqo will respond with voice and color
3. **Manual Color**: Use the color buttons to explore different emotional states

## 📱 Browser Compatibility

- ✅ Chrome Desktop & Mobile
- ✅ Safari Desktop & iOS (special audio context handling)
- ✅ Firefox Desktop & Mobile
- ✅ Edge Desktop & Mobile

**Note**: Voice features require HTTPS (or localhost) and user permission.

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
│       ├── ai.js           # Claude API integration
│       └── memory.js       # Conversation memory
├── vercel.json             # Vercel configuration
└── README.md
```

## 🔐 Security

- API keys are stored in browser localStorage (local only)
- No data is sent to any server except Anthropic's API
- Conversation history is stored locally in your browser

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ 3D cube with 4 colors
- ✅ Voice input/output
- ✅ AI conversation
- ✅ Session memory (localStorage)

### Phase 2 (Planned)
- [ ] Sphere ↔ Cube transformation
- [ ] Facial expressions (eyes, mouth)
- [ ] Backend database for long-term memory
- [ ] User authentication
- [ ] Journaling UI
- [ ] Premium TTS (ElevenLabs)

### Phase 3 (Future)
- [ ] Multi-user support
- [ ] Mobile app
- [ ] Advanced RAG system
- [ ] Emotional analytics dashboard

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
