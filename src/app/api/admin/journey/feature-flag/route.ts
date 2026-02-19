/**
 * Admin Feature Flag Management API
 * Toggle Journey memory feature on/off
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-guard';
import { logAdminAction } from '@/lib/audit';

export const POST = withAdminAuth(async (request, { user, profile, supabase }) => {
  const body = await request.json();
  const { enabled } = body;

  if (typeof enabled !== 'boolean') {
    return NextResponse.json(
      { error: 'enabled must be a boolean' },
      { status: 400 }
    );
  }

  // Update feature flag
  const { data, error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('name', 'journey_memory')
    .select()
    .single();

  if (error) {
    console.error('[Admin/Journey/FeatureFlag] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }

  // Log the action using shared audit utility
  await logAdminAction({
    userId: user.id,
    userEmail: profile.email,
    actionType: 'feature_flag_toggled',
    actionDetails: { flag: 'journey_memory', enabled },
  });

  return NextResponse.json({
    success: true,
    featureFlag: data,
  });
});
