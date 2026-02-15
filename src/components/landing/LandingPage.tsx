'use client'

import { Canvas } from '@react-three/fiber'
import { ParticleLanding } from '@/components/landing/ParticleLanding'
import { LandingOverlay } from '@/components/landing/LandingOverlay'
import { Suspense } from 'react'

interface LandingPageProps {
    showTopRightCTA: boolean
    onComplete?: () => void
}

export function LandingPage({ showTopRightCTA, onComplete }: LandingPageProps) {
    return (
        <div
            className="relative w-full h-screen bg-black overflow-hidden cursor-pointer"
            onClick={onComplete}
        >
            {/* 3D Scene */}
            <div className="absolute inset-0 z-0">
                <Canvas
                    camera={{ position: [0, 0, 5], fov: 75 }}
                    dpr={[1, 2]} // High Def scaling
                    gl={{
                        powerPreference: "high-performance",
                        antialias: false, // ToneMapping handles this usually with postprocessing
                        alpha: false
                    }}
                >
                    <Suspense fallback={null}>
                        <ParticleLanding />
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
