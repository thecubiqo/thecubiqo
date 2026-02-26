'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid hydration errors
const FullscreenApp = dynamic(() => import('@/components/FullscreenApp'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">⚡</div>
        <h3 className="text-xl font-semibold text-white mb-2">Loading CubiQo</h3>
        <p className="text-gray-400">Initializing your AI assistant...</p>
        <div className="mt-6 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  )
});

const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🎨</div>
        <h3 className="text-xl font-semibold text-white mb-2">Loading Landing Page</h3>
        <p className="text-gray-400">Preparing your experience...</p>
      </div>
    </div>
  )
});

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopRightCTA, setShowTopRightCTA] = useState(false);
  const [useParticleLanding, setUseParticleLanding] = useState(true);

  useEffect(() => {
    // Check authentication on client side only
    const checkAuth = async () => {
      try {
        // This runs only on client
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        setIsAuthenticated(!!user);
        
        // Default feature flags for now
        setShowTopRightCTA(true);
        setUseParticleLanding(true);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🌀</div>
          <h3 className="text-xl font-semibold text-white mb-2">Checking Authentication</h3>
          <p className="text-gray-400">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show the FullscreenApp
  if (isAuthenticated) {
    return <FullscreenApp showTopRightCTA={showTopRightCTA} showParticleLanding={useParticleLanding} />;
  }

  // Show LandingPage for guests
  return <LandingPage showTopRightCTA={showTopRightCTA} />;
}