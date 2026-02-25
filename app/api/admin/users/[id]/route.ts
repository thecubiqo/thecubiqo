import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id]
 * Get user details with sessions and activity stats
 * Admin-only access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = (await createClient()) as any;
    const { id: userId } = await params;

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Validate user ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch user profile
    const { data: targetUser, error: userError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user sessions
    const { data: sessions, error: sessionsError } = await (supabase as any)
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Count active sessions
    const activeSessions = sessions?.filter(
      (s: any) => !s.expires_at || new Date(s.expires_at) > new Date()
    ).length || 0;

    // Fetch recent activity
    const { data: recentActivity, error: activityError } = await (supabase as any)
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (activityError) {
      console.error('Error fetching activity:', activityError);
    }

    // Fetch security alerts related to this user
    const { data: securityAlerts, error: alertsError } = await (supabase as any)
      .from('security_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (alertsError) {
      console.error('Error fetching security alerts:', alertsError);
    }

    // Fetch audit logs for this user
    const { data: auditLogs, error: auditError } = await (supabase as any)
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (auditError) {
      console.error('Error fetching audit logs:', auditError);
    }

    // Calculate activity stats
    const stats = {
      totalSessions: sessions?.length || 0,
      activeSessions,
      totalActivities: recentActivity?.length || 0,
      securityAlerts: securityAlerts?.length || 0,
      lastActivity: recentActivity?.[0]?.created_at || null,
      lastLogin: sessions?.[0]?.created_at || null,
    };

    // Log admin action
    await (supabase as any).rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile.email || '',
      p_action_type: 'user_viewed',
      p_action_details: { target_user_id: userId, target_email: targetUser.email || '' },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: targetUser,
        sessions: sessions || [],
        recentActivity: recentActivity || [],
        securityAlerts: securityAlerts || [],
        auditLogs: auditLogs || [],
        stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user (display_name, is_admin, preferences)
 * Admin-only access
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = (await createClient()) as any;
    const { id: userId } = await params;

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Validate user ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { display_name, is_admin, preferences } = body;

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) {
      updates.display_name = display_name;
    }

    if (is_admin !== undefined) {
      if (typeof is_admin !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'is_admin must be a boolean' },
          { status: 400 }
        );
      }
      updates.is_admin = is_admin;
    }

    if (preferences !== undefined) {
      if (typeof preferences !== 'object' || preferences === null) {
        return NextResponse.json(
          { success: false, error: 'preferences must be an object' },
          { status: 400 }
        );
      }
      updates.preferences = preferences;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 1) {
      // Only updated_at
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Fetch current user data for comparison
    const { data: currentUser } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Perform update
    const { data: updatedUser, error: updateError } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log admin action with details of what changed
    const changes: any = {};
    if (display_name !== undefined && display_name !== currentUser.display_name) {
      changes.display_name = { from: currentUser.display_name, to: display_name };
    }
    if (is_admin !== undefined && is_admin !== currentUser.is_admin) {
      changes.is_admin = { from: currentUser.is_admin, to: is_admin };
    }
    if (preferences !== undefined) {
      changes.preferences = { updated: true };
    }

    await (supabase as any).rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile.email || '',
      p_action_type: 'user_updated',
      p_action_details: {
        target_user_id: userId,
        target_email: currentUser.email || '',
        changes,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Soft delete user (archive)
 * Admin-only access
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = (await createClient()) as any;
    const { id: userId } = await params;

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Validate user ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Fetch user data before deletion
    const { data: targetUser } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete: Add 'deleted_at' to preferences
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        preferences: {
          ...(targetUser.preferences as object || {}),
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error soft deleting user:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Expire all user sessions
    await (supabase as any)
      .from('sessions')
      .update({ expires_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Log admin action
    await (supabase as any).rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile.email || '',
      p_action_type: 'user_deleted',
      p_action_details: {
        target_user_id: userId,
        target_email: targetUser.email || '',
        deletion_type: 'soft_delete',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User archived successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
