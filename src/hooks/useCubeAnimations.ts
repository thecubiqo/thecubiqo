'use client'

/**
 * TFR-009: Missing 3D Cube Animations
 *
 * Three animation sequences for the EnergyCube group:
 *   • Wink       — playful squash + brighten (milestone moments)
 *   • TrustEarned — slow expand → contract with colour bloom (earned rapport)
 *   • Handoff    — rotation + lateral slide to sub-agent (delegation event)
 *
 * The hook manages animation state and returns props to pass directly to
 * the EnergyCube group ref (position, scale override, extra uniforms).
 *
 * Usage:
 *   const { triggerWink, triggerTrustEarned, triggerHandoff, animOverrides } = useCubeAnimations()
 *   <EnergyCube animOverrides={animOverrides} />
 */

import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type CubeAnimationType = 'wink' | 'trust_earned' | 'handoff' | null

interface AnimState {
    type: CubeAnimationType
    progress: number   // 0 → 1
    duration: number   // seconds
}

export interface AnimOverrides {
    scaleBoost: number      // 1.0 = no boost
    brightnessBoost: number // 1.0 = no boost
    lateralOffset: number   // x-axis offset (for handoff)
}

export function useCubeAnimations(onHandoffComplete?: () => void) {
    const animRef = useRef<AnimState>({ type: null, progress: 0, duration: 0 })
    const overridesRef = useRef<AnimOverrides>({ scaleBoost: 1, brightnessBoost: 1, lateralOffset: 0 })

    const triggerWink = useCallback(() => {
        animRef.current = { type: 'wink', progress: 0, duration: 0.6 }
    }, [])

    const triggerTrustEarned = useCallback(() => {
        animRef.current = { type: 'trust_earned', progress: 0, duration: 1.8 }
    }, [])

    const triggerHandoff = useCallback(() => {
        animRef.current = { type: 'handoff', progress: 0, duration: 1.2 }
    }, [])

    // Called inside a useFrame in the parent scene
    const updateAnimations = useCallback((delta: number) => {
        const anim = animRef.current
        if (!anim.type) return

        anim.progress = Math.min(anim.progress + delta / anim.duration, 1)
        const t = anim.progress

        switch (anim.type) {
            case 'wink': {
                // Fast squash on Y, quick scale pop, then back
                const squash = t < 0.3
                    ? 1 - t * 0.8         // compress
                    : t < 0.6
                        ? 0.76 + (t - 0.3) * 3.2  // expand back + overshoot
                        : 1 + (1 - t) * 0.15  // settle
                overridesRef.current = {
                    scaleBoost: squash,
                    brightnessBoost: 1 + Math.sin(t * Math.PI) * 0.6,
                    lateralOffset: 0
                }
                break
            }
            case 'trust_earned': {
                // Slow expand → bloom → gentle settle
                const expand = t < 0.4
                    ? 1 + t * 0.8
                    : t < 0.7
                        ? 1.32 - (t - 0.4) * 0.6
                        : 1.14 - (t - 0.7) * 0.47
                overridesRef.current = {
                    scaleBoost: expand,
                    brightnessBoost: 1 + Math.sin(t * Math.PI) * 1.2,
                    lateralOffset: 0
                }
                break
            }
            case 'handoff': {
                // Rotate + slide right, fade brightness down
                const slide = t < 0.7 ? t * 3.2 : 2.24 + (t - 0.7) * (-2.24 / 0.3)
                overridesRef.current = {
                    scaleBoost: 1 - t * 0.15,
                    brightnessBoost: 1 - t * 0.4,
                    lateralOffset: slide
                }
                if (t >= 1 && onHandoffComplete) onHandoffComplete()
                break
            }
        }

        if (t >= 1) {
            animRef.current = { type: null, progress: 0, duration: 0 }
            overridesRef.current = { scaleBoost: 1, brightnessBoost: 1, lateralOffset: 0 }
        }
    }, [onHandoffComplete])

    return {
        triggerWink,
        triggerTrustEarned,
        triggerHandoff,
        updateAnimations,
        overridesRef
    }
}

/**
 * CubeAnimationDriver — drop into the R3F scene alongside EnergyCubeScene.
 * Calls updateAnimations each frame and applies overrides to the cube group.
 */
export function CubeAnimationDriver({
    cubeGroupRef,
    overridesRef,
    updateAnimations
}: {
    cubeGroupRef: React.RefObject<THREE.Group>
    overridesRef: React.RefObject<AnimOverrides>
    updateAnimations: (delta: number) => void
}) {
    useFrame((_, delta) => {
        updateAnimations(delta)
        if (!cubeGroupRef.current) return
        const o = overridesRef.current
        if (!o) return

        // Apply lateral offset (handoff slide)
        cubeGroupRef.current.position.x = THREE.MathUtils.lerp(
            cubeGroupRef.current.position.x,
            o.lateralOffset,
            delta * 6
        )
    })

    return null // render nothing, just drives animation
}
