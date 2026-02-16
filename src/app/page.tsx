<<<<<<< HEAD
import { checkFeatureFlag } from '@/lib/feature-flags/server'
import { FullscreenApp } from '@/components/FullscreenApp'
=======
'use client'

import { Canvas } from '@react-three/fiber'
import { ParticleLanding } from '@/components/landing/ParticleLanding'
import { LandingOverlay } from '@/components/landing/LandingOverlay'
import { Suspense } from 'react'
>>>>>>> origin/fix/main-landing-page

// Force dynamic rendering to ensure auth/flag state updates are reflected immediately
export const dynamic = 'force-dynamic';

<<<<<<< HEAD
export default async function Home() {
  // Check feature flag
  const { enabled: showTopRightCTA } = await checkFeatureFlag({
    flag_name: 'ui.topRightCTA.v1'
  });

  return <FullscreenApp showTopRightCTA={showTopRightCTA} />
=======
export default function Home() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
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
        <LandingOverlay />
      </div>
    </div>
  )
>>>>>>> origin/fix/main-landing-page
}
