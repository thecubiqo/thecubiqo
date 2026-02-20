# Multimodal AI Architecture (Vision + Audio)
## Technical Design Document

**Author:** MO (CTO)  
**Date:** 2025-02-08  
**Status:** APPROVED FOR IMPLEMENTATION  
**Version:** 1.0

---

## Executive Summary

This document defines the minimal, production-ready architecture for adding **multimodal AI capabilities** (vision + enhanced audio) to CUBIQO. The design prioritizes:

1. **Browser-native APIs** (minimize dependencies)
2. **Client-side processing** (reduce latency, cost)
3. **Privacy-first** (user control via toggles)
4. **Clean integration** with existing `/src/lib/ai` and `/src/lib/voice`
5. **MVP velocity** (ship fast, iterate)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTIMODAL AI SYSTEM                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   VISION    │  │    AUDIO    │  │ COORDINATOR │
    │  PROCESSOR  │  │  ANALYZER   │  │  (FUSION)   │
    └─────────────┘  └─────────────┘  └─────────────┘
          │                 │                 │
          │                 │                 │
          ▼                 ▼                 ▼
    ┌─────────────────────────────────────────────────┐
    │         EXISTING AI ROUTER (router.ts)          │
    │  Ollama → OpenClaw → Claude → OpenAI → MiniMax  │
    └─────────────────────────────────────────────────┘
```

### Data Flow

```
User Interaction
    │
    ├─► [Camera] ──► Vision Processor ──► Image Analysis
    │                                          │
    └─► [Microphone] ──► Audio Analyzer ──► Emotion/Tone
                                              │
                        ┌─────────────────────┤
                        │                     │
                        ▼                     ▼
                  Text Transcript      Emotion Metadata
                        │                     │
                        └─────────┬───────────┘
                                  │
                                  ▼
                        Multimodal Coordinator
                        (Combines context)
                                  │
                                  ▼
                            AI Router
                        (Enhanced prompts)
                                  │
                                  ▼
                          LLM Response
                                  │
                                  ▼
                        Voice Modulation
                      (Emotion-aware TTS)
