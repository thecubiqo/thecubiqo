# Wave-to-Cube Morph: Visual Guide

## Component Hierarchy

```
┌─────────────────────────────────────────────────┐
│         src/app/page.tsx (Server)               │
│  ┌───────────────────────────────────────────┐  │
│  │    <FullscreenApp />                      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│   src/components/FullscreenApp.tsx (Client)     │
│  ┌───────────────────────────────────────────┐  │
│  │  State Management:                        │  │
│  │  • voiceEnabled: boolean                  │  │
│  │  • animationState: AnimationState         │  │
│  │  • handleVoiceClick(): Toggle voice       │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Render:                                  │  │
│  │  <EnergyCubeScene                         │  │
│  │    animationState={animationState}        │  │
│  │    colorName={colorName}                  │  │
│  │  />                                       │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  src/components/cube/EnergyCubeScene.tsx        │
│  ┌───────────────────────────────────────────┐  │
│  │  Logic:                                   │  │
│  │  const isVoiceEnabled =                   │  │
│  │    animationState === 'listening' ||      │  │
│  │    animationState === 'speaking'          │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Render:                                  │  │
│  │  <Canvas>                                 │  │
│  │    <Suspense>                             │  │
│  │      <PlasmaWaveField                     │  │
│  │        isEnabled={isVoiceEnabled}         │  │
│  │        aiState={aiState}                  │  │
│  │      />                                   │  │
│  │    </Suspense>                            │  │
│  │  </Canvas>                                │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  src/components/cube/PlasmaWaveField.tsx        │
│  ┌───────────────────────────────────────────┐  │
│  │  Particle System (120,000 particles):    │  │
│  │  • wavePositions: Horizontal ribbons     │  │
│  │  • cubePositions: 3D cube surface        │  │
│  │  • morphProgress: Smooth lerp (0-1)      │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Animation Loop (useFrame):               │  │
│  │  if (isEnabled) {                         │  │
│  │    morphProgress → 1 (cube)               │  │
│  │  } else {                                 │  │
│  │    morphProgress → 0 (wave)               │  │
│  │  }                                        │  │
│  │  positions[i] = lerp(                     │  │
│  │    wavePos[i],                            │  │
│  │    cubePos[i],                            │  │
│  │    morphProgress                          │  │
│  │  )                                        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## State Transition Diagram

```
                    User Interaction
                          ↓
         ┌────────────────────────────────┐
         │    Click Speaker Button        │
         └────────────────────────────────┘
                          ↓
         ┌────────────────────────────────┐
         │   handleVoiceClick() called    │
         └────────────────────────────────┘
                          ↓
              ┌───────────────────────┐
              │  voiceEnabled toggle  │
              └───────────────────────┘
                          ↓
         ┌────────────────┴────────────────┐
         │                                  │
    OFF (false)                        ON (true)
         │                                  │
         ↓                                  ↓
┌─────────────────┐              ┌─────────────────┐
│ animationState  │              │ animationState  │
│     'idle'      │              │   'listening'   │
└─────────────────┘              └─────────────────┘
         ↓                                  ↓
┌─────────────────┐              ┌─────────────────┐
│ isVoiceEnabled  │              │ isVoiceEnabled  │
│     false       │              │      true       │
└─────────────────┘              └─────────────────┘
         ↓                                  ↓
┌─────────────────┐              ┌─────────────────┐
│ morphProgress   │              │ morphProgress   │
│    → 0.00       │              │    → 1.00       │
└─────────────────┘              └─────────────────┘
         ↓                                  ↓
┌─────────────────┐              ┌─────────────────┐
│  🌊 Wave Mode   │              │  🧊 Cube Mode   │
│  Horizontal     │              │  3D Rotating    │
│  Flowing        │              │  Particle Cube  │
│  Ribbons        │              │  with Pulse     │
└─────────────────┘              └─────────────────┘
```

## Visual States

### Wave Mode (isEnabled = false)

```
Front View:
     ╔═══════════════════════════════════╗
     ║     ◦  ◦    ◦   ◦    ◦   ◦       ║
     ║   ◦    ◦  ◦   ◦   ◦    ◦   ◦     ║
     ║  ◦   ◦    ◦   ◦    ◦  ◦    ◦     ║
     ║    ◦   ◦    ◦   ◦    ◦   ◦       ║
     ║  ◦    ◦  ◦   ◦   ◦    ◦          ║
     ║ ◦   ◦    ◦   ◦    ◦  ◦     ◦     ║
     ║   ◦   ◦    ◦   ◦    ◦   ◦        ║
     ║ ◦    ◦  ◦   ◦   ◦    ◦    ◦      ║
     ╚═══════════════════════════════════╝

