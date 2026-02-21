'use client'

import dynamic from 'next/dynamic'

/**
 * /hero-webgl-preview — standalone preview of HeroWebGL.
 *
 * HeroWebGL uses Three.js / @react-three/drei which are not SSR-safe,
 * so we disable SSR here.
 */
const loadingEl = <div style={{ minHeight: '100vh', background: '#000' }} />

const HeroWebGL = dynamic(
  () => import('@/components/HeroWebGL'),
  { ssr: false, loading: () => loadingEl }
)

export default function HeroWebGLPreview() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <HeroWebGL />
      </div>
    </div>
  )
}