```

---

## Technology Stack

### Vision Processing
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Camera Access** | `navigator.mediaDevices.getUserMedia()` | Browser-native, no dependencies |
| **Video Processing** | Canvas API + `<video>` element | Standard, lightweight |
| **Object Detection** | **TensorFlow.js** (`@tensorflow/tfjs`) + MobileNet/COCO-SSD | Client-side, real-time, ~3MB bundle |
| **Face Detection** | **MediaPipe Face Detection** (`@mediapipe/face_detection`) | Google's lightweight solution, ~1.5MB |
| **OCR (optional)** | Tesseract.js (future enhancement) | Text extraction from images |

**Alternative for MVP:** Use browser's built-in Shape Detection API (experimental) or defer to server-side vision API (Anthropic Claude Vision).

### Audio Enhancement
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Audio Capture** | `navigator.mediaDevices.getUserMedia()` | Already used in WebRTC calls |
| **Audio Analysis** | **Web Audio API** (`AudioContext`, `AnalyserNode`) | Real-time frequency/amplitude analysis |
| **Emotion Detection** | **Hume AI SDK** (`@humeai/voice`) or **Azure Speech Emotion** | Specialized emotion recognition |
| **Speech-to-Text** | Existing voice integration (keep as-is) | Already implemented |

**Minimal Approach:** Start with Web Audio API for basic tone/volume analysis, defer to Hume AI for production emotion detection.

### Multimodal Coordination
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Context Fusion** | TypeScript service layer | Lightweight orchestration |
| **State Management** | React Context + Zustand (if needed) | Already in stack |
| **Feature Toggles** | Existing feature flag system (`/src/lib/feature-flags`) | Already implemented |

---

## Folder Structure

```
src/
├── lib/
│   ├── multimodal/                      # NEW: Multimodal AI module
│   │   ├── index.ts                     # Public API exports
│   │   ├── coordinator.ts               # Fusion logic (vision + audio)
│   │   ├── types.ts                     # Shared types
│   │   │
│   │   ├── vision/                      # Vision processing
│   │   │   ├── index.ts
│   │   │   ├── camera-manager.ts        # Camera access & permissions
│   │   │   ├── video-processor.ts       # Frame capture & preprocessing
│   │   │   ├── object-detector.ts       # TensorFlow.js object detection
│   │   │   ├── face-detector.ts         # MediaPipe face detection
│   │   │   └── types.ts                 # Vision-specific types
│   │   │
│   │   ├── audio/                       # Audio enhancement (extends /lib/audio)
│   │   │   ├── index.ts
│   │   │   ├── emotion-analyzer.ts      # Emotion/tone detection
│   │   │   ├── audio-features.ts        # Pitch, volume, cadence extraction
│   │   │   └── types.ts                 # Audio-specific types
│   │   │
│   │   ├── config.ts                    # Configuration (model URLs, settings)
│   │   └── README.md                    # Module documentation
│   │
│   ├── ai/                               # EXISTING: AI router
│   │   ├── router.ts                    # MODIFIED: Accept multimodal context
│   │   └── ...
│   │
│   ├── voice/                            # EXISTING: Voice integration
│   │   └── ...
│   │
│   ├── feature-flags/                    # EXISTING: Feature toggles
│   │   └── ...                          # USE: multimodal_vision, multimodal_audio
│   │
│   └── audio/                            # EXISTING: Audio context
│       ├── audioContext.ts              # KEEP: Base audio handling
│       └── ...
│
├── components/
│   ├── multimodal/                      # NEW: UI components
│   │   ├── CameraView.tsx               # Camera feed preview
│   │   ├── EmotionIndicator.tsx         # Real-time emotion display
│   │   ├── MultimodalToggle.tsx         # On/off switch for vision/audio
│   │   └── PermissionPrompt.tsx         # Camera/mic permission UI
│   │
│   └── ...
│
├── hooks/
│   ├── useCamera.ts                     # NEW: Camera access hook
│   ├── useVision.ts                     # NEW: Vision processing hook
│   ├── useEmotionDetection.ts           # NEW: Emotion analysis hook
│   └── useMultimodalAI.ts               # NEW: Main integration hook
│
└── app/
    └── api/
        └── multimodal/
            └── analyze/
                └── route.ts              # NEW: Server-side vision fallback (optional)
```

---

## Key Components

### 1. Camera Manager (`camera-manager.ts`)
**Responsibility:** Handle camera access, permissions, and stream management.

```typescript
export class CameraManager {
  private stream: MediaStream | null = null;
  private facingMode: 'user' | 'environment' = 'user';
  
  async requestPermission(): Promise<boolean>;
  async startCamera(facing?: 'user' | 'environment'): Promise<MediaStream>;
  async switchCamera(): Promise<void>;
  stopCamera(): void;
  captureFrame(): ImageData;
  
  // Event listeners
  onPermissionDenied?: () => void;
  onStreamStart?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}
```

**Integration:** Extends existing WebRTC media handling pattern from `/src/lib/cq-to-cq/webrtc-calls.ts`.

---

### 2. Vision Processor (`video-processor.ts`)
**Responsibility:** Capture frames, preprocess images, and detect objects/faces.

```typescript
export class VisionProcessor {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private modelLoaded: boolean = false;
  
  async loadModels(): Promise<void>;
  processFrame(videoElement: HTMLVideoElement): ProcessedFrame;
  detectObjects(frame: ProcessedFrame): ObjectDetection[];
  detectFaces(frame: ProcessedFrame): FaceDetection[];
  
  // Configuration
  setDetectionInterval(ms: number): void;
  setConfidenceThreshold(threshold: number): void;
}

export interface ProcessedFrame {
  timestamp: number;
  imageData: ImageData;
  width: number;
  height: number;
}

