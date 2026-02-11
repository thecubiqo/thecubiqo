'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FounderPortal } from './FounderPortal';

export function PremiumFoundersBadge() {
    const { user } = useAuth();
    const [showPortal, setShowPortal] = useState(false);

    // Hardcoded check for aditya@cubiqo.ai (or use isFounder hook if preferred)
    const isFounder = user?.email?.toLowerCase() === 'aditya@cubiqo.ai';

    if (!isFounder) return null;

    return (
        <>
            <button
                onClick={() => setShowPortal(!showPortal)}
                className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 pl-4 pr-1 py-1 rounded-full glass-card border border-amber-500/30 hover:border-amber-400/80 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-black/60"
            >
                <span className="text-sm font-medium bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent tracking-wide uppercase">
                    Founder Mode
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-black font-bold text-xs shadow-lg group-hover:scale-110 transition-transform">
                    A
                </div>
            </button>

            {/* Render Portal trigger implicitly or explicit connection needed? 
          The FounderPortal component has its own internal state/button. 
          I should probably modify FounderPortal to accept an `isOpen` prop or just wrap it.
          For now, let's keep it simple: This badge *is* the trigger.
          But FounderPortal has its own button. I should hide that one and use this one.
      */}

            {/* 
        Actually, FounderPortal renders its own button. 
        I'll modify FounderPortal to be controlled or use this component AS the trigger.
        For now, this badge is just a visual indicator.
        Let's integrate it into FounderPortal directly in the next step.
      */}
        </>
    );
}
