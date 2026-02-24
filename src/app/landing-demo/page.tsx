'use client'

import { LandingPage } from '@/components/landing/LandingPage'

export default function LandingDemo() {
    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            <LandingPage showTopRightCTA={true} />
        </div>
    )
}
