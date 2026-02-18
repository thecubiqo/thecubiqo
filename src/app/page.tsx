import { Suspense } from 'react'
import { checkFeatureFlag } from '@/lib/feature-flags/server'
import { FullscreenApp } from '@/components/FullscreenApp'

// Force dynamic rendering to ensure auth/flag state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Check feature flags
  // Check feature flags with fail-safe
  let ctaFlag = { enabled: false };
  let particleFlag = { enabled: false };

  try {
    [ctaFlag, particleFlag] = await Promise.all([
      checkFeatureFlag({ flag_name: 'ui.topRightCTA.v1' }),
      checkFeatureFlag({ flag_name: 'ui.landing.particles.v1' })
    ]);
  } catch (error) {
    console.error('Feature flag check failed:', error);
    // Proceed with safe defaults
  }

  return (
    <Suspense fallback={null}>
      <FullscreenApp
        showTopRightCTA={ctaFlag.enabled}
        showParticleLanding={particleFlag.enabled}
      />
    </Suspense>
  )
}
