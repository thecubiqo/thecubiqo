'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BiometricWatcherProps {
    isActive: boolean
    facePosition?: { x: number; y: number }
    engagement?: 'low' | 'medium' | 'high'
}

/**
 * BiometricWatcher - CLEAN VERSION
 * Removed all "broken grid" threads to match premium minimal UI.
 * Keeps only the interactive pupils if isActive is true.
 */
export function BiometricWatcher({
    isActive,
    facePosition = { x: 0, y: 0 },
    engagement = 'medium'
}: BiometricWatcherProps) {
    const leftPupilRef = useRef<THREE.Mesh>(null)
    const rightPupilRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (!isActive) return

        const time = state.clock.getElapsedTime()

        // Follow face or mouse
        const targetX = facePosition.x || state.pointer.x * 0.5
        const targetY = facePosition.y || state.pointer.y * 0.5

        const pupilX = targetX * 0.2
        const pupilY = targetY * 0.2

        // Pulse speed based on engagement
        const pulseFreq = engagement === 'high' ? 8.0 : engagement === 'medium' ? 4.0 : 2.5
        const pulseScale = 1 + Math.sin(time * pulseFreq) * (engagement === 'high' ? 0.2 : 0.1)
        const emissivePulse = 4 + Math.sin(time * pulseFreq) * (engagement === 'high' ? 3 : 1)

        if (leftPupilRef.current) {
            leftPupilRef.current.position.x = -0.5 + pupilX
            leftPupilRef.current.position.y = pupilY
            leftPupilRef.current.scale.setScalar(pulseScale)
            if (leftPupilRef.current.material instanceof THREE.MeshStandardMaterial) {
                leftPupilRef.current.material.emissiveIntensity = emissivePulse
            }
        }

        if (rightPupilRef.current) {
            const rightPulseScale = 1 + Math.sin(time * pulseFreq + 0.5) * (engagement === 'high' ? 0.2 : 0.1)
            const rightEmissivePulse = 4 + Math.sin(time * pulseFreq + 0.5) * (engagement === 'high' ? 3 : 1)
            rightPupilRef.current.position.x = 0.5 + pupilX
            rightPupilRef.current.position.y = pupilY
            rightPupilRef.current.scale.setScalar(rightPulseScale)
            if (rightPupilRef.current.material instanceof THREE.MeshStandardMaterial) {
                rightPupilRef.current.material.emissiveIntensity = rightEmissivePulse
            }
        }
    })

    if (!isActive) return null

    return (
        <group>
            {/* Orange Pupils */}
            <mesh ref={leftPupilRef} position={[-0.5, 0, 0]}>
                <sphereGeometry args={[0.08, 32, 32]} />
                <meshStandardMaterial
                    color="#ff8800"
                    emissive="#ff4400"
                    emissiveIntensity={4}
                    transparent
                    opacity={0.9}
                />
                <pointLight color="#ff8800" intensity={2} distance={2} />
            </mesh>

            <mesh ref={rightPupilRef} position={[0.5, 0, 0]}>
                <sphereGeometry args={[0.08, 32, 32]} />
                <meshStandardMaterial
                    color="#ff8800"
                    emissive="#ff4400"
                    emissiveIntensity={4}
                    transparent
                    opacity={0.9}
                />
                <pointLight color="#ff8800" intensity={2} distance={2} />
            </mesh>
        </group>
    )
}
