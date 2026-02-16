import { Suspense } from 'react'
import { checkFeatureFlag } from '@/lib/feature-flags/server'
import { FullscreenApp } from '@/components/FullscreenApp'

// Force dynamic rendering to ensure auth/flag state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Check feature flags
  const [ctaFlag, particleFlag] = await Promise.all([
    checkFeatureFlag({ flag_name: 'ui.topRightCTA.v1' }),
    checkFeatureFlag({ flag_name: 'ui.landing.particles.v1' })
  ]);

  // Default particle landing to true when flag is not found in DB
  // This ensures the 120k particle PlasmaWaveField shows on the landing page
  const showParticles = particleFlag?.flag ? particleFlag.enabled : true;

  return (
    <Suspense fallback={null}>
      <FullscreenApp
        showTopRightCTA={ctaFlag.enabled}
        showParticleLanding={showParticles}
      />
    </Suspense>
  )
}
