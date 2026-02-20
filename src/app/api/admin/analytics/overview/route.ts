import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/overview
 * Comprehensive analytics overview
 * Admin-only access
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

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse date range parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total users count
    const { count: totalUsers } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users in last 7 days
    const { count: activeUsers7d } = await (supabase as any)
      .from('user_activity_log')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get active users in last 30 days
    const { count: activeUsers30d } = await (supabase as any)
      .from('user_activity_log')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get session statistics
    const { count: totalSessions } = await (supabase as any)
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    const { count: activeSessions } = await (supabase as any)
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('expires_at', now.toISOString());

    // Get average session duration (last 30 days)
    const { data: sessionDurations } = await (supabase as any)
      .from('sessions')
      .select('created_at, expires_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('expires_at', 'is', null)
      .limit(1000);

    let avgSessionDuration = 0;
    if (sessionDurations && sessionDurations.length > 0) {
      const totalDuration = sessionDurations.reduce((sum: number, session: any) => {
        if (!session.created_at || !session.expires_at) return sum;
        const start = new Date(session.created_at).getTime();
        const end = new Date(session.expires_at).getTime();
        return sum + (end - start);
      }, 0);
      avgSessionDuration = totalDuration / sessionDurations.length / (1000 * 60); // Convert to minutes
    }

    // Get message/conversation counts
    const { count: totalMessages } = await (supabase as any)
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'message_sent');

    const { count: totalConversations } = await (supabase as any)
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gt('message_count', 0);

    // Get user engagement metrics
    const { data: activityStats } = await (supabase as any)
      .from('user_activity_log')
      .select('activity_type')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const engagementByType: Record<string, number> = {};
    activityStats?.forEach((activity: any) => {
      engagementByType[activity.activity_type] =
        (engagementByType[activity.activity_type] || 0) + 1;
    });

    // Get growth trends - daily new users
    const { data: dailySignups } = await (supabase as any)
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const dailyGrowth: Record<string, number> = {};
    dailySignups?.forEach((profile: any) => {
      if (!profile.created_at) return;
      const date = new Date(profile.created_at).toISOString().split('T')[0];
      dailyGrowth[date] = (dailyGrowth[date] || 0) + 1;
    });

    // Get weekly growth trends
    const weeklyGrowth: Record<string, number> = {};
    dailySignups?.forEach((profile: any) => {
      if (!profile.created_at) return;
      const date = new Date(profile.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyGrowth[weekKey] = (weeklyGrowth[weekKey] || 0) + 1;
    });

    // Get channel breakdown (voice vs text)
    const { data: channelStats } = await (supabase as any)
      .from('user_activity_log')
      .select('channel')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('channel', 'is', null);

    const channelBreakdown: Record<string, number> = {};
    channelStats?.forEach((activity: any) => {
      if (activity.channel) {
        channelBreakdown[activity.channel] =
          (channelBreakdown[activity.channel] || 0) + 1;
      }
    });

    // Calculate engagement rate (active users / total users)
    const engagementRate7d = totalUsers ? (activeUsers7d || 0) / totalUsers : 0;
    const engagementRate30d = totalUsers ? (activeUsers30d || 0) / totalUsers : 0;

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers || 0,
          active7d: activeUsers7d || 0,
          active30d: activeUsers30d || 0,
          engagementRate7d: Number((engagementRate7d * 100).toFixed(2)),
          engagementRate30d: Number((engagementRate30d * 100).toFixed(2)),
        },
        sessions: {
          total: totalSessions || 0,
          activeNow: activeSessions || 0,
          avgDurationMinutes: Number(avgSessionDuration.toFixed(2)),
        },
        content: {
          totalMessages: totalMessages || 0,
          totalConversations: totalConversations || 0,
          avgMessagesPerConversation: totalConversations
            ? Number(((totalMessages || 0) / totalConversations).toFixed(2))
            : 0,
        },
        engagement: {
          byType: engagementByType,
          byChannel: channelBreakdown,
        },
        growth: {
          daily: Object.entries(dailyGrowth).map(([date, count]) => ({
            date,
            count,
          })),
          weekly: Object.entries(weeklyGrowth).map(([week, count]) => ({
            week,
            count,
          })),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/overview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
