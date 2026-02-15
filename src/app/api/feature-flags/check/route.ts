/**
 * Public Feature Flags Check API
 * Allows sites to check if feature flags are enabled
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkFeatureFlag } from '@/lib/feature-flags/server';
import type { FeatureFlagCheckRequest } from '@/types/feature-flags';

/**
 * GET /api/feature-flags/check?flag=<flag-name>&user_id=<user-id>&site_id=<site-id>
 * Check if a feature flag is enabled
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const flagName = searchParams.get('flag');
    const userId = searchParams.get('user_id') || undefined;
    const siteId = searchParams.get('site_id') || undefined;

    if (!flagName) {
      return NextResponse.json(
        { error: 'flag parameter is required' },
        { status: 400 }
      );
    }

    const checkRequest: FeatureFlagCheckRequest = {
      flag_name: flagName,
      user_id: userId,
      site_id: siteId,
    };

    const result = await checkFeatureFlag(checkRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/feature-flags/check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feature-flags/check
 * Check multiple feature flags at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flags, user_id, site_id } = body;

    if (!flags || !Array.isArray(flags)) {
      return NextResponse.json(
        { error: 'flags array is required' },
        { status: 400 }
      );
    }

    // Check all flags in parallel
    const results = await Promise.all(
      flags.map((flagName: string) =>
        checkFeatureFlag({
          flag_name: flagName,
          user_id,
          site_id,
        })
      )
    );

    // Return as object map
    const flagMap: Record<string, any> = {};
    flags.forEach((flagName: string, index: number) => {
      flagMap[flagName] = results[index];
    });

    return NextResponse.json({ flags: flagMap });
  } catch (error) {
    console.error('Error in POST /api/feature-flags/check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
