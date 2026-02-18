import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id]/sessions
 * List user's active sessions
 * Admin-only access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: userId } = params;
    const { searchParams } = new URL(request.url);

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

    // Parse query parameters
    const activeOnly = searchParams.get('active') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const offset = (page - 1) * limit;

    // Verify user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Filter for active sessions only
    if (activeOnly) {
      query = query.gte('expires_at', new Date().toISOString());
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    // Categorize sessions
    const now = new Date();
    const activeSessions = sessions?.filter(
      (s) => !s.expires_at || new Date(s.expires_at) > now
    ) || [];
    const expiredSessions = sessions?.filter(
      (s) => s.expires_at && new Date(s.expires_at) <= now
    ) || [];

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile.email,
      p_action_type: 'user_sessions_viewed',
      p_action_details: {
        target_user_id: userId,
        target_email: targetUser.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions || [],
        stats: {
          total: count || 0,
          active: activeSessions.length,
          expired: expiredSessions.length,
        },
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]/sessions:', error);
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
 * DELETE /api/admin/users/[id]/sessions
 * Terminate specific session or all sessions for a user
 * Query params:
 *   - session_id: (optional) specific session to terminate
 *   - If session_id not provided, terminates ALL user sessions
 * Admin-only access
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: userId } = params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

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

    // Verify user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let terminatedCount = 0;

    if (sessionId) {
      // Terminate specific session
      // Validate session ID format
      if (!uuidRegex.test(sessionId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid session ID format' },
          { status: 400 }
        );
      }

      // Verify session belongs to the user
      const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found or does not belong to user' },
          { status: 404 }
        );
      }

      // Terminate session by setting expires_at to now
      const { error: deleteError } = await supabase
        .from('sessions')
        .update({ expires_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (deleteError) {
        console.error('Error terminating session:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to terminate session' },
          { status: 500 }
        );
      }

      terminatedCount = 1;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_user_id: user.id,
        p_user_email: profile.email,
        p_action_type: 'session_terminated',
        p_action_details: {
          target_user_id: userId,
          target_email: targetUser.email,
          session_id: sessionId,
        },
      });
    } else {
      // Terminate all active sessions for the user
      // First, count how many active sessions exist
      const { data: activeSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString());

      terminatedCount = activeSessions?.length || 0;

      // Terminate all sessions by setting expires_at to now
      const { error: deleteError } = await supabase
        .from('sessions')
        .update({ expires_at: new Date().toISOString() })
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString());

      if (deleteError) {
        console.error('Error terminating sessions:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to terminate sessions' },
          { status: 500 }
        );
      }

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_user_id: user.id,
        p_user_email: profile.email,
        p_action_type: 'all_sessions_terminated',
        p_action_details: {
          target_user_id: userId,
          target_email: targetUser.email,
          sessions_terminated: terminatedCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        terminatedCount,
      },
      message: sessionId
        ? 'Session terminated successfully'
        : `All ${terminatedCount} active session(s) terminated successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]/sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
