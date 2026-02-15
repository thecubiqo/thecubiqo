/**
 * Feature Flags Client Hook
 * React hook for checking feature flags with preview mode support
 */

import { useEffect, useState } from 'react';
import type { FeatureFlagCheckResponse } from '@/types/feature-flags';

interface UseFeatureFlagOptions {
  user_id?: string;
  site_id?: string;
  enablePreview?: boolean;
}

/**
 * Hook to check if a feature flag is enabled
 * Supports preview mode via cookie or query param
 */
export function useFeatureFlag(
  flagName: string,
  options: UseFeatureFlagOptions = {}
): {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  isPreview: boolean;
} {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const checkFlag = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check for preview mode
        const previewFlags = getPreviewFlags(options.enablePreview);
        
        if (previewFlags.has(flagName)) {
          setEnabled(true);
          setIsPreview(true);
          setLoading(false);
          return;
        }

        // Normal flag check
        const params = new URLSearchParams({
          flag: flagName,
          ...(options.user_id && { user_id: options.user_id }),
          ...(options.site_id && { site_id: options.site_id }),
        });

        const response = await fetch(
          `/api/feature-flags/check?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to check feature flag');
        }

        const data: FeatureFlagCheckResponse = await response.json();
        setEnabled(data.enabled);
      } catch (err) {
        console.error('Error checking feature flag:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFlag();
  }, [flagName, options.user_id, options.site_id, options.enablePreview]);

  return { enabled, loading, error, isPreview };
}

/**
 * Hook to check multiple feature flags at once
 */
export function useFeatureFlags(
  flagNames: string[],
  options: UseFeatureFlagOptions = {}
): {
  flags: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  previewFlags: Set<string>;
} {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFlags, setPreviewFlags] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkFlags = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check for preview mode
        const previewSet = getPreviewFlags(options.enablePreview);
        setPreviewFlags(previewSet);

        // Build initial flags object with preview flags
        const initialFlags: Record<string, boolean> = {};
        const flagsToCheck: string[] = [];

        flagNames.forEach((name) => {
          if (previewSet.has(name)) {
            initialFlags[name] = true;
          } else {
            flagsToCheck.push(name);
          }
        });

        // If all flags are in preview mode, we're done
        if (flagsToCheck.length === 0) {
          setFlags(initialFlags);
          setLoading(false);
          return;
        }

        // Check remaining flags via API
        const response = await fetch('/api/feature-flags/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flags: flagsToCheck,
            user_id: options.user_id,
            site_id: options.site_id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check feature flags');
        }

        const data = await response.json();
        const resultFlags: Record<string, boolean> = { ...initialFlags };

        flagsToCheck.forEach((name) => {
          resultFlags[name] = data.flags[name]?.enabled || false;
        });

        setFlags(resultFlags);
      } catch (err) {
        console.error('Error checking feature flags:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Set all to false on error
        const errorFlags: Record<string, boolean> = {};
        flagNames.forEach((name) => {
          errorFlags[name] = false;
        });
        setFlags(errorFlags);
      } finally {
        setLoading(false);
      }
    };

    if (flagNames.length > 0) {
      checkFlags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Use flagNames.join() to create a stable dependency
    flagNames.join(','),
    options.user_id,
    options.site_id,
    options.enablePreview,
  ]);

  return { flags, loading, error, previewFlags };
}

/**
 * Get preview flags from cookie or query param
 */
function getPreviewFlags(enablePreview: boolean = true): Set<string> {
  if (!enablePreview || typeof window === 'undefined') {
    return new Set();
  }

  const previewFlags = new Set<string>();

  // Check query param
  const params = new URLSearchParams(window.location.search);
  const queryFlags = params.get('preview_flags');
  if (queryFlags) {
    queryFlags.split(',').forEach((flag) => previewFlags.add(flag.trim()));
  }

  // Check cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '__cubiqo_preview_flags') {
      try {
        const cookieFlags = decodeURIComponent(value).split(',');
        cookieFlags.forEach((flag) => previewFlags.add(flag.trim()));
      } catch (err) {
        console.error('Error parsing preview flags cookie:', err);
      }
    }
  }

  return previewFlags;
}

/**
 * Utility to enable preview mode for specific flags
 */
export function enablePreviewMode(flagNames: string[]): void {
  if (typeof window === 'undefined') return;

  const flags = flagNames.join(',');
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hour expiry

  document.cookie = `__cubiqo_preview_flags=${encodeURIComponent(flags)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  
  console.log('Preview mode enabled for flags:', flagNames);
  window.location.reload();
}

/**
 * Utility to disable preview mode
 */
export function disablePreviewMode(): void {
  if (typeof window === 'undefined') return;

  document.cookie = '__cubiqo_preview_flags=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
  
  console.log('Preview mode disabled');
  window.location.reload();
}
