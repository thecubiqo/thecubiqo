'use client';

import { FullscreenApp } from "@/components/FullscreenApp";
import { useDesignToggles } from "@/hooks/useDesignToggles";

// Force dynamic rendering to ensure auth state updates are reflected immediately
export const dynamic = 'force-dynamic';

export default function Home() {
  const { isEnabled, loading } = useDesignToggles();

  // While loading toggles, show the default (FullscreenApp)
  if (loading) {
    return <FullscreenApp />;
  }

  // Check if particle landing is enabled, otherwise use fullscreen app
  // Note: Since we don't have a separate ParticleLanding page component yet,
  // we're using FullscreenApp for both for now. This can be easily swapped later.
  const useParticleLanding = isEnabled('particle_landing');
  const useFullscreenApp = isEnabled('fullscreen_app_landing');

  // If fullscreen_app_landing is explicitly enabled, use it
  // Otherwise use particle_landing if enabled (default)
  if (useFullscreenApp) {
    return <FullscreenApp />;
  }

  // Default to FullscreenApp (can be changed to ParticleLanding when implemented)
  return <FullscreenApp />;
}
