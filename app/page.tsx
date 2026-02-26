import { checkFeatureFlag } from '@/lib/feature-flags/server'
import dynamic from 'next/dynamic';

const FullscreenApp = dynamic(() => import('@/components/FullscreenApp'), { ssr: false });
const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), { ssr: false });
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering to ensure auth/flag state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check feature flags
  const { enabled: showTopRightCTA } = await checkFeatureFlag({
    flag_name: 'ui.topRightCTA.v1'
  });

  const { enabled: useParticleLandingAsHome } = await checkFeatureFlag({
    flag_name: 'ui.useParticleLandingAsHome'
  });

  // If authenticated, show the FullscreenApp
  if (user) {
    return <FullscreenApp showTopRightCTA={showTopRightCTA} showParticleLanding={true} />
  }

  // If feature flag is enabled for guests, render LandingPage (with ParticleLanding)
  if (useParticleLandingAsHome) {
    return <LandingPage showTopRightCTA={showTopRightCTA} />
  }

  // Default behavior: render the unified FullscreenApp with landing enabled
  return <FullscreenApp showTopRightCTA={true} showParticleLanding={true} />
}