export interface ObjectDetection {
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export interface FaceDetection {
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  landmarks?: { x: number; y: number }[];
}
```

**Models:**
- **MobileNet v2** for object classification (~8MB)
- **COCO-SSD** for object detection (~5MB)
- **MediaPipe Face Detection** for face recognition (~1.5MB)

**Optimization:** Models loaded lazily on first use, cached in browser.

---

### 3. Emotion Analyzer (`emotion-analyzer.ts`)
**Responsibility:** Analyze audio for emotional tone, pitch, volume, and cadence.

```typescript
export class EmotionAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  
  async initialize(stream: MediaStream): Promise<void>;
  analyzeAudio(): AudioFeatures;
  detectEmotion(): EmotionState;
  
  // Real-time metrics
  getVolume(): number;
  getPitch(): number;
  getCadence(): number;
}

export interface AudioFeatures {
  volume: number;        // 0-100
  pitch: number;         // Hz
  cadence: number;       // Words per minute (estimated)
  energy: number;        // Signal energy
  timestamp: number;
}

export interface EmotionState {
  primary: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm';
  confidence: number;
  valence: number;       // Positive/negative (-1 to 1)
  arousal: number;       // Energy level (0 to 1)
}
```

**MVP Approach:**
1. **Phase 1 (MVP):** Use Web Audio API for basic volume/pitch analysis
2. **Phase 2:** Integrate Hume AI Voice API for advanced emotion detection
3. **Fallback:** Simple heuristics (loud + fast = excited, soft + slow = calm)

---

### 4. Multimodal Coordinator (`coordinator.ts`)
**Responsibility:** Fuse vision and audio context, enhance AI prompts.

```typescript
export class MultimodalCoordinator {
  private visionProcessor: VisionProcessor;
  private emotionAnalyzer: EmotionAnalyzer;
  private enabled: { vision: boolean; audio: boolean };
  
  async initialize(options: MultimodalOptions): Promise<void>;
  
  // Main coordination method
  async getMultimodalContext(): Promise<MultimodalContext>;
  
  // Feature toggles
  enableVision(enabled: boolean): void;
  enableAudioAnalysis(enabled: boolean): void;
  
  // Integration with AI router
  enhancePrompt(userMessage: string, context: MultimodalContext): EnhancedPrompt;
}

export interface MultimodalContext {
  timestamp: number;
  
  // Vision context
  vision?: {
    objects: ObjectDetection[];
    faces: FaceDetection[];
    sceneDescription?: string;
  };
  
  // Audio context
  audio?: {
    emotion: EmotionState;
    features: AudioFeatures;
  };
  
  // Fused insights
  userState?: {
    engagement: 'low' | 'medium' | 'high';
    mood: string;
    attention: 'focused' | 'distracted';
  };
}

export interface EnhancedPrompt {
  text: string;
  systemContext: string;  // Injected into system prompt
  metadata: Record<string, any>;
}
```

**Example Enhanced Prompt:**
```
User: "What's in this image?"

