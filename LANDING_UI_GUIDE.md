# Landing Page UI Guide

This guide explains the two landing cube designs available in CubiQo and how to switch between them.

## 🎨 Available Landing Designs

### 1. Plasma Wave Field (Default)
**Component:** `LandingCube` → `PlasmaWaveField`

**Description:**
- Beautiful flowing plasma waves with ribbon-like movements
- Gradient colors: Cyan → Blue → Purple → Magenta → Pink → Red-Orange
- 120,000+ particles for HD visual density
- Orange soul nodes at wave intersections
- Smooth, organic, meditative aesthetic

**Best for:**
- Calm, welcoming first impression
- Artistic, flowing brand identity
- Showcasing smooth animations

**Preview:** `/landing-demo`

![Plasma Wave Landing](https://github.com/user-attachments/assets/7f126c20-cb97-45e1-966f-0ee063853f25)

### 2. Tech Wireframe Energy Cube
**Component:** `TechLandingCube`

**Description:**
- High-tech wireframe cube with glowing energy lines
- Custom GLSL shaders with simplex noise
- Voice-reactive animations (cube breathes and glows orange)
- Blue/purple/pink energy flows with orange accents
- Sharp, geometric, high-tech aesthetic
- Additive blending for intense glow effects

**Best for:**
- Tech-forward brand positioning
- Interactive, responsive feel
- Emphasizing AI/technology aspect

**Preview:** `/landing-preview`

![Tech Wireframe Cube](https://github.com/user-attachments/assets/a7bc20d2-b793-4339-b0d5-5739233ae9db)

## 🔧 Switching Between Designs

### Method 1: Configuration File (Persistent)

Edit `/src/config/landing.ts`:

```typescript
export const landingConfig: LandingConfig = {
  defaultVariant: 'plasma-wave',  // Change to 'tech-wireframe'
  allowUrlOverride: true,
  enableLanding: true,
}
```

**Available variants:**
- `'plasma-wave'` - Flowing plasma waves (default)
- `'tech-wireframe'` - Wireframe energy cube

### Method 2: URL Parameter (Testing/Preview)

Add a URL parameter to test designs without changing code:

- Plasma Wave: `http://localhost:3000/?landing=plasma-wave`
- Tech Wireframe: `http://localhost:3000/?landing=tech-wireframe`

This only works when `allowUrlOverride: true` in config.

### Method 3: Direct Component Usage

You can also use the components directly:

```tsx
import { LandingCube } from '@/components/LandingCube'
import { TechLandingCube } from '@/components/TechLandingCube'

// Use plasma wave
<LandingCube onComplete={handleComplete} />

// Use tech wireframe
<TechLandingCube onComplete={handleComplete} isVoiceActive={false} />
```

## 📁 Component Architecture

```
src/
├── components/
│   ├── LandingCube.tsx              # Plasma wave landing
│   ├── TechLandingCube.tsx          # Tech wireframe landing
│   ├── LandingCubeRouter.tsx        # Unified router (NEW)
│   ├── cube/
│   │   ├── PlasmaWaveField.tsx      # 120K particle plasma system
│   │   └── ...
│   └── landing/
│       ├── ParticleLanding.tsx      # Alternative particle system
│       └── LandingOverlay.tsx       # UI overlay for particle demo
├── config/
│   └── landing.ts                   # Landing configuration (NEW)
└── app/
    ├── page.tsx                     # Main page (uses router)
    ├── landing-preview/             # Tech wireframe preview
    └── landing-demo/                # Particle landing demo
```

## 🎯 Integration Points

The landing cube appears in:

1. **Main App Launch** (`FullscreenApp.tsx`)
   - Shows on first visit or after 4+ hours
   - Uses `LandingCubeRouter` for flexible design switching
   - Dismissible by tapping anywhere

2. **Preview Pages**
   - `/landing-preview` - Tech wireframe with voice testing
   - `/landing-demo` - Particle system demo

## 🚀 Rollback Strategy

All changes are **non-breaking and fully rollbackable**:

### To rollback to original state:
1. Delete `/src/config/landing.ts`
2. Delete `/src/components/LandingCubeRouter.tsx`
3. In `FullscreenApp.tsx`, change:
   ```tsx
   import { LandingCube } from './LandingCube'
   ```
   And use directly:
   ```tsx
   <LandingCube onComplete={() => setShowLandingCube(false)} />
   ```

### To disable landing entirely:
In `/src/config/landing.ts`:
```typescript
enableLanding: false
```

## 🎨 Customization

### Plasma Wave Customization
Edit `/src/components/LandingCube.tsx`:
- Adjust camera position for different viewing angles
- Change background gradients
- Modify floating particle count/colors

### Tech Wireframe Customization
Edit `/src/components/TechLandingCube.tsx`:
- Modify shader uniforms for different energy flows
- Adjust color palette (search for color definitions)
- Change rotation speeds and floating behavior
- Tune voice reactivity parameters

## 📊 Performance Notes

**Plasma Wave:**
- 120,000+ particles
- GPU-intensive but optimized
- Smooth on modern devices
- May throttle on low-end mobile

**Tech Wireframe:**
- Custom GLSL shaders
- Lighter particle count (40 sparkles)
- Better mobile performance
- Voice reactivity adds minimal overhead

## 🧪 Testing

Run the development server and test both designs:

```bash
npm run dev
```

Visit:
- `http://localhost:3000/?landing=plasma-wave`
- `http://localhost:3000/?landing=tech-wireframe`
- `http://localhost:3000/landing-preview`
- `http://localhost:3000/landing-demo`

## 📝 Notes

- Both designs maintain the same UX: "Tap anywhere to begin"
- Both integrate seamlessly with existing app state
- No authentication or API changes required
- Fully client-side rendering
- Both designs use React Three Fiber for 3D graphics
- Voice reactivity is only available in tech wireframe variant

## 🎬 Next Steps

1. Choose your preferred default design in `/src/config/landing.ts`
2. Test both variants with `?landing=` parameter
3. Gather user feedback on which design resonates better
4. Consider A/B testing with analytics
5. Optionally create user preference setting in the future

---

**Need help?** Check the component source files for detailed implementation notes.
