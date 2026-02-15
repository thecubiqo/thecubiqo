/**
 * Feature Flag Demo Component
 * Demonstrates feature flag usage with preview mode indicator
 */

'use client';

import { useEffect, useState } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface FeatureFlagDemoProps {
  flagName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders based on a feature flag
 */
export function FeatureFlagDemo({
  flagName,
  children,
  fallback = null,
}: FeatureFlagDemoProps) {
  const { enabled, loading, isPreview } = useFeatureFlag(flagName, {
    enablePreview: true,
  });

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-800 rounded p-4">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!enabled) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative">
      {isPreview && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-black px-2 py-1 text-xs font-bold rounded-bl z-10">
          🔍 PREVIEW
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Preview mode indicator banner
 */
export function PreviewModeBanner() {
  const [hasPreview, setHasPreview] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if preview mode is active
    const cookies = document.cookie.split(';');
    let preview = false;
    
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (name === '__cubiqo_preview_flags') {
        preview = true;
        break;
      }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has('preview_flags')) {
      preview = true;
    }

    setHasPreview(preview);
  }, []);

  if (!hasPreview) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black px-4 py-2 text-center font-bold z-50 shadow-lg">
      🔍 PREVIEW MODE ACTIVE - Some features may be enabled for testing
    </div>
  );
}
