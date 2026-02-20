/**
 * Design Toggles Hook
 * Fetches and caches design toggles with graceful fallback
 */

import { useEffect, useState } from 'react';

interface DesignToggle {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: 'design' | 'feature' | 'experiment';
  is_enabled: boolean;
  config: Record<string, any>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseDesignTogglesResult {
  toggles: DesignToggle[];
  loading: boolean;
  error: string | null;
  isEnabled: (toggleName: string) => boolean;
  grouped: {
    design: DesignToggle[];
    feature: DesignToggle[];
    experiment: DesignToggle[];
  };
}

// In-memory cache with TTL
let cachedToggles: DesignToggle[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 30000; // 30 seconds

// Default toggles as fallback
const DEFAULT_TOGGLES: Record<string, boolean> = {
  glassmorphic_cube: false,
  energy_wireframe_cube: true,
  classic_cube: true,
  particle_landing: true,
  fullscreen_app_landing: false,
  sidekick_mode: false,
  cope_mode: false,
  founder_mode: false,
  policy_router: false,
  ab_testing: false,
  journey_memory: true,
  cq_messaging: false,
  dark_premium_theme: true,
};

/**
 * Hook to fetch and use design toggles
 * Caches in memory with 30s TTL and falls back to defaults if unavailable
 */
export function useDesignToggles(): UseDesignTogglesResult {
  const [toggles, setToggles] = useState<DesignToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToggles = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        const now = Date.now();
        if (cachedToggles && now - cacheTimestamp < CACHE_TTL) {
          setToggles(cachedToggles);
          setLoading(false);
          return;
        }

        // Fetch from API
        const response = await fetch('/api/admin/designs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch design toggles');
        }

        const data = await response.json();
        const fetchedToggles = data.toggles || [];

        // Update cache
        cachedToggles = fetchedToggles;
        cacheTimestamp = now;

        setToggles(fetchedToggles);
      } catch (err) {
        
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fall back to defaults - create mock toggle objects
        const defaultToggleArray: DesignToggle[] = Object.entries(DEFAULT_TOGGLES).map(
          ([name, is_enabled]) => ({
            id: name,
            name,
            display_name: name.replace(/_/g, ' '),
            description: null,
            category: 'design' as const,
            is_enabled,
            config: {},
            updated_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );
        setToggles(defaultToggleArray);
      } finally {
        setLoading(false);
      }
    };

    fetchToggles();
  }, []);

  // Helper function to check if a toggle is enabled
  const isEnabled = (toggleName: string): boolean => {
    const toggle = toggles.find((t) => t.name === toggleName);
    if (toggle) {
      return toggle.is_enabled;
    }
    // Fall back to default
    return DEFAULT_TOGGLES[toggleName] ?? false;
  };

  // Group toggles by category
  const grouped = {
    design: toggles.filter((t) => t.category === 'design'),
    feature: toggles.filter((t) => t.category === 'feature'),
    experiment: toggles.filter((t) => t.category === 'experiment'),
  };

  return { toggles, loading, error, isEnabled, grouped };
}

/**
 * Utility to invalidate the cache
 * Call this after updating toggles to force a refresh
 */
export function invalidateDesignTogglesCache(): void {
  cachedToggles = null;
  cacheTimestamp = 0;
}
