# Multimodal AI - Quick Start Guide

**For:** Developers implementing multimodal features  
**By:** MO (CTO)  
**Last Updated:** 2025-02-08

---

## TL;DR

We're adding **vision (camera)** and **enhanced audio (emotion detection)** to CUBIQO. This guide gets you coding fast.

---

## What We're Building

```
User talks + shows camera → AI sees + hears + understands emotion → Better responses
```

**Example:**
```
User: *shows coffee mug to camera, speaking excitedly*
AI: "I see you've got your coffee! You sound energized—ready to tackle the day?"
```

---

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd @mediapipe/face_detection
```

### 2. Create Folder Structure

```bash
mkdir -p src/lib/multimodal/{vision,audio}
mkdir -p src/components/multimodal
mkdir -p src/hooks
```

### 3. Copy Starter Files

All starter code is in `/docs/MULTIMODAL_AI_ARCHITECTURE.md` (see Components section).

---

## For Frontend Devs (Bubbles)

### Your Tasks
1. Build camera UI component
2. Build emotion indicator
3. Build multimodal toggle switch
4. Create React hooks

### Start Here: `CameraView.tsx`

```tsx
'use client';

import { useCamera } from '@/hooks/useCamera';
import { useVision } from '@/hooks/useVision';
import { useRef, useEffect } from 'react';