Enhanced System Context:
"[VISION CONTEXT] The user is showing you an image containing:
- Objects: laptop (95%), coffee cup (88%), notebook (76%)
- Scene: Indoor workspace
[EMOTION CONTEXT] The user's voice indicates:
- Emotion: curious (85% confidence)
- Tone: calm and focused
Respond naturally, incorporating this context."
```

---

### 5. React Hooks

#### `useCamera.ts`
```typescript
export function useCamera(enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [error, setError] = useState<Error | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const startCamera = useCallback(async () => { ... });
  const stopCamera = useCallback(() => { ... });
  const switchCamera = useCallback(async () => { ... });
  
  return { stream, permission, error, facingMode, startCamera, stopCamera, switchCamera };
}
```

#### `useVision.ts`
```typescript
export function useVision(videoElement: HTMLVideoElement | null, enabled: boolean) {
  const [detections, setDetections] = useState<VisionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    if (!enabled || !videoElement) return;
    
    const processor = new VisionProcessor();
    const interval = setInterval(() => {
      const frame = processor.processFrame(videoElement);
      const objects = processor.detectObjects(frame);
      const faces = processor.detectFaces(frame);
      setDetections({ objects, faces });
    }, 1000); // Process every 1 second
    
    return () => clearInterval(interval);
  }, [videoElement, enabled]);
  
  return { detections, processing };
}
```

#### `useEmotionDetection.ts`
```typescript
export function useEmotionDetection(audioStream: MediaStream | null, enabled: boolean) {
  const [emotion, setEmotion] = useState<EmotionState | null>(null);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);
  
  useEffect(() => {
    if (!enabled || !audioStream) return;
    
    const analyzer = new EmotionAnalyzer();
    analyzer.initialize(audioStream);
    
    const interval = setInterval(() => {
      const currentEmotion = analyzer.detectEmotion();
      const audioFeatures = analyzer.analyzeAudio();
      setEmotion(currentEmotion);
      setFeatures(audioFeatures);
    }, 500); // Analyze every 500ms
    
    return () => clearInterval(interval);
  }, [audioStream, enabled]);
  
  return { emotion, features };
}
```

#### `useMultimodalAI.ts` (Main Integration)
```typescript
export function useMultimodalAI() {
  const { stream: videoStream, startCamera, stopCamera } = useCamera(true);
  const { detections } = useVision(videoRef.current, visionEnabled);
  const { emotion } = useEmotionDetection(audioStream, audioEnabled);
  
  const coordinator = useMemo(() => new MultimodalCoordinator(), []);
  
  const getEnhancedContext = useCallback(async (message: string) => {
    const context = await coordinator.getMultimodalContext();
    return coordinator.enhancePrompt(message, context);
  }, [coordinator]);
  
  return {
    // Camera controls
    startCamera,
    stopCamera,
    
    // Real-time data
    detections,
    emotion,
    
    // AI integration
    getEnhancedContext,
  };
}
```

---

## Integration with Existing Systems

### 1. AI Router Integration (`/src/lib/ai/router.ts`)

**Modify the AI router to accept multimodal context:**

```typescript
// BEFORE
export async function callAI(
  messages: Array<{ role: string; content: string }>,
  options?: AIOptions
): Promise<AIResponse> { ... }

// AFTER
export async function callAI(
  messages: Array<{ role: string; content: string }>,
  options?: AIOptions & {
    multimodalContext?: MultimodalContext;  // NEW: Optional context
  }
): Promise<AIResponse> {
  // Inject multimodal context into system prompt
  if (options?.multimodalContext) {
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(
      messages[0].content,
      options.multimodalContext
    );
    messages[0].content = enhancedSystemPrompt;
  }
  
  // Existing routing logic...
}
```

**Example Usage:**
```typescript
import { callAI } from '@/lib/ai/router';
import { multimodalCoordinator } from '@/lib/multimodal';

const context = await multimodalCoordinator.getMultimodalContext();
const response = await callAI(
  [{ role: 'user', content: 'What do you see?' }],
  { multimodalContext: context }
);
```

---

### 2. Voice Integration (`/src/lib/voice`)

**Enhance voice responses with emotion awareness:**

```typescript
// In voice-modulation.ts or TTS handler
export function generateVoiceResponse(
  text: string,
  emotionContext?: EmotionState
): Promise<AudioBuffer> {
  // Adjust TTS parameters based on detected emotion
  const voiceParams = {
    pitch: emotionContext?.arousal ?? 1.0,
    speed: emotionContext?.valence > 0 ? 1.1 : 0.9,
    tone: emotionContext?.primary ?? 'neutral',
  };
  
  return synthesizeVoice(text, voiceParams);
}
```

---

### 3. Feature Flags

**Add new feature flags in Supabase:**

```sql
-- Enable/disable multimodal features
INSERT INTO feature_flags (name, scope, enabled, rollout_percentage) VALUES
  ('multimodal_vision', 'global', true, 10),    -- 10% rollout
  ('multimodal_audio', 'global', true, 100),    -- 100% rollout
  ('multimodal_emotion', 'global', false, 0);   -- Not yet enabled
