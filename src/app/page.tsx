'use client'

import { Canvas } from '@react-three/fiber'
import { ParticleLanding } from '@/components/landing/ParticleLanding'
import { LandingOverlay } from '@/components/landing/LandingOverlay'
import { Suspense } from 'react'

// Force dynamic rendering to ensure fresh content on each request
export const dynamic = 'force-dynamic';

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
            antialias: false, // Tone mapping handles this usually with postprocessing
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
}
