'use client'

import { Canvas } from '@react-three/fiber'
import { ParticleLanding } from '@/components/landing/ParticleLanding'
import { LandingOverlay } from '@/components/landing/LandingOverlay'
import { Suspense, useState, useEffect } from 'react'

interface LandingPageProps {
    showTopRightCTA: boolean
    onComplete?: () => void
}

export function LandingPage({ showTopRightCTA, onComplete }: LandingPageProps) {
    const [isImploding, setIsImploding] = useState(false)

    const handleEnter = () => {
        if (isImploding) return
        setIsImploding(true)
        // Play "enter" sound if possible or just wait for transition
        setTimeout(() => {
            onComplete?.()
        }, 1200) // Duration of warp effect
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
            {/* 3D Scene */}
            <div className="absolute inset-0 z-0">
                <Canvas
                    camera={{ position: [0, 0, 10], fov: 75 }}
                    dpr={[1, 2]} // High Def scaling
                    gl={{
                        powerPreference: "high-performance",
                        antialias: false, // ToneMapping handles this usually with postprocessing
                        alpha: false
                    }}
                >
                    <Suspense fallback={null}>
                        <ParticleLanding isImploding={isImploding} />
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
