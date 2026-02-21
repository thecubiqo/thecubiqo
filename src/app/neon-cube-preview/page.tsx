'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

/**
 * NeonGlassCube uses Three.js + OrbitControls which are not SSR-safe.
 * Loaded dynamically with ssr: false.
 */
const cubeLoadingEl = <div style={{ width: '100%', minHeight: '60vh', background: '#050814' }} />

const NeonGlassCube = dynamic(
  () => import('@/components/NeonGlassCube'),
  { ssr: false, loading: () => cubeLoadingEl }
)

export default function NeonCubePreview() {
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 })
  const [autoRotate, setAutoRotate] = useState(true)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    const update = () => {
      const size = Math.min(window.innerWidth, window.innerHeight, 700)
      setDimensions({ width: size, height: size })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050814',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <NeonGlassCube
        width={dimensions.width}
        height={dimensions.height}
        autoRotate={autoRotate}
        showControls={showControls}
      />

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '12px 20px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(139,185,254,0.2)',
        }}
      >
        <label style={{ color: '#8bb9fe', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => setAutoRotate(e.target.checked)}
          />
          Auto Rotate
        </label>
        <label style={{ color: '#8bb9fe', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showControls}
            onChange={(e) => setShowControls(e.target.checked)}
          />
          Orbit Controls
        </label>
      </div>
    </div>
  )
}
