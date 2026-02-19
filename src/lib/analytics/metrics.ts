/**
 * Analytics Metrics Utilities
 * 
 * Shared query logic for analytics and user engagement metrics.
 * Removes duplication across admin analytics routes.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface ActiveUsersMetrics {
  total_active: number
  daily_active: number
  weekly_active: number
  monthly_active: number
}

export interface UserEngagementMetrics {
  total_users: number
  engaged_users: number
  engagement_rate: number
  avg_session_duration: number
  total_sessions: number
}

export interface AnalyticsTimeRange {
  start: string // ISO date string
  end: string // ISO date string
}

/**
 * Get active users metrics for specified time ranges
 */
export async function getActiveUsers(
  supabase: SupabaseClient,
  timeRange?: AnalyticsTimeRange
): Promise<{ data: ActiveUsersMetrics | null; error?: string }> {
  try {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get daily active users (distinct users only)
    const { data: dailyUsers, error: dailyError } = await supabase
      .from('user_activity_log')
      .select('user_id', { count: 'exact' })
      .gte('created_at', oneDayAgo.toISOString())
      .in('activity_type', ['login', 'action', 'session_start'])

    if (dailyError) throw dailyError
    
    // Count unique users
    const dailyActive = dailyUsers ? new Set(dailyUsers.map(u => u.user_id)).size : 0

    // Get weekly active users (distinct users only)
    const { data: weeklyUsers, error: weeklyError } = await supabase
      .from('user_activity_log')
      .select('user_id', { count: 'exact' })
      .gte('created_at', oneWeekAgo.toISOString())
      .in('activity_type', ['login', 'action', 'session_start'])

    if (weeklyError) throw weeklyError
    
    // Count unique users
    const weeklyActive = weeklyUsers ? new Set(weeklyUsers.map(u => u.user_id)).size : 0

    // Get monthly active users (distinct users only)
    const { data: monthlyUsers, error: monthlyError } = await supabase
      .from('user_activity_log')
      .select('user_id', { count: 'exact' })
      .gte('created_at', oneMonthAgo.toISOString())
      .in('activity_type', ['login', 'action', 'session_start'])

    if (monthlyError) throw monthlyError
    
    // Count unique users
    const monthlyActive = monthlyUsers ? new Set(monthlyUsers.map(u => u.user_id)).size : 0

    if (monthlyError) throw monthlyError

    // Get total active (all time)
    const { count: totalActive, error: totalError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (totalError) throw totalError

    return {
      data: {
        total_active: totalActive || 0,
        daily_active: dailyActive || 0,
        weekly_active: weeklyActive || 0,
        monthly_active: monthlyActive || 0,
      },
    }
  } catch (error) {
    console.error('Failed to get active users:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagement(
  supabase: SupabaseClient,
  timeRange?: AnalyticsTimeRange
): Promise<{ data: UserEngagementMetrics | null; error?: string }> {
  try {
    const startDate = timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = timeRange?.end || new Date().toISOString()

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (usersError) throw usersError

    // Get engaged users (distinct users with activity in time range)
    const { data: engagedUserRecords, error: engagedError } = await supabase
      .from('user_activity_log')
      .select('user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (engagedError) throw engagedError
    
    // Count unique engaged users
    const engagedUsers = engagedUserRecords ? new Set(engagedUserRecords.map(u => u.user_id)).size : 0

    // Get total sessions
    const { count: totalSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (sessionsError) throw sessionsError

    // Get average session duration
    const { data: sessionData, error: durationError } = await supabase
      .from('sessions')
      .select('duration_seconds')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('duration_seconds', 'is', null)

    if (durationError) throw durationError

    const avgDuration =
      sessionData && sessionData.length > 0
        ? sessionData.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessionData.length
        : 0

    const engagementRate = totalUsers && totalUsers > 0 ? (engagedUsers || 0) / totalUsers : 0

    return {
      data: {
        total_users: totalUsers || 0,
        engaged_users: engagedUsers || 0,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        avg_session_duration: Math.round(avgDuration),
        total_sessions: totalSessions || 0,
      },
    }
  } catch (error) {
    console.error('Failed to get user engagement:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get session metrics for dashboard overview
 */
export async function getSessionMetrics(
  supabase: SupabaseClient,
  timeRange?: AnalyticsTimeRange
): Promise<{
  data: {
    total_sessions: number
    avg_duration_seconds: number
    active_sessions: number
  } | null
  error?: string
}> {
  try {
    const startDate = timeRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const endDate = timeRange?.end || new Date().toISOString()

    // Total sessions in time range
    const { count: totalSessions, error: totalError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (totalError) throw totalError

    // Active sessions (not ended)
    const { count: activeSessions, error: activeError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .is('ended_at', null)

    if (activeError) throw activeError

    // Average duration
    const { data: durationData, error: durationError } = await supabase
      .from('sessions')
      .select('duration_seconds')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('duration_seconds', 'is', null)

    if (durationError) throw durationError

    const avgDuration =
      durationData && durationData.length > 0
        ? durationData.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / durationData.length
        : 0

    return {
      data: {
        total_sessions: totalSessions || 0,
        avg_duration_seconds: Math.round(avgDuration),
        active_sessions: activeSessions || 0,
      },
    }
  } catch (error) {
    console.error('Failed to get session metrics:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
