'use client'

import { Canvas } from '@react-three/fiber'
import { PlasmaWaveField } from '@/components/cube/PlasmaWaveField'
import { LandingOverlay } from '@/components/landing/LandingOverlay'
import { Suspense, useState, useEffect } from 'react'
import { Environment, Float } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'

interface LandingPageProps {
    showTopRightCTA: boolean
    onComplete?: () => void
}

export function LandingPage({ showTopRightCTA, onComplete }: LandingPageProps) {
    const [isImploding, setIsImploding] = useState(false)

    const handleEnter = () => {
        if (isImploding) return
        setIsImploding(true)
        // Duration of transition fade
        setTimeout(() => {
            onComplete?.()
        }, 1000)
    }

    // Handle Keyboard "Enter"
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') handleEnter()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <div
            className={`relative w-full h-screen bg-black overflow-hidden cursor-pointer transition-opacity duration-1000 ${isImploding ? 'opacity-0' : 'opacity-100'}`}
            onClick={handleEnter}
        >
            {/* 3D Scene - Purple Pipes (Plasma Wave Field) */}
            <div className="absolute inset-0 z-0">
                <Canvas
                    camera={{ position: [0, 0, 5], fov: 50 }}
                    dpr={[1, 2]}
                    gl={{
                        powerPreference: "high-performance",
                        antialias: true,
                        alpha: true,
                        stencil: false,
                        depth: true
                    }}
                >
                    <Suspense fallback={null}>
                        <ambientLight intensity={1.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#4444ff" />
                        <pointLight position={[0, 0, 5]} intensity={1} color="#ff00ff" />

                        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                            <PlasmaWaveField isEnabled={false} aiState="neutral" />
                        </Float>

                        <EffectComposer>
                            <Bloom
                                intensity={1.2}
                                luminanceThreshold={0.1}
                                luminanceSmoothing={0.9}
                                mipmapBlur
                            />
                            <Noise opacity={0.02} />
                            <Vignette eskil={false} offset={0.1} darkness={1.1} />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </div>

            {/* UI Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <LandingOverlay showTopRightCTA={showTopRightCTA} />
            </div>
        </div>
    )
}

