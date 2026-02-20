import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users
 * List all users with filtering, pagination, and search
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
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
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role'); // 'admin' | 'user'
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,handle.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    // Apply role filter
    if (role === 'admin') {
      query = query.eq('is_admin', true);
    } else if (role === 'user') {
      query = query.eq('is_admin', false);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get active session counts for each user
    const userIds = users?.map(u => u.id) || [];
    const { data: sessionCounts } = await supabase
      .from('sessions')
      .select('user_id')
      .in('user_id', userIds)
      .gte('expires_at', new Date().toISOString());

    const activeSessionsByUser = sessionCounts?.reduce((acc, s) => {
      acc[s.user_id] = (acc[s.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Enrich user data
    const enrichedUsers = users?.map(user => ({
      ...user,
      activeSessions: activeSessionsByUser[user.id] || 0,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create or invite a new user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, display_name, is_admin = false } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile.email,
      p_action_type: 'user_created',
      p_action_details: { target_email: email, is_admin },
    });

    // Note: User creation is typically handled by Supabase Auth
    // This endpoint can be used to send invites or pre-configure user settings
    return NextResponse.json({
      message: 'User creation initiated',
      email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