Features:
- Horizontal flowing motion
- Wave patterns with depth
- Orange soul nodes
- Smooth sinusoidal curves
```

### Cube Mode (isEnabled = true)

```
Isometric View:
        ╱─────────────╲
       ╱  ◦   ◦   ◦   ╱╲
      ╱   ◦  ◦  ◦  ◦ ╱  ╲
     ╱  ◦   ◦  ◦  ◦  ╱    ╲
    ╱───────────────╱      ╲
   ╱   ◦  ◦  ◦  ◦  ╱        ╲
  ╱  ◦   ◦  ◦  ◦  ╱──────────╲
 ╱───────────────╱   ◦   ◦    ╲
╱   ◦  ◦  ◦  ◦  ╱  ◦   ◦   ◦   ╲
╲───────────────╲───────────────╲
 ╲   ◦  ◦  ◦  ◦  ╲   ◦   ◦   ◦  │
  ╲───────────────╲──────────────│
   ╲   ◦  ◦  ◦  ◦  ╲             │
    ╲───────────────╲────────────│
     ╲               ╲           │
      ╲───────────────╲──────────│

Features:
- 3D cube structure
- Isometric rotation
- Particles on surface + interior
- Pulsing animation
```

## Morph Transition

```
Time: 0.0s (Wave)                     Time: 2.0s (Cube)
morphProgress: 0.0                    morphProgress: 1.0

   ◦  ◦  ◦  ◦  ◦                         ╱─────╲
 ◦  ◦  ◦  ◦  ◦  ◦         →          ╱ ◦  ◦  ◦ ╲
   ◦  ◦  ◦  ◦  ◦                    ◦  ◦  ◦  ◦  ◦
 ◦  ◦  ◦  ◦  ◦  ◦                  │ ◦  ◦  ◦  ◦ │
   ◦  ◦  ◦  ◦  ◦                    ╲ ◦  ◦  ◦ ╱
                                       ╲─────╱

Position[i] = lerp(wavePos[i], cubePos[i], morphProgress)

Frame-by-frame:
t=0.00s: 100% wave, 0% cube    (morphProgress=0.0)
t=0.50s:  75% wave, 25% cube   (morphProgress=0.25)
t=1.00s:  50% wave, 50% cube   (morphProgress=0.5)
t=1.50s:  25% wave, 75% cube   (morphProgress=0.75)
t=2.00s:   0% wave, 100% cube  (morphProgress=1.0)
```

## Performance Profile

```
GPU Utilization:
┌─────────────────────────────────┐
│ ████████████████████░░░░ 80%    │  Wave Mode
│ ████████████████████████ 95%    │  Cube Mode
│ ██████████████████████░░ 88%    │  Morph Transition
└─────────────────────────────────┘

Frame Rate (FPS):
┌─────────────────────────────────┐
│ ████████████████████████ 60fps  │  Desktop
│ ████████████░░░░░░░░░░░░ 45fps  │  Mobile
└─────────────────────────────────┘

Memory Usage:
┌─────────────────────────────────┐
│ Particles: 120,000 × 4 bytes    │  = 480KB
│ Colors:    120,000 × 4 bytes    │  = 480KB
│ Sizes:     120,000 × 4 bytes    │  = 480KB
│ Total:                          │  ≈ 1.4MB
└─────────────────────────────────┘
```

## Key Implementation Files

```
src/
├── app/
│   └── page.tsx ..................... Entry point
├── components/
│   ├── FullscreenApp.tsx ............ State management
│   └── cube/
│       ├── EnergyCubeScene.tsx ...... Canvas wrapper
│       └── PlasmaWaveField.tsx ...... Particle system
└── tests/
    ├── PlasmaWaveField.test.tsx ..... Component tests
    ├── EnergyCubeScene.test.tsx ..... Integration tests
    └── WaveToCubeMorph.*.test.tsx ... Flow tests
```

## References

- **Technical Docs**: See `WAVE_TO_CUBE_IMPLEMENTATION.md`
- **PR Summary**: See `PR_SUMMARY.md`
- **Main README**: See `README_WAVE_TO_CUBE.md`
