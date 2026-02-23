'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'

interface NextGenPlasmaCubeProps {
    isTalking?: boolean
    isListening?: boolean
    url?: string
}

export function NextGenPlasmaCube({
    isTalking = false,
    isListening = false
}: NextGenPlasmaCubeProps) {
    const meshRef = useRef<any>(null)

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Gentle rotation
            meshRef.current.rotation.x += delta * 0.2
            meshRef.current.rotation.y += delta * 0.3

            // Enhanced pulse when talking
            if (isTalking) {
                const scale = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.15
                meshRef.current.scale.setScalar(scale)
            } else if (isListening) {
                const scale = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.1
                meshRef.current.scale.setScalar(scale)
            } else {
                meshRef.current.scale.lerp({ x: 1, y: 1, z: 1 }, 0.1)
            }
        }
    })

    // Color based on state
    const getColor = () => {
      if (isTalking) return '#00ffff'
      if (isListening) return '#22d3ee'
      return '#6600cc'
    }
    
    const getEmissive = () => {
      if (isTalking) return '#06b6d4'
      if (isListening) return '#3b82f6'
      return '#4400aa'
    }

    const color = getColor()
    const emissive = getEmissive()

    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={meshRef}>
                    <boxGeometry args={[1.5, 1.5, 1.5]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={emissive}
                        emissiveIntensity={isTalking ? 1.2 : 0.8}
                        roughness={0.2}
                        metalness={0.8}
                    />
                </mesh>
            </Float>
            
            <ambientLight intensity={isTalking ? 1.2 : 0.8} />
            <pointLight position={[5, 5, 5]} intensity={isTalking ? 3 : 2} color={color} />
            <pointLight position={[-5, -5, -5]} intensity={1.5} color={emissive} />
        </group>
    )
}
