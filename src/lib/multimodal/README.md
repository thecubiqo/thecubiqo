# Multimodal AI Module

**Vision + Audio processing for enhanced AI interactions**

---

## Overview

This module adds **multimodal capabilities** to CUBIQO, enabling the AI to:
- **See** via camera (object detection, face recognition)
- **Hear emotion** via audio analysis (tone, pitch, emotion detection)
- **Understand context** by fusing vision + audio into enhanced prompts

---

## Quick Start

```typescript
import { useMultimodalAI } from '@/hooks/multimodal/useMultimodalAI';

function ChatWithVision() {
  const {
    startCamera,
    stopCamera,
    detections,
    emotion,
    getEnhancedPrompt,
  } = useMultimodalAI();

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Send message with multimodal context
  const sendMessage = async (text: string) => {
    const enhanced = await getEnhancedPrompt(text);
    const response = await callAI([
      { role: 'user', content: enhanced.enhancedText }
    ], {
      multimodalContext: enhanced.metadata,
    });
    return response;
  };

  return (
    <div>
      <CameraView />
      {emotion && <EmotionIndicator emotion={emotion} />}
      {detections?.objects.map(obj => (
        <div key={obj.label}>{obj.label} ({obj.confidence})</div>
      ))}
    </div>
  );
}
```

---

## Architecture

```
/src/lib/multimodal/
├── types.ts              # Shared types
├── coordinator.ts        # Multimodal fusion logic
├── config.ts             # Configuration
├── vision/               # Vision processing
│   ├── camera-manager.ts
│   ├── video-processor.ts
│   ├── object-detector.ts
│   └── face-detector.ts
├── audio/                # Audio enhancement
│   ├── emotion-analyzer.ts
│   └── audio-features.ts
└── index.ts              # Public exports
```

---

## Key Components

### 1. Camera Manager
Handles camera access, permissions, and stream management.

```typescript
import { CameraManager } from '@/lib/multimodal/vision/camera-manager';

const manager = new CameraManager();
await manager.startCamera('user'); // Front camera
const frame = manager.captureFrame();
```

### 2. Vision Processor
Detects objects and faces in video frames.

```typescript
import { VisionProcessor } from '@/lib/multimodal/vision/video-processor';

const processor = new VisionProcessor();
await processor.loadModels();

const frame = processor.processFrame(videoElement);
const objects = processor.detectObjects(frame);
const faces = processor.detectFaces(frame);
```

### 3. Emotion Analyzer
Analyzes audio for emotion, tone, and features.

```typescript
import { EmotionAnalyzer } from '@/lib/multimodal/audio/emotion-analyzer';

const analyzer = new EmotionAnalyzer();
await analyzer.initialize(audioStream);

const emotion = analyzer.detectEmotion();
const features = analyzer.analyzeAudio();
```

### 4. Multimodal Coordinator
Fuses vision and audio into enhanced AI context.

```typescript
import { MultimodalCoordinator } from '@/lib/multimodal/coordinator';

const coordinator = new MultimodalCoordinator();
const context = await coordinator.getMultimodalContext();
const enhanced = coordinator.enhancePrompt(userMessage, context);
```

---

## React Hooks

### `useCamera()`
Access and control camera.

```typescript
const { stream, permission, startCamera, stopCamera } = useCamera(true);
```

### `useVision()`
Process video frames for object/face detection.

```typescript
const { detections, processing } = useVision(videoElement, true);
```

### `useEmotionDetection()`
Analyze audio for emotion.

```typescript
const { emotion, features } = useEmotionDetection(audioStream, true);
```

### `useMultimodalAI()` (Main Hook)
Complete multimodal integration.

```typescript
const {
  startCamera,
  detections,
  emotion,
  getEnhancedPrompt,
} = useMultimodalAI();
```

---

## UI Components

### `<CameraView />`
Displays camera feed with detection overlays.

```tsx
<CameraView enabled={visionEnabled} />
```

### `<EmotionIndicator />`
Shows real-time emotion state.

```tsx
<EmotionIndicator emotion={emotion} />
```

### `<MultimodalToggle />`
Toggle vision/audio features on/off.

```tsx
<MultimodalToggle
  visionEnabled={visionEnabled}
  audioEnabled={audioEnabled}
  onToggle={(vision, audio) => { /* ... */ }}
/>
```

---

## Feature Flags

Control multimodal features via feature flags:

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

const visionEnabled = useFeatureFlag('multimodal_vision');
const audioEnabled = useFeatureFlag('multimodal_audio');
```

**Available flags:**
- `multimodal_vision` - Camera-based vision processing
- `multimodal_audio` - Enhanced audio emotion detection
- `multimodal_emotion` - Advanced emotion recognition (Hume AI)

---

## Configuration

Default configuration in `/src/lib/multimodal/config.ts`:

```typescript
export const DEFAULT_CONFIG: MultimodalConfig = {
  vision: {
    enabled: true,
    objectDetection: {
      enabled: true,
      confidenceThreshold: 0.5,
      maxDetections: 10,
    },
    faceDetection: {
      enabled: true,
      confidenceThreshold: 0.7,
    },
    processingFPS: 1, // Process 1 frame per second
    facingMode: 'user',
  },
  audio: {
    enabled: true,
    emotionDetection: {
      enabled: true,
      provider: 'web-audio', // MVP: Web Audio API
    },
    analysisRate: 2, // Analyze every 500ms
  },
  coordination: {
    fuseUserState: true,
    enhancePrompts: true,
  },
};
```

---

## Dependencies

Required npm packages:

```bash
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd @mediapipe/face_detection
```

Optional (for advanced emotion):
```bash
npm install @humeai/voice
```

---

## Performance

**Targets:**
- Frame processing: < 100ms
- Model loading: < 3s
- Memory usage: < 100MB increase
- CPU usage: < 20% average

**Optimizations:**
- Lazy load models (only when enabled)
- Throttle frame processing (1fps default)
- Use Web Workers for heavy computation (future)
- Cache model files in browser

---

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Safari  | 14+     | ⚠️ Partial (requires polyfills) |
| Edge    | 90+     | ✅ Full |

**Requirements:**
- HTTPS (or localhost)
- `getUserMedia()` support
- WebGL support (for TensorFlow.js)
- Web Audio API support

---

## Security & Privacy

1. **Client-side processing** - No data sent to servers
2. **Opt-in only** - Features disabled by default
3. **Clear permissions** - Explicit camera/mic requests
4. **No recording** - Streams not saved
5. **Audit logging** - Feature usage tracked

---

## Testing

Run tests:
```bash
npm test -- multimodal
```

Test coverage:
```bash
npm run test:coverage
```

---

## Troubleshooting

### Camera not working
1. Check HTTPS connection
2. Verify camera permissions granted
3. Check browser console for errors

### Models not loading
1. Check network connection
2. Verify CDN accessible
3. Clear browser cache

### High CPU usage
1. Reduce `processingFPS` in config
2. Disable face detection (more expensive)
3. Check for memory leaks

---

## Examples

See `/docs/MULTIMODAL_QUICK_START.md` for complete examples.

---

## Resources

- [Architecture Doc](../../docs/MULTIMODAL_AI_ARCHITECTURE.md)
- [Quick Start Guide](../../docs/MULTIMODAL_QUICK_START.md)
- [TensorFlow.js Docs](https://www.tensorflow.org/js)
- [MediaPipe Docs](https://google.github.io/mediapipe/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**Questions?** Ask MO (CTO) or check the architecture document.
