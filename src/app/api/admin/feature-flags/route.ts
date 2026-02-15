/**
 * Feature Flags CRUD API
 * Admin endpoint for managing feature flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAllFeatureFlags,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  getFeatureFlagAuditLogs,
} from '@/lib/feature-flags/server';
import { triggerWebhooks } from '@/lib/feature-flags/webhooks';
import type {
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
} from '@/types/feature-flags';

/**
 * GET /api/admin/feature-flags
 * List all feature flags
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const includeAudit = searchParams.get('audit') === 'true';
    const flagId = searchParams.get('flagId');

    // Get flags
    const flags = await getAllFeatureFlags();

    // Optionally include audit logs
    let auditLogs = null;
    if (includeAudit) {
      auditLogs = await getFeatureFlagAuditLogs(flagId || undefined);
    }

    return NextResponse.json({
      flags,
      auditLogs,
      count: flags.length,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/feature-flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags
 * Create a new feature flag
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = (await request.json()) as CreateFeatureFlagRequest;

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create flag
    const { data: flag, error } = await createFeatureFlag(body, user.id);

    if (error || !flag) {
      return NextResponse.json({ error: error || 'Failed to create flag' }, { status: 500 });
    }

    // Trigger webhooks
    await triggerWebhooks(flag.id, 'created', flag, user.id);

    return NextResponse.json({ flag }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/feature-flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/feature-flags?id=<flag-id>
 * Update an existing feature flag
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get flag ID from query params
    const flagId = request.nextUrl.searchParams.get('id');
    if (!flagId) {
      return NextResponse.json(
        { error: 'Flag ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = (await request.json()) as UpdateFeatureFlagRequest;

    // Get old flag for audit
    const { data: oldFlag } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', flagId)
      .single();

    // Update flag
    const { data: flag, error } = await updateFeatureFlag(flagId, body);

    if (error || !flag) {
      return NextResponse.json({ error: error || 'Failed to update flag' }, { status: 500 });
    }

    // Determine event type
    const event = oldFlag && oldFlag.enabled !== flag.enabled ? 'toggled' : 'updated';

    // Trigger webhooks
    await triggerWebhooks(flag.id, event, flag, user.id, {
      old: oldFlag,
      new: flag,
    });

    return NextResponse.json({ flag });
  } catch (error) {
    console.error('Error in PUT /api/admin/feature-flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/feature-flags?id=<flag-id>
 * Delete a feature flag
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get flag ID from query params
    const flagId = request.nextUrl.searchParams.get('id');
    if (!flagId) {
      return NextResponse.json(
        { error: 'Flag ID is required' },
        { status: 400 }
      );
    }

    // Get flag for webhook
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', flagId)
      .single();

    // Delete flag
    const { error } = await deleteFeatureFlag(flagId);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    // Trigger webhooks if flag existed
    if (flag) {
      await triggerWebhooks(flag.id, 'deleted', flag, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/feature-flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
