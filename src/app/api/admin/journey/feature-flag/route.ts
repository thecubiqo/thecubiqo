/**
 * Admin Feature Flag Management API
 * Toggle Journey memory feature on/off
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Add admin role check - for now, any authenticated user can toggle
    // In production, add: if (user.role !== 'admin') return 403

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Update feature flag
    const { data, error } = await supabaseAdmin
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

    return NextResponse.json({
      success: true,
      featureFlag: data,
    });

  } catch (error) {
    console.error('[Admin/Journey/FeatureFlag] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
