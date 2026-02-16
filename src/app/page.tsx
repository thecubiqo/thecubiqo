import { checkFeatureFlag } from '@/lib/feature-flags/server'
import { FullscreenApp } from '@/components/FullscreenApp'

// Force dynamic rendering to ensure auth/flag state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Check feature flag
  const { enabled: showTopRightCTA } = await checkFeatureFlag({
    flag_name: 'ui.topRightCTA.v1'
  });

  return <FullscreenApp showTopRightCTA={showTopRightCTA} />
}
