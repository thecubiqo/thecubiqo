'use client'

import { EnergyCubeScene } from '@/components/cube/EnergyCubeScene'
import { LandingOverlay } from '@/components/landing/LandingOverlay'
import { useState, useEffect } from 'react'

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
            {/* 3D Scene - Ribbons with Orange Soul (EnergyCube) */}
            <div className="absolute inset-0 z-0">
                <EnergyCubeScene colorName="ORANGE" animationState="idle" className="w-full h-full" />
            </div>

            {/* UI Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <LandingOverlay showTopRightCTA={showTopRightCTA} />
            </div>
        </div>
    )
}

