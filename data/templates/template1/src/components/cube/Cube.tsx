'use client'

/**
 * CubiQo Cube Component
 * The heart of CubiQo - a living, breathing, emotionally-aware 3D cube
 */

import { useRef, useMemo } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { getColor, type ColorName } from '@/config/colors'

// Animation state type
export type AnimationState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface CubeProps {
  colorName?: ColorName
  animationState?: AnimationState
  onBounce?: () => void
}

// Lerp helper
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function Cube({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  onBounce 
}: CubeProps) {
  // Refs
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const eyeGroupRef = useRef<THREE.Group>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  const leftPupilRef = useRef<THREE.Mesh>(null)
  const rightPupilRef = useRef<THREE.Mesh>(null)

  // Get color config
  const colorConfig = useMemo(() => getColor(colorName), [colorName])

  // Animation state refs (persisted across renders)
  const stateRef = useRef({
    // Time
    time: 0,
    
    // Color transition
    currentColor: new THREE.Color(colorConfig.hex),
    currentEmissive: new THREE.Color(colorConfig.emissive),
    targetColor: new THREE.Color(colorConfig.hex),
    targetEmissive: new THREE.Color(colorConfig.emissive),
    
    // Animation params (lerped)
    currentAnimSpeed: colorConfig.animationSpeed,
    currentBreathSpeed: colorConfig.breathingSpeed,
    currentGlowIntensity: colorConfig.glowIntensity,
    currentMouseFollowSpeed: colorConfig.mouseFollowSpeed,
    
    // Animation phases (accumulated)
    idleSwayPhaseY: 0,
    idleSwayPhaseX: 0,
    breathingPhase: 0,
    
    // Mouse tracking
    mouseX: 0,
    mouseY: 0,
    currentMouseRotation: { x: 0, y: 0 },
    targetMouseRotation: { x: 0, y: 0 },
    
    // State rotations
    currentStateRotation: { x: 0, y: 0, z: 0 },
    targetStateRotation: { x: 0, y: 0, z: 0 },
    
    // Bounce
    isBouncing: false,
    bounceProgress: 0,
    bounceDuration: 0.8,
    bounceHeight: 0.15,
    idleBounceTimer: 0,
    nextIdleBounceTime: 15 + Math.random() * 10,
    
    // Listening
    listeningIntensity: 0,
    
    // Thinking
    thinkingTime: 0,
    
    // Speaking
    speakingTime: 0,
    
    // Blinking
    blinkTimer: 0,
    isBlinking: false,
    nextBlinkTime: 3 + Math.random() * 4,
    blinkCount: 0,
    
    // Previous state (for transitions)
    prevAnimationState: 'idle' as AnimationState,
    prevColorName: 'ORANGE' as ColorName,
  })

  // Update targets when color changes
  useMemo(() => {
    const state = stateRef.current
    state.targetColor = new THREE.Color(colorConfig.hex)
    state.targetEmissive = new THREE.Color(colorConfig.emissive)
    
    // Trigger bounce on color change
    if (state.prevColorName !== colorName) {
      state.isBouncing = true
      state.bounceProgress = 0
      state.prevColorName = colorName
    }
  }, [colorConfig, colorName])

  // Animation frame
  useFrame((frameState, delta) => {
    if (!meshRef.current || !materialRef.current) return
    
    const state = stateRef.current
    state.time += delta
    
    // Get mouse position from pointer
    state.mouseX = frameState.pointer.x
    state.mouseY = frameState.pointer.y
    
    // === BASE POSITION ===
    let baseY = Math.sin(state.time * 0.5) * 0.03
    
    // === IDLE BOUNCE ===
    if (!state.isBouncing) {
      state.idleBounceTimer += delta
      if (state.idleBounceTimer >= state.nextIdleBounceTime) {
        state.isBouncing = true
        state.bounceProgress = 0
        state.idleBounceTimer = 0
        state.nextIdleBounceTime = 15 + Math.random() * 10
        onBounce?.()
      }
    }
    
    // === BOUNCE ANIMATION ===
    if (state.isBouncing) {
      state.bounceProgress += delta / state.bounceDuration
      if (state.bounceProgress >= 1) {
        state.bounceProgress = 0
        state.isBouncing = false
      } else {
        const t = state.bounceProgress
        const bounceEffect = Math.sin(t * Math.PI) * state.bounceHeight
        baseY += bounceEffect
      }
    }
    
    meshRef.current.position.y = baseY
    
    // === LERP ANIMATION PARAMETERS ===
    const transitionSpeed = delta
    state.currentAnimSpeed = lerp(state.currentAnimSpeed, colorConfig.animationSpeed, transitionSpeed)
    state.currentBreathSpeed = lerp(state.currentBreathSpeed, colorConfig.breathingSpeed, transitionSpeed)
    state.currentGlowIntensity = lerp(state.currentGlowIntensity, colorConfig.glowIntensity, transitionSpeed)
    state.currentMouseFollowSpeed = lerp(state.currentMouseFollowSpeed, colorConfig.mouseFollowSpeed, transitionSpeed)
    
    // === ACCUMULATE PHASES ===
    state.idleSwayPhaseY += delta * state.currentAnimSpeed
    state.idleSwayPhaseX += delta * state.currentAnimSpeed * 0.7
    state.breathingPhase += delta * state.currentBreathSpeed
    
    // === IDLE SWAY ===
    const idleSwayY = Math.sin(state.idleSwayPhaseY) * (10 * Math.PI / 180)
    const idleSwayX = Math.sin(state.idleSwayPhaseX) * (8 * Math.PI / 180)
    
    // === STATE-BASED ROTATION ===
    state.targetStateRotation.x = 0
    state.targetStateRotation.y = 0
    state.targetStateRotation.z = 0
    
    // LISTENING: Slower nodding
    if (animationState === 'listening') {
      state.listeningIntensity += delta * 3
      const nodSpeed = 1.8
      const nodAngle = Math.sin(state.listeningIntensity * nodSpeed) * (10 * Math.PI / 180)
      state.targetStateRotation.x = nodAngle
    } else {
      state.listeningIntensity = 0
    }
    
    // THINKING: V-shaped movement
    if (animationState === 'thinking') {
      state.thinkingTime += delta
      const vSpeed = 0.4
      const vProgress = (state.thinkingTime * vSpeed) % 2
      
      let vAngle: number
      if (vProgress < 1) {
        vAngle = -vProgress * (12 * Math.PI / 180)
      } else {
        vAngle = -(2 - vProgress) * (12 * Math.PI / 180)
      }
      
      state.targetStateRotation.x = vAngle
      state.targetStateRotation.z = Math.sin(state.thinkingTime * 0.3) * (3 * Math.PI / 180)
    } else {
      state.thinkingTime = 0
    }
    
    // SPEAKING: Gentle nod
    if (animationState === 'speaking') {
      state.speakingTime += delta
      const speakNodSpeed = 2.5
      const speakNodAngle = Math.sin(state.speakingTime * speakNodSpeed) * (7 * Math.PI / 180)
      state.targetStateRotation.x = speakNodAngle
      state.targetStateRotation.z = Math.sin(state.speakingTime * 1.5) * (2 * Math.PI / 180)
    } else {
      state.speakingTime = 0
    }
    
    // Smooth state rotation transition
    const rotationTransitionSpeed = 3
    state.currentStateRotation.x = lerp(state.currentStateRotation.x, state.targetStateRotation.x, delta * rotationTransitionSpeed)
    state.currentStateRotation.y = lerp(state.currentStateRotation.y, state.targetStateRotation.y, delta * rotationTransitionSpeed)
    state.currentStateRotation.z = lerp(state.currentStateRotation.z, state.targetStateRotation.z, delta * rotationTransitionSpeed)
    
    // === MOUSE TRACKING ===
    state.targetMouseRotation.x = -state.mouseY * (20 * Math.PI / 180)
    state.targetMouseRotation.y = state.mouseX * (20 * Math.PI / 180)
    
    state.currentMouseRotation.x += (state.targetMouseRotation.x - state.currentMouseRotation.x) * state.currentMouseFollowSpeed
    state.currentMouseRotation.y += (state.targetMouseRotation.y - state.currentMouseRotation.y) * state.currentMouseFollowSpeed
    
    // === APPLY ROTATION ===
    meshRef.current.rotation.x = state.currentMouseRotation.x + idleSwayX + state.currentStateRotation.x
    meshRef.current.rotation.y = state.currentMouseRotation.y + idleSwayY + state.currentStateRotation.y
    meshRef.current.rotation.z = state.currentStateRotation.z
    
    // === BREATHING / GLOW ===
    let breathingIntensity = state.currentGlowIntensity + Math.sin(state.breathingPhase) * 0.15
    
    if (animationState === 'listening') {
      const listeningPulse = Math.sin(state.listeningIntensity * 1.5) * 0.15
      breathingIntensity += listeningPulse
      
      const scalePulse = 1 + Math.sin(state.listeningIntensity * 1.5) * 0.01
      meshRef.current.scale.setScalar(scalePulse)
    } else {
      meshRef.current.scale.setScalar(1)
    }
    
    materialRef.current.emissiveIntensity = breathingIntensity
    
    // === COLOR TRANSITION ===
    state.currentColor.lerp(state.targetColor, delta * 2)
    state.currentEmissive.lerp(state.targetEmissive, delta * 2)
    materialRef.current.color.copy(state.currentColor)
    materialRef.current.emissive.copy(state.currentEmissive)
    
    // === BLINKING ===
    updateBlinking(delta, state, animationState, colorConfig)
    
    // === PUPIL TRACKING ===
    if (leftPupilRef.current && rightPupilRef.current) {
      const pupilRange = 0.04
      leftPupilRef.current.position.x = -0.3 + state.mouseX * pupilRange
      leftPupilRef.current.position.y = 0.3 + state.mouseY * pupilRange
      rightPupilRef.current.position.x = 0.3 + state.mouseX * pupilRange
      rightPupilRef.current.position.y = 0.3 + state.mouseY * pupilRange
    }
  })
  
  // Blinking logic
  function updateBlinking(
    delta: number, 
    state: typeof stateRef.current, 
    animState: AnimationState,
    config: typeof colorConfig
  ) {
    state.blinkTimer += delta
    
    let blinkSpeed = config.blinkSpeed
    if (animState === 'listening') blinkSpeed = 0.25
    
    // Blink interval based on state
    let blinkInterval: number
    if (animState === 'listening') {
      blinkInterval = 2 + Math.random() * 1.5
    } else if (animState === 'thinking') {
      blinkInterval = 6 + Math.random() * 4
    } else if (animState === 'speaking') {
      blinkInterval = 2 + Math.random() * 2
    } else {
      blinkInterval = 4 + Math.random() * 5
    }
    
    if (!state.isBlinking && state.blinkTimer >= state.nextBlinkTime) {
      state.isBlinking = true
      state.blinkTimer = 0
      state.blinkCount = 0
    }
    
    if (state.isBlinking && leftEyeRef.current && rightEyeRef.current) {
      const blinkProgress = state.blinkTimer / blinkSpeed
      
      if (blinkProgress >= 1) {
        if (config.blinkStyle === 'double' && state.blinkCount === 0) {
          state.blinkCount = 1
          state.blinkTimer = 0
          leftEyeRef.current.scale.y = 1
          rightEyeRef.current.scale.y = 1
        } else {
          state.isBlinking = false
          state.blinkTimer = 0
          state.blinkCount = 0
          state.nextBlinkTime = blinkInterval
          leftEyeRef.current.scale.y = 1
          rightEyeRef.current.scale.y = 1
        }
      } else {
        const scaleY = Math.abs(Math.sin(blinkProgress * Math.PI))
        leftEyeRef.current.scale.y = scaleY
        rightEyeRef.current.scale.y = scaleY
      }
    }
  }

  // Click handler for manual bounce
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    stateRef.current.isBouncing = true
    stateRef.current.bounceProgress = 0
    onBounce?.()
  }

  return (
    <group>
      <RoundedBox
        ref={meshRef}
        args={[2, 2, 2]}
        radius={0.15}
        smoothness={4}
        castShadow
        onClick={handleClick}
      >
        <meshPhysicalMaterial
          ref={materialRef}
          color={colorConfig.hex}
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={0.85}
          transmission={0.3}
          thickness={0.5}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
          emissive={colorConfig.emissive}
          emissiveIntensity={colorConfig.glowIntensity}
          ior={1.5}
        />
        
        {/* Eyes Group */}
        <group ref={eyeGroupRef}>
          {/* Left Eye */}
          <mesh ref={leftEyeRef} position={[-0.3, 0.3, 1.01]}>
            <circleGeometry args={[0.15, 32]} />
            <meshBasicMaterial color={0x000000} />
          </mesh>
          
          {/* Right Eye */}
          <mesh ref={rightEyeRef} position={[0.3, 0.3, 1.01]}>
            <circleGeometry args={[0.15, 32]} />
            <meshBasicMaterial color={0x000000} />
          </mesh>
          
          {/* Left Pupil */}
          <mesh ref={leftPupilRef} position={[-0.3, 0.3, 1.02]}>
            <circleGeometry args={[0.08, 32]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
          
          {/* Right Pupil */}
          <mesh ref={rightPupilRef} position={[0.3, 0.3, 1.02]}>
            <circleGeometry args={[0.08, 32]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
        </group>
      </RoundedBox>
    </group>
  )
}