```

**Usage in code:**
```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

function MultimodalChat() {
  const visionEnabled = useFeatureFlag('multimodal_vision');
  const audioEnabled = useFeatureFlag('multimodal_audio');
  
  const { startCamera, emotion } = useMultimodalAI();
  
  useEffect(() => {
    if (visionEnabled) {
      startCamera();
    }
  }, [visionEnabled]);
  
  // ...
}
```

---

## Security & Privacy

### Permissions Handling

1. **Request permissions explicitly:**
   ```typescript
   async function requestMultimodalPermissions() {
     try {
       const cameraPermission = await navigator.permissions.query({ name: 'camera' });
       const micPermission = await navigator.permissions.query({ name: 'microphone' });
       
       return {
         camera: cameraPermission.state,
         microphone: micPermission.state,
       };
     } catch (error) {
       // Fallback: request via getUserMedia
       return { camera: 'prompt', microphone: 'prompt' };
     }
   }
   ```

2. **Show clear UI indicators:**
   - Camera active: Green LED indicator
   - Microphone active: Audio waveform
   - Both off: Gray/disabled state

3. **User controls:**
   - Toggle vision on/off
   - Toggle audio analysis on/off
   - Revoke permissions (stop all streams)

### Data Privacy

1. **Client-side processing:** All vision/audio analysis happens in the browser
2. **No recording:** Streams are not saved or uploaded (unless explicitly requested)
3. **Opt-in only:** Features disabled by default, require explicit user activation
4. **Clear disclosure:** Privacy policy updated to mention camera/mic usage
5. **Audit logging:** Track when multimodal features are activated (via feature flags)

### Security Considerations

1. **HTTPS required:** Camera/mic access only works on secure origins
2. **CSP headers:** Allow loading TensorFlow.js and MediaPipe models from CDN
3. **Input validation:** Sanitize all vision/audio metadata before sending to LLM
4. **Rate limiting:** Prevent abuse of vision/audio processing APIs
5. **Model integrity:** Verify TensorFlow.js model checksums

---

## Implementation Roadmap

### Phase 1: MVP (2 weeks)
**Goal:** Basic camera + audio enhancement working

**Tasks:**
1. ✅ Architecture design (this document)
2. Create folder structure (`/src/lib/multimodal`)
3. Implement `CameraManager` (camera access + permissions)
4. Implement `EmotionAnalyzer` (Web Audio API only, no ML)
5. Create basic `MultimodalCoordinator` (simple context fusion)
6. Add feature flags (`multimodal_vision`, `multimodal_audio`)
7. Build UI components:
   - `CameraView.tsx` (video preview)
   - `MultimodalToggle.tsx` (on/off switch)
   - `PermissionPrompt.tsx` (request permissions)
8. Integrate with AI router (pass context as metadata)
9. Write unit tests (Vitest)
10. Deploy to staging (feature flag at 10%)

**Success Metrics:**
- Camera stream displays in UI
- Basic audio volume/pitch detection works
- AI receives multimodal context in prompts
- No performance degradation (< 50ms processing overhead)

---

### Phase 2: Enhanced Vision (2 weeks)
**Goal:** Object and face detection working

**Tasks:**
1. Add TensorFlow.js dependencies
2. Implement `VisionProcessor` with MobileNet + COCO-SSD
3. Implement `FaceDetector` with MediaPipe
4. Optimize model loading (lazy load, cache)
5. Add visual overlays (bounding boxes, labels)
6. Test performance (target: 30fps video, 1fps detection)
7. Add error handling (model load failures, low-light conditions)
8. Deploy to production (feature flag at 50%)

**Success Metrics:**
- Object detection accuracy > 80%
- Face detection accuracy > 90%
- Processing latency < 100ms per frame
- Bundle size increase < 10MB

---

### Phase 3: Advanced Emotion Detection (1 week)
**Goal:** Production-grade emotion recognition

**Tasks:**
1. Integrate Hume AI Voice API or Azure Speech Emotion
2. Train custom emotion model (if needed)
3. Add emotion visualization (emoji, color-coded indicators)
4. Tune emotion detection thresholds
5. A/B test emotion-aware responses
6. Deploy to production (feature flag at 100%)

**Success Metrics:**
- Emotion detection accuracy > 75%
- User satisfaction score increase (measured via feedback)
- No increase in voice processing latency

---

## Dependencies

### Required npm Packages

```json
{
  "dependencies": {
    // Vision
    "@tensorflow/tfjs": "^4.22.0",           // TensorFlow.js core
    "@tensorflow-models/coco-ssd": "^2.2.3", // Object detection
    "@mediapipe/face_detection": "^0.4.1646", // Face detection
    
    // Audio (optional, for advanced emotion)
    "@humeai/voice": "^0.4.0",               // Hume AI emotion API
    
    // Existing dependencies (no changes)
    "@anthropic-ai/sdk": "^0.70.1",
    "@supabase/supabase-js": "^2.84.0",
    "next": "^16.0.7",
    "react": "19.2.0",
    "three": "^0.181.2"
  }
}
```

**Bundle Size Impact:**
- TensorFlow.js: ~800KB (gzipped)
- COCO-SSD: ~5MB (models loaded separately)
- MediaPipe: ~1.5MB (models loaded separately)
- **Total:** ~7-8MB additional bundle size

**Mitigation:**
- Lazy load models only when multimodal features enabled
- Use CDN for model files (not bundled)
- Code-split multimodal components

---

## Testing Strategy

### Unit Tests (Vitest)
- `CameraManager`: Permission handling, stream management
- `VisionProcessor`: Frame capture, object detection (mocked)
- `EmotionAnalyzer`: Audio analysis logic
- `MultimodalCoordinator`: Context fusion, prompt enhancement

### Integration Tests
- Camera + Vision pipeline (end-to-end)
- Audio + Emotion pipeline (end-to-end)
- Multimodal → AI Router → Response

### Performance Tests
- Frame processing latency (target: < 100ms)
- Model loading time (target: < 2s)
- Memory usage (target: < 100MB increase)
- CPU usage (target: < 20% on average)

### Browser Compatibility
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅ (with polyfills)
- Edge 90+ ✅

---

## Monitoring & Analytics

### Metrics to Track
1. **Adoption:**
   - % of users enabling multimodal features
   - Average session duration with multimodal on

2. **Performance:**
   - Vision processing latency (p50, p95, p99)
   - Audio analysis latency
   - Model loading time

3. **Accuracy:**
   - Object detection confidence scores
   - Emotion detection confidence scores
   - User corrections/feedback

4. **Errors:**
   - Permission denial rate
   - Model load failures
   - Browser compatibility issues

### Logging
```typescript
// Example instrumentation
logEvent('multimodal_enabled', {
  vision: visionEnabled,
  audio: audioEnabled,
  timestamp: Date.now(),
});