export function CameraView({ enabled }: { enabled: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, startCamera, stopCamera, permission } = useCamera(enabled);
  const { detections } = useVision(videoRef.current, enabled);

  useEffect(() => {
    if (enabled && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, enabled]);

  if (permission === 'denied') {
    return <div>Camera access denied. Please enable in settings.</div>;
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-lg"
      />
      
      {/* Overlay detections */}
      {detections?.objects.map((obj, i) => (
        <div
          key={i}
          className="absolute border-2 border-green-500"
          style={{
            left: obj.bbox.x,
            top: obj.bbox.y,
            width: obj.bbox.width,
            height: obj.bbox.height,
          }}
        >
          <span className="bg-green-500 text-white px-2 py-1 text-xs">
            {obj.label} ({Math.round(obj.confidence * 100)}%)
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Hook: `useCamera.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';

export function useCamera(enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [error, setError] = useState<Error | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: false, // We handle audio separately
      });
      setStream(mediaStream);
      setPermission('granted');
    } catch (err) {
      setError(err as Error);
      setPermission('denied');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (enabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [enabled]);

  return { stream, permission, error, startCamera, stopCamera };
}
```

---

## For Backend Devs (Blossom)

### Your Tasks
1. Add feature flags to database
2. Create API route for server-side vision (optional)
3. Update AI router to accept multimodal context

### 1. Feature Flags (Supabase)

```sql
-- Run this in Supabase SQL editor
INSERT INTO feature_flags (name, scope, enabled, rollout_percentage, description)
VALUES
  ('multimodal_vision', 'global', true, 10, 'Camera-based vision processing'),
  ('multimodal_audio', 'global', true, 100, 'Enhanced audio emotion detection'),
  ('multimodal_emotion', 'global', false, 0, 'Advanced emotion recognition (Hume AI)')
ON CONFLICT (name) DO NOTHING;
```

### 2. Update AI Router

```typescript
// src/lib/ai/router.ts

import type { MultimodalContext } from '@/lib/multimodal/types';

export async function callAI(
  messages: Array<{ role: string; content: string }>,
  options?: AIOptions & {
    multimodalContext?: MultimodalContext; // NEW
  }
): Promise<AIResponse> {
  // Inject multimodal context into system message
  if (options?.multimodalContext) {
    const systemContext = buildMultimodalSystemPrompt(options.multimodalContext);
    messages.unshift({
      role: 'system',
      content: systemContext,
    });
  }

  // Existing routing logic...
  return await routeToProvider(messages, options);
}

function buildMultimodalSystemPrompt(context: MultimodalContext): string {
  const parts: string[] = ['[MULTIMODAL CONTEXT]'];

  if (context.vision?.objects.length) {
    parts.push(
      `VISION: User is showing ${context.vision.objects.map((o) => o.label).join(', ')}`
    );
  }

  if (context.audio?.emotion) {
    parts.push(
      `EMOTION: User sounds ${context.audio.emotion.primary} (${Math.round(context.audio.emotion.confidence * 100)}% confident)`
    );
  }

  parts.push('Incorporate this context naturally in your response.');
  return parts.join('\n');
}
```

---

## For DBA (Guy)

### Your Task
Ensure feature flags table exists and is properly indexed.

```sql
-- Check if feature_flags table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'feature_flags';

-- If missing, create it (should already exist)
-- See /src/lib/feature-flags/server.ts for schema

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_name 
ON feature_flags(name);

CREATE INDEX IF NOT EXISTS idx_feature_flags_scope 
ON feature_flags(scope, enabled);
```

---

## For UI/UX (Pushpa)

### Your Tasks
1. Design camera preview component
2. Design emotion indicator (emoji/color)
3. Design multimodal toggle (on/off switch)
4. Design permission prompt modal

### Design Specs

**Camera Preview:**
- Size: 320x240px (default), expandable to fullscreen
- Position: Bottom-right corner (floating)
- Style: Rounded corners, subtle shadow
- Indicator: Green dot when active

**Emotion Indicator:**
- Display: Emoji + text label
- Position: Above cube (floating)
- Emotions: 😊 happy, 😢 sad, 😠 angry, 😐 neutral, 🤩 excited, 😌 calm
- Animation: Smooth fade transition (300ms)

**Multimodal Toggle:**
- Style: iOS-style switch
- Labels: "Camera" | "Audio Analysis"
- Colors: Green (on), Gray (off)
- Position: Settings panel

**Permission Prompt:**
- Modal: Centered, with blur backdrop
- Title: "Enable Camera & Microphone"
- Body: Explain why we need access
- Buttons: "Allow" (primary), "Not Now" (secondary)
- Icon: Camera + mic icons

---

## For QA (Buttercup)

### Your Tasks
1. Write test plan for multimodal features
2. Test browser compatibility
3. Test permission flows
4. Test error handling

### Test Checklist

**Camera Access:**
- [ ] Requests permission on first use
- [ ] Shows error if denied
- [ ] Switches between front/back camera
- [ ] Stops stream when toggled off
- [ ] Works in Chrome, Firefox, Safari, Edge

**Vision Processing:**
- [ ] Detects common objects (cup, laptop, phone)
- [ ] Draws bounding boxes correctly
- [ ] Shows confidence scores
- [ ] Handles low-light conditions gracefully
- [ ] Performance: 30fps video, 1fps detection

**Audio Emotion:**
- [ ] Detects basic emotions (happy, sad, angry)
- [ ] Updates in real-time (< 500ms latency)
- [ ] Shows confidence scores
- [ ] Handles silence (neutral emotion)
- [ ] No audio dropouts or glitches

**Integration:**
- [ ] AI receives multimodal context
- [ ] Responses incorporate vision/emotion
- [ ] Feature flags work correctly
- [ ] No crashes or memory leaks

**Edge Cases:**
- [ ] No camera available (desktop)
- [ ] Permission denied
- [ ] Network error during model load
- [ ] Browser doesn't support getUserMedia
- [ ] User disables camera mid-session

---

## Common Pitfalls

### 1. HTTPS Required
**Problem:** `getUserMedia()` only works on HTTPS (or localhost).  
**Solution:** Always test on `localhost` or deploy to staging (HTTPS).

### 2. Permission Denied
**Problem:** User denies camera access, app breaks.  
**Solution:** Handle `permission: 'denied'` state gracefully.

```typescript
if (permission === 'denied') {
  return <PermissionDeniedUI onRetry={startCamera} />;
}
```

### 3. Model Loading Slow
**Problem:** TensorFlow.js models take 2-5 seconds to load.  
**Solution:** Show loading spinner, lazy load on first use.

```typescript
const [modelsLoaded, setModelsLoaded] = useState(false);

useEffect(() => {
  loadModels().then(() => setModelsLoaded(true));
}, []);

if (!modelsLoaded) {
  return <div>Loading AI models...</div>;
}
```

### 4. High CPU Usage
**Problem:** Processing every frame (30fps) is too intensive.  
**Solution:** Throttle to 1fps (process every 30th frame).

```typescript
let frameCount = 0;
const processFrame = () => {
  frameCount++;
  if (frameCount % 30 === 0) {
    // Process this frame
    detectObjects(videoRef.current);
  }
  requestAnimationFrame(processFrame);
};
```

### 5. Memory Leaks
**Problem:** Video streams not cleaned up.  
**Solution:** Always stop tracks in `useEffect` cleanup.

```typescript
useEffect(() => {
  // Start camera...
  
  return () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };
}, [stream]);
```

---

## Testing

### Unit Tests (Vitest)

```typescript
// __tests__/multimodal/camera-manager.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CameraManager } from '@/lib/multimodal/vision/camera-manager';

describe('CameraManager', () => {
  it('should request camera permission', async () => {
    const mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [],
    });
    
    global.navigator.mediaDevices = {
      getUserMedia: mockGetUserMedia,
    } as any;
    
    const manager = new CameraManager();
    await manager.startCamera();
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: expect.any(Object),
      audio: false,
    });
  });
});
```

### Integration Test

```typescript
// __tests__/multimodal/integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { CameraView } from '@/components/multimodal/CameraView';

test('camera view displays when enabled', async () => {
  render(<CameraView enabled={true} />);
  
  await waitFor(() => {
    expect(screen.getByRole('video')).toBeInTheDocument();
  });
});
```

---

## Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Camera start time | < 1s | Time from `startCamera()` to `stream` ready |
| Model load time | < 3s | Time from import to `model.ready` |
| Frame processing | < 100ms | Time to process one frame |
| Memory usage | < 100MB | Chrome DevTools → Memory tab |
| CPU usage | < 20% | Chrome DevTools → Performance tab |
| Bundle size | < 10MB increase | `next build` output |

---

## Debugging Tips

### 1. Check Camera Stream
```javascript
// In browser console
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => console.log('Camera OK', stream))
  .catch((err) => console.error('Camera Error', err));
```

### 2. Check TensorFlow.js
```javascript
// In browser console
import * as tf from '@tensorflow/tfjs';
console.log('TensorFlow.js version:', tf.version);
console.log('Backend:', tf.getBackend());
```

### 3. Inspect Detections
```typescript
const detections = await model.detect(videoElement);
console.log('Detections:', detections);
```

### 4. Monitor Performance
```typescript
const start = performance.now();
await processFrame(video);
const duration = performance.now() - start;
console.log(`Processing took ${duration}ms`);
```

---

## Need Help?

1. **Read the full architecture:** `/docs/MULTIMODAL_AI_ARCHITECTURE.md`
2. **Check existing patterns:** `/src/lib/cq-to-cq/webrtc-calls.ts`
3. **Ask MO (CTO):** For architectural questions
4. **Ask team:** Bubbles (UI), Blossom (API), Guy (DB), Pushpa (design)

---

## Useful Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Check bundle size
npm run build

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

---

## Resources

- [TensorFlow.js Guide](https://www.tensorflow.org/js/guide)
- [MediaPipe Docs](https://google.github.io/mediapipe/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

---

**Ready to code? Start with the camera hook (`useCamera.ts`) and camera view component (`CameraView.tsx`). Ship fast, iterate often. 🚀**

