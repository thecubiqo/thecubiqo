'use client'

import { LandingPage } from '@/components/landing/LandingPage'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
    const router = useRouter()

    const handleComplete = () => {
        router.push('/')
    }

    return <LandingPage showTopRightCTA={true} onComplete={handleComplete} />
}
