import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/user-engagement
 * User engagement metrics and cohort analysis
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

    const { data: profile } = await supabase
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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get session frequency distribution
    const { data: userSessions } = await supabase
      .from('sessions')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const sessionsByUser: Record<string, number> = {};
    userSessions?.forEach((session) => {
      if (session.user_id) {
        sessionsByUser[session.user_id] = (sessionsByUser[session.user_id] || 0) + 1;
      }
    });

    // Categorize users by session frequency
    const frequencyDistribution = {
      veryActive: 0,   // 20+ sessions
      active: 0,       // 10-19 sessions
      moderate: 0,     // 5-9 sessions
      light: 0,        // 2-4 sessions
      minimal: 0,      // 1 session
    };

    Object.values(sessionsByUser).forEach((count) => {
      if (count >= 20) frequencyDistribution.veryActive++;
      else if (count >= 10) frequencyDistribution.active++;
      else if (count >= 5) frequencyDistribution.moderate++;
      else if (count >= 2) frequencyDistribution.light++;
      else frequencyDistribution.minimal++;
    });

    // Get feature usage statistics
    const { data: featureUsage } = await supabase
      .from('user_activity_log')
      .select('activity_type')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const featureStats: Record<string, number> = {};
    featureUsage?.forEach((activity) => {
      featureStats[activity.activity_type] = 
        (featureStats[activity.activity_type] || 0) + 1;
    });

    // Get channel breakdown (voice vs text)
    const { data: channelData } = await supabase
      .from('user_activity_log')
      .select('channel, user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('channel', 'is', null);

    const channelBreakdown: Record<string, { users: Set<string>; activities: number }> = {};
    channelData?.forEach((activity) => {
      if (activity.channel) {
        if (!channelBreakdown[activity.channel]) {
          channelBreakdown[activity.channel] = {
            users: new Set(),
            activities: 0,
          };
        }
        if (activity.user_id) {
          channelBreakdown[activity.channel].users.add(activity.user_id);
        }
        channelBreakdown[activity.channel].activities++;
      }
    });

    const channelStats = Object.entries(channelBreakdown).map(([channel, data]) => ({
      channel,
      uniqueUsers: data.users.size,
      totalActivities: data.activities,
    }));

    // Retention metrics - cohort analysis
    // Get users who signed up 30, 60, and 90 days ago
    const { data: cohort30 } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .lt('created_at', now.toISOString());

    const { data: cohort60 } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const { data: cohort90 } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .lt('created_at', sixtyDaysAgo.toISOString());

    // Check which users from each cohort were active in the last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const getRetainedUsers = async (cohortUserIds: string[]) => {
      if (!cohortUserIds.length) return 0;
      
      const { data: activeUsers } = await supabase
        .from('user_activity_log')
        .select('user_id')
        .in('user_id', cohortUserIds)
        .gte('created_at', sevenDaysAgo.toISOString());

      const uniqueActiveUsers = new Set(activeUsers?.map(a => a.user_id));
      return uniqueActiveUsers.size;
    };

    const cohort30Ids = cohort30?.map(u => u.id) || [];
    const cohort60Ids = cohort60?.map(u => u.id) || [];
    const cohort90Ids = cohort90?.map(u => u.id) || [];

    const [retained30, retained60, retained90] = await Promise.all([
      getRetainedUsers(cohort30Ids),
      getRetainedUsers(cohort60Ids),
      getRetainedUsers(cohort90Ids),
    ]);

    const cohortAnalysis = [
      {
        cohort: '30-day',
        totalUsers: cohort30Ids.length,
        retainedUsers: retained30,
        retentionRate: cohort30Ids.length 
          ? Number((retained30 / cohort30Ids.length * 100).toFixed(2))
          : 0,
      },
      {
        cohort: '60-day',
        totalUsers: cohort60Ids.length,
        retainedUsers: retained60,
        retentionRate: cohort60Ids.length 
          ? Number((retained60 / cohort60Ids.length * 100).toFixed(2))
          : 0,
      },
      {
        cohort: '90-day',
        totalUsers: cohort90Ids.length,
        retainedUsers: retained90,
        retentionRate: cohort90Ids.length 
          ? Number((retained90 / cohort90Ids.length * 100).toFixed(2))
          : 0,
      },
    ];

    // Get average activities per user
    const totalUniqueUsers = Object.keys(sessionsByUser).length;
    const totalActivities = featureUsage?.length || 0;
    const avgActivitiesPerUser = totalUniqueUsers 
      ? Number((totalActivities / totalUniqueUsers).toFixed(2))
      : 0;

    // Get top engaged users (most activities in last 30 days)
    const { data: topEngagedData } = await supabase
      .from('user_activity_log')
      .select('user_id, profiles!inner(email, display_name, handle)')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const userActivityCounts: Record<string, { count: number; email?: string; display_name?: string; handle?: string }> = {};
    topEngagedData?.forEach((activity: any) => {
      if (activity.user_id) {
        if (!userActivityCounts[activity.user_id]) {
          userActivityCounts[activity.user_id] = {
            count: 0,
            email: activity.profiles?.email,
            display_name: activity.profiles?.display_name,
            handle: activity.profiles?.handle,
          };
        }
        userActivityCounts[activity.user_id].count++;
      }
    });

    const topEngagedUsers = Object.entries(userActivityCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([userId, data]) => ({
        userId,
        email: data.email,
        displayName: data.display_name,
        handle: data.handle,
        activityCount: data.count,
      }));

    return NextResponse.json({
      success: true,
      data: {
        sessionFrequency: frequencyDistribution,
        featureUsage: Object.entries(featureStats)
          .sort(([, a], [, b]) => b - a)
          .map(([feature, count]) => ({ feature, count })),
        channelBreakdown: channelStats,
        retention: {
          cohorts: cohortAnalysis,
          overallRetentionRate: Number((
            cohortAnalysis.reduce((sum, c) => sum + c.retentionRate, 0) / 
            cohortAnalysis.length
          ).toFixed(2)),
        },
        engagement: {
          avgActivitiesPerUser,
          totalUniqueUsers,
          topEngagedUsers,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/user-engagement:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
