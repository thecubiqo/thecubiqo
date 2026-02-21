'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

const PARTICLE_COUNT = 8000
const IMPLOSION_CENTER = new THREE.Vector3(0, 0, 0)

export function ParticleLanding({ isImploding = false }: { isImploding?: boolean }) {
    return (
        <>
            <color attach="background" args={['#000000']} />
            <SimpleStarField isImploding={isImploding} />
            <StableEffects />
        </>
    )
}

function SimpleStarField({ isImploding }: { isImploding: boolean }) {
    const ref = useRef<THREE.Points>(null!)
    const { viewport, mouse } = useThree()

    // UseMemo to create stable initial positions
    const [positions, colors, originalPositions] = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3)
        const col = new Float32Array(PARTICLE_COUNT * 3)
        const orig = new Float32Array(PARTICLE_COUNT * 3)

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3

            // Sphere distribution
            const radius = (Math.random() * 0.5 + 0.5) * 12
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(Math.random() * 2 - 1)

            const x = radius * Math.sin(phi) * Math.cos(theta)
            const y = radius * Math.sin(phi) * Math.sin(theta)
            const z = radius * Math.cos(phi)

            pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z;
            orig[i3] = x; orig[i3 + 1] = y; orig[i3 + 2] = z;

            // Stable Colors (Blue/Cyan/Purple)
            const mix = Math.random()
            if (mix < 0.3) {
                col[i3] = 0.1; col[i3 + 1] = 0.8; col[i3 + 2] = 0.9; // Cyan
            } else if (mix < 0.6) {
                col[i3] = 0.1; col[i3 + 1] = 0.3; col[i3 + 2] = 0.9; // Blue
            } else {
                col[i3] = 0.6; col[i3 + 1] = 0.1; col[i3 + 2] = 0.8; // Purple
            }
        }
        return [pos, col, orig]
    }, [])

    useFrame((state) => {
        if (!ref.current) return

        const currentPositions = ref.current.geometry.attributes.position.array as Float32Array

        // 0. Camera Parallax
        const targetX = state.mouse.x * 2
        const targetY = state.mouse.y * 2
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05)
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05)
        state.camera.lookAt(0, 0, 0)

        // Mouse in 3D space
        const mouseX = (state.mouse.x * viewport.width) / 2
        const mouseY = (state.mouse.y * viewport.height) / 2
        const time = state.clock.getElapsedTime()

        // Interactive Loop
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3
            const ox = originalPositions[i3]
            const oy = originalPositions[i3 + 1]
            const oz = originalPositions[i3 + 2]

            // 1. Calculate Mouse Distance
            const dx = mouseX - ox
            const dy = mouseY - oy
            const distSq = dx * dx + dy * dy

            let x = ox
            let y = oy
            let z = oz

            // 2. Interaction Strength (Only if close)
            if (distSq < 16) { // distance < 4
                const dist = Math.sqrt(distSq)
                const force = (4 - dist) / 4 // 0 to 1
                const repel = force * 2.0 // Strength multiplier

                x -= (dx / dist) * repel
                y -= (dy / dist) * repel
                // z also pushes back slightly for 3D feel
                z -= repel * 0.5
            }

            // 3. Gentle Floating (Sine Wave)
            x += Math.sin(time * 0.5 + i) * 0.1
            y += Math.cos(time * 0.3 + i) * 0.1

            // 4. Click Warp (Implosion)
            if (isImploding) {
                const towardCenter = IMPLOSION_CENTER.clone().sub(new THREE.Vector3(x, y, z))
                const speed = 0.2 + Math.random() * 0.3
                x += towardCenter.x * speed
                y += towardCenter.y * speed
                z += towardCenter.z * speed
            }

            // Apply
            currentPositions[i3] = x
            currentPositions[i3 + 1] = y
            currentPositions[i3 + 2] = z
        }

        ref.current.geometry.attributes.position.needsUpdate = true

        // Slow, stable rotation of entire group
        ref.current.rotation.y = time * 0.05
    })

    return (
        <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                vertexColors
                size={0.05}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    )
}

function StableEffects() {
    return (
        <EffectComposer>
            <Bloom
                luminanceThreshold={0.1}
                luminanceSmoothing={0.9}
                height={400}
                intensity={2.5}
            />
        </EffectComposer>
    )
}
