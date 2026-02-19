import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Query profiles table for user info
    const { data: profiles, error: profilesError, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }
    
    // Map to user objects with basic info
    const users = (profiles || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      is_admin: profile.is_admin || false,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      last_seen: profile.last_seen,
    }));
    
    return NextResponse.json({
      users,
      total: count || users.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        users: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