logMetric('vision_processing_latency_ms', latency);
logMetric('emotion_confidence', emotion.confidence);
```

---

## Open Questions & Decisions

### 1. Vision Processing: Client vs. Server
**Options:**
- **Client-side (MVP):** TensorFlow.js in browser (chosen)
- **Server-side:** Anthropic Claude Vision API

**Decision:** Start with client-side (free, low latency), fallback to server for complex scenes.

### 2. Emotion Detection Provider
**Options:**
- **Web Audio API:** Free, basic (MVP)
- **Hume AI:** Specialized, $0.005/minute
- **Azure Speech:** Comprehensive, $1/1000 requests

**Decision:** Start with Web Audio API (MVP), upgrade to Hume AI for production.

### 3. Model Hosting
**Options:**
- **TensorFlow Hub:** Official, reliable
- **CDN:** Faster, cacheable
- **Self-hosted:** Full control

**Decision:** Use TensorFlow Hub for MVP, consider CDN for production.

### 4. Privacy: Data Retention
**Decision:** No data retention. All processing happens in real-time, no storage.

---

## Success Criteria

### MVP Launch
- [ ] Camera access working (front + back)
- [ ] Basic audio emotion detection (volume, pitch)
- [ ] Multimodal context passed to AI router
- [ ] Feature toggles functional
- [ ] Privacy UI (on/off, indicators)
- [ ] Unit tests passing (>80% coverage)
- [ ] Performance metrics within targets

### Production Launch
- [ ] Object detection working (>80% accuracy)
- [ ] Face detection working (>90% accuracy)
- [ ] Advanced emotion detection (Hume AI)
- [ ] A/B test showing improved user engagement
- [ ] No critical security vulnerabilities
- [ ] User satisfaction score > 4.5/5
- [ ] Feature adoption > 30% of active users

---

## Architecture Decision Record (ADR)

### ADR-001: Client-Side Vision Processing
**Context:** Need real-time vision processing with low latency and cost.  
**Decision:** Use TensorFlow.js + MediaPipe for client-side processing.  
**Rationale:** Free, fast, privacy-friendly, works offline.  
**Trade-offs:** Limited model accuracy vs. cloud APIs, requires user's GPU.

### ADR-002: Web Audio API for MVP Emotion
**Context:** Need basic emotion detection without external dependencies.  
**Decision:** Use Web Audio API for MVP, defer to Hume AI later.  
**Rationale:** No cost, no API keys, sufficient for MVP validation.  
**Trade-offs:** Lower accuracy than specialized ML models.

### ADR-003: Feature Flags for Gradual Rollout
**Context:** New feature with unknown performance/user behavior.  
**Decision:** Use existing feature flag system for gradual rollout.  
**Rationale:** Control risk, gather metrics, iterate safely.  
**Trade-offs:** Increased complexity in feature management.

### ADR-004: No Data Storage for Multimodal Inputs
**Context:** Privacy concerns around camera/mic data.  
**Decision:** All processing happens in-memory, no storage.  
**Rationale:** Minimize privacy risk, comply with regulations.  
**Trade-offs:** Cannot debug/replay multimodal sessions.

---

## Next Steps

1. **CEO Approval:** Review this architecture, confirm priorities
2. **Team Assignment:**
   - **Bubbles (Frontend):** UI components, React hooks
   - **Blossom (Backend):** API routes (if needed), feature flags
   - **Guy (DBA):** Feature flag schema updates
   - **Pushpa (UI/UX):** Multimodal UI design (camera preview, emotion indicators)
   - **Buttercup (QA):** Test plan, browser compatibility matrix

3. **Kickoff Meeting:** Align team on scope, timeline, success metrics
4. **Spike:** Prototype TensorFlow.js integration (1 day)
5. **Implementation:** Follow Phase 1 roadmap (2 weeks)

---

## Appendix

### A. Existing Code Patterns to Follow
- **Media handling:** `/src/lib/cq-to-cq/webrtc-calls.ts` (camera/mic access)
- **Feature flags:** `/src/lib/feature-flags/server.ts`
- **AI routing:** `/src/lib/ai/router.ts` (provider selection)
- **Audio context:** `/src/lib/audio/audioContext.ts` (Web Audio API)

### B. Useful Resources
- [TensorFlow.js Models](https://github.com/tensorflow/tfjs-models)
- [MediaPipe Face Detection](https://google.github.io/mediapipe/solutions/face_detection.html)
- [Hume AI Voice API](https://docs.hume.ai/docs/voice-api)
- [Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### C. Example Implementations
- **Vision:** Google's Teachable Machine
- **Emotion:** Hume AI demos
- **Multimodal:** OpenAI's GPT-4V

---

**END OF ARCHITECTURE DOCUMENT**

---

## Sign-Off

**Author:** MO (CTO)  
**Reviewed By:** [Pending CEO approval]  
**Status:** READY FOR REVIEW  
**Next Action:** Schedule architecture review with full team

