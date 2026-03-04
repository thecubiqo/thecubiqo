import { checkFeatureFlag } from '@/lib/feature-flags/server'
import { FullscreenApp } from '@/components/FullscreenApp'
import { LandingPage } from '@/components/landing/LandingPage'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering to ensure auth/flag state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check landing flag (though we're forcing FullscreenApp for now)
  const { enabled: showTopRightCTA } = await checkFeatureFlag({
    flag_name: 'ui.topRightCTA.v1'
  });

  // Force-render FullscreenApp for now so the user can see the new design immediately
  return <FullscreenApp showTopRightCTA={showTopRightCTA} />
}
