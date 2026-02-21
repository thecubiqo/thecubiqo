'use client'

import HeroWebGL from '@/components/HeroWebGL'

export default function HeroWebGLPreview() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <HeroWebGL />
      </div>
    </div>
  )
}
