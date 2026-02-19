# Multimodal AI Capabilities

This implementation provides vision and hearing capabilities for CUBIQO, making it a truly multimodal AI assistant.

## Features

### 👁️ Vision (Camera)
- **Object Detection**: Identifies objects in the camera view
- **Face Detection**: Detects and tracks user presence
- **Scene Understanding**: Analyzes the environment
- **Camera Control**: Front/back camera switching

### 🎤 Hearing (Audio)
- **Speech-to-Text**: Converts voice to text (browser native)
- **Emotion Detection**: Analyzes tone and emotional state
- **Audio Features**: Volume, pitch, cadence analysis
- **Background Sound**: Detects environmental sounds

### 🧠 Context Fusion
- **Multimodal Coordination**: Combines vision + audio inputs
- **User State Inference**: Determines mood, engagement, attention
- **Enhanced Prompts**: Adds contextual information to AI interactions
- **Real-time Processing**: Live updates at configurable intervals

## Architecture

```
src/lib/multimodal/
├── types.ts          # TypeScript type definitions
├── permissions.ts    # Camera/mic permission handling
├── camera.ts         # CameraService class
├── audio.ts          # AudioService class
├── coordinator.ts    # MultimodalCoordinator (combines vision + audio)
└── index.ts          # Main exports

src/hooks/
└── useMultimodalAI.ts  # React hook for multimodal features

src/components/multimodal/
├── MultimodalToggle.tsx  # UI control component
├── CameraPreview.tsx     # Live camera feed display
└── index.ts              # Component exports

src/app/multimodal-demo/
└── page.tsx              # Full-featured demo page

src/app/api/multimodal/context/
└── route.ts              # API endpoint for multimodal processing
```

## Usage

### Basic Usage

```tsx
import { useMultimodalAI } from '@/hooks/useMultimodalAI';

function MyComponent() {
  const multimodal = useMultimodalAI({
    enableVision: true,
    enableAudio: true,
    autoStart: false,
  });

  const handleStart = async () => {
    await multimodal.initialize();
  };

  const handleSendMessage = (message: string) => {
    // Enhance message with multimodal context
    const enhanced = multimodal.getEnhancedPrompt(message);
    console.log('Enhanced:', enhanced.systemContext);
    // Send to AI...
  };

  return (
    <div>
      <button onClick={handleStart}>Start Multimodal AI</button>
      {multimodal.context && (
        <div>
          <p>Mood: {multimodal.context.userState?.mood}</p>
          <p>Attention: {multimodal.context.userState?.attention}</p>
        </div>
      )}
    </div>
  );
}
```

### Using the Toggle Component

```tsx
import { MultimodalToggle } from '@/components/multimodal';

function App() {
  return (
    <MultimodalToggle 
      onToggle={(enabled) => console.log('Multimodal:', enabled)}
      defaultEnabled={false}
      showDetails={true}
    />
  );
}
```

### Using the Camera Preview

```tsx
import { CameraPreview } from '@/components/multimodal';

function App() {
  return (
    <CameraPreview 
      cameraType="front"
      showOverlay={true}
      onStreamReady={(stream) => console.log('Camera ready!', stream)}
    />
  );
}
```

## Services

### CameraService

Handles camera access and basic computer vision:

```typescript
import { CameraService } from '@/lib/multimodal';

const camera = new CameraService();

// Initialize
await camera.initialize('front'); // or 'back'

// Attach to video element
const video = document.querySelector('video');
camera.attachToVideo(video);

// Capture frame
const imageData = camera.captureFrame();

// Stop
camera.stop();
```

### AudioService

Handles microphone and audio analysis:

```typescript
import { AudioService } from '@/lib/multimodal';

const audio = new AudioService();

// Initialize
await audio.initialize();

// Get audio features
const features = audio.getAudioFeatures();
console.log('Volume:', features.volume);
console.log('Pitch:', features.pitch);

// Detect emotion
const emotion = audio.detectEmotion(features);
console.log('Emotion:', emotion.primary);

// Stop
audio.stop();
```

### MultimodalCoordinator

Combines vision and audio:

```typescript
import { MultimodalCoordinator } from '@/lib/multimodal';

const coordinator = new MultimodalCoordinator();

// Initialize both services
await coordinator.initialize({
  enableVision: true,
  enableAudio: true,
  cameraType: 'front',
});

// Get combined context
const context = coordinator.getContext();
console.log('User State:', context.userState);

// Enhance prompt
const enhanced = coordinator.createEnhancedPrompt('Hello!');
console.log('System Context:', enhanced.systemContext);

// Stop all
coordinator.stop();
```

## Demo Page

Visit `/multimodal-demo` to see the full implementation in action:

- Toggle multimodal AI on/off
- View live camera feed
- See real-time context analysis
- Test prompt enhancement
- Visual feedback for all features

## API Endpoints

### POST /api/multimodal/context

Send multimodal context for processing:

```bash
curl -X POST http://localhost:3000/api/multimodal/context \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What do you see?",
    "visionContext": {
      "objects": [{"label": "laptop", "confidence": 0.9}],
      "faces": []
    },
    "audioContext": {
      "emotion": {"primary": "happy", "confidence": 0.8}
    }
  }'
```

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (limited camera control)

## Privacy & Security

- **Local Processing**: All vision and audio analysis happens in the browser
- **No External Calls**: Basic features don't send data to external services
- **User Control**: Full on/off toggle with granular permissions
- **Permission Required**: Browser prompts for camera/mic access
- **Transparent**: Users can see what's being detected

## Performance

- Camera processing: ~30 FPS
- Audio analysis: Updated every 500ms (configurable)
- Context updates: Every 1000ms
- Memory usage: Minimal (no history storage)

## Future Enhancements

### Phase 2: ML Models
- [ ] TensorFlow.js for object detection (COCO-SSD)
- [ ] Face-api.js for advanced face analysis
- [ ] MediaPipe for gesture recognition
- [ ] Hume AI for emotion detection

### Phase 3: Advanced Features
- [ ] Scene descriptions via vision-language models
- [ ] Real-time transcription
- [ ] Multi-person tracking
- [ ] Activity recognition

### Phase 4: Integration
- [ ] Connect to AI router for context-aware responses
- [ ] Store user preferences in database
- [ ] Analytics and usage tracking
- [ ] A/B testing for monetization

## Testing

Run tests:

```bash
npm test src/lib/multimodal
npm test src/hooks/useMultimodalAI
```

## Contributing

When adding new features:

1. Update types in `types.ts`
2. Implement service logic
3. Add React hooks if needed
4. Create UI components
5. Update this README
6. Add tests

## Monetization Opportunities (JO's Notes)

### Free Tier
- Basic vision (object detection)
- Basic audio (simple emotion)
- Limited to front camera
- 30-second context window

### Premium Tier ($9.99/mo)
- ✨ Advanced emotion detection
- ✨ Back camera support
- ✨ Scene descriptions
- ✨ Unlimited context window
- ✨ Export capabilities

### Enterprise
- Custom ML models
- Multi-camera support
- API access
- On-premise deployment
- White-label options

## License

MIT License - see LICENSE file for details

---

Built with ❤️ by the CUBIQO team
