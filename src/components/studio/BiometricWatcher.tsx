'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BiometricWatcherProps {
    isActive: boolean
    facePosition?: { x: number; y: number } // Range [-1, 1]
    engagement?: 'low' | 'medium' | 'high'
}

export function BiometricWatcher({
    isActive,
    facePosition = { x: 0, y: 0 },
    engagement = 'medium'
}: BiometricWatcherProps) {
    const groupRef = useRef<THREE.Group>(null)
    const threadsRef = useRef<THREE.Group>(null)
    const leftPupilRef = useRef<THREE.Mesh>(null)
    const rightPupilRef = useRef<THREE.Mesh>(null)

    const THREAD_COUNT = 40
    const threadUniforms = useMemo(() => ({
        uTime: { value: 0 },
        uOpenAmount: { value: 0 },
        uFacePos: { value: new THREE.Vector2(0, 0) }
    }), [])

    // Morph values
    const openAmount = useRef(0)

    useFrame((state) => {
        const time = state.clock.getElapsedTime()
        threadUniforms.uTime.value = time

        // Target morph
        const targetOpen = isActive ? 1 : 0
        openAmount.current = THREE.MathUtils.lerp(openAmount.current, targetOpen, 0.1)
        threadUniforms.uOpenAmount.value = openAmount.current

        // Follow face or mouse
        const targetX = facePosition.x || state.pointer.x * 0.5
        const targetY = facePosition.y || state.pointer.y * 0.5

        threadUniforms.uFacePos.value.lerp(new THREE.Vector2(targetX, targetY), 0.1)

        // HEARTBEAT LOGIC
        // Map engagement to pulse speed (bpm)
        // High: ~140bpm (2.33Hz), Medium: ~70bpm (1.16Hz), Low: ~50bpm (0.83Hz)
        const pulseFreq = engagement === 'high' ? 8.0 : engagement === 'medium' ? 4.0 : 2.5
        const pulseScale = 1 + Math.sin(time * pulseFreq) * (engagement === 'high' ? 0.2 : 0.1)
        const emissivePulse = 4 + Math.sin(time * pulseFreq) * (engagement === 'high' ? 3 : 1)

        if (leftPupilRef.current && rightPupilRef.current) {
            const pupilX = threadUniforms.uFacePos.value.x * 0.2
            const pupilY = threadUniforms.uFacePos.value.y * 0.2

            // Left Pupil
            leftPupilRef.current.position.x = -0.5 + pupilX
            leftPupilRef.current.position.y = pupilY
            leftPupilRef.current.scale.setScalar(openAmount.current * pulseScale)
            if (leftPupilRef.current.material instanceof THREE.MeshStandardMaterial) {
                leftPupilRef.current.material.emissiveIntensity = emissivePulse
            }

            // Right Pupil
            const rightPulseScale = 1 + Math.sin(time * pulseFreq + 0.5) * (engagement === 'high' ? 0.2 : 0.1)
            const rightEmissivePulse = 4 + Math.sin(time * pulseFreq + 0.5) * (engagement === 'high' ? 3 : 1)

            rightPupilRef.current.position.x = 0.5 + pupilX
            rightPupilRef.current.position.y = pupilY
            rightPupilRef.current.scale.setScalar(openAmount.current * rightPulseScale)
            if (rightPupilRef.current.material instanceof THREE.MeshStandardMaterial) {
                rightPupilRef.current.material.emissiveIntensity = rightEmissivePulse
            }
        }
    })

    // Create threads
    const threads = useMemo(() => {
        const lines = []
        for (let i = 0; i < THREAD_COUNT; i++) {
            const x = (i / (THREAD_COUNT - 1) - 0.5) * 4
            lines.push(x)
        }
        return lines
    }, [])

    return (
        <group ref={groupRef}>
            {/* Threads partitioning */}
            <group ref={threadsRef}>
                {threads.map((x, i) => (
                    <Thread
                        key={i}
                        baseX={x}
                        index={i}
                        openAmount={threadUniforms.uOpenAmount}
                        time={threadUniforms.uTime}
                        facePos={threadUniforms.uFacePos}
                    />
                ))}
            </group>

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

function Thread({ baseX, index, openAmount, time, facePos }: any) {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame(() => {
        if (!meshRef.current) return

        const open = openAmount.value
        const t = time.value

        // Vertical partition logic: threads move apart vertically in the center
        const distFromCenter = Math.abs(baseX)
        const vertSplit = Math.max(0, 1 - distFromCenter * 0.8) * open

        // Oscillate
        const oscillation = Math.sin(t * 2 + index * 0.2) * 0.05

        // Apply position
        meshRef.current.position.x = baseX + oscillation

        // The "Partition": the thread is broken into two halves or curved
        // For simplicity, we'll use a single line that bends or scales
        // But let's actually make it feel like "threads partition"
    })

    return (
        <group position={[baseX, 0, 0]}>
            {/* Upper Thread half */}
            <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 2, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
            </mesh>
            {/* Lower Thread half */}
            <mesh position={[0, -1.2, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 2, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
            </mesh>

            {/* Dynamic partition gap managed by parent frame */}
            <ThreadSegment baseX={baseX} index={index} openAmount={openAmount} time={time} />
        </group>
    )
}

function ThreadSegment({ baseX, index, openAmount, time }: any) {
    const meshRefUpper = useRef<THREE.Mesh>(null)
    const meshRefLower = useRef<THREE.Mesh>(null)

    useFrame(() => {
        const open = openAmount.value
        const t = time.value
        const distFromCenter = Math.abs(baseX)

        // Thread "Partition" factor
        const factor = Math.pow(Math.max(0, 1 - distFromCenter * 0.45), 3)

        const gap = factor * open * 1.5
        // Sync yet different oscillation
        const oscillation = Math.sin(t * (1.5 + index * 0.05) + index) * 0.04 * (1 - open * 0.5)

        if (meshRefUpper.current) {
            meshRefUpper.current.position.y = 1 + gap + oscillation
            meshRefUpper.current.rotation.z = Math.sin(t + index) * 0.02 * open
        }
        if (meshRefLower.current) {
            meshRefLower.current.position.y = -1 - gap - oscillation
            meshRefLower.current.rotation.z = -Math.sin(t + index) * 0.02 * open
        }
    })

    return (
        <>
            <mesh ref={meshRefUpper}>
                <cylinderGeometry args={[0.006, 0.001, 2, 8]} />
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.4}
                />
            </mesh>
            <mesh ref={meshRefLower}>
                <cylinderGeometry args={[0.006, 0.001, 2, 8]} />
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.4}
                />
            </mesh>
        </>
    )
}
