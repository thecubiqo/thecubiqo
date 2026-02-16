import { checkFeatureFlag } from '@/lib/feature-flags/server'
import { FullscreenApp } from '@/components/FullscreenApp'
import { LandingPage } from '@/components/landing/LandingPage'

// Force dynamic rendering to ensure auth/flag state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Check feature flags
  const { enabled: showTopRightCTA } = await checkFeatureFlag({
    flag_name: 'ui.topRightCTA.v1'
  });

  const { enabled: useParticleLandingAsHome } = await checkFeatureFlag({
    flag_name: 'ui.useParticleLandingAsHome'
  });

  // If feature flag is enabled, render LandingPage (with ParticleLanding)
  if (useParticleLandingAsHome) {
    return <LandingPage showTopRightCTA={showTopRightCTA} />
  }

  // Default behavior: render FullscreenApp
  return <FullscreenApp showTopRightCTA={showTopRightCTA} />
}
