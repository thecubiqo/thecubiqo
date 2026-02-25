/**
 * Job Hunt Dashboard API Route
 * Provides dashboard statistics and summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { JobHuntDashboardStats } from '@/types/job-hunt'

// GET - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's job hunt profile
    const { data: profile } = await supabase
      .from('job_hunt_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Job hunt profile not found' },
        { status: 404 }
      )
    }

    // Get total applications count
    const { count: totalCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)

    // Get counts by status
    const { count: pendingCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .eq('status', 'pending')

    const { count: appliedCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .eq('status', 'applied')

    const { count: interviewsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .in('status', ['screening', 'interview_scheduled', 'interview_completed'])

    const { count: offersCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .eq('status', 'offer_received')

    const { count: rejectedCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .eq('status', 'rejected')

    // Get last activity
    const { data: lastActivity } = await supabase
      .from('job_hunt_activities')
      .select('created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get active platforms
    const { data: platformsData } = await supabase
      .from('job_applications')
      .select('platform')
      .eq('profile_id', profile.id)

    const activePlatforms = [...new Set((platformsData || []).map((p: any) => p.platform))]

    // Get recent activities
    const { data: recentActivities } = await supabase
      .from('job_hunt_activities')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get pending questions
    const { data: pendingQuestions } = await supabase
      .from('job_hunt_questions')
      .select('*')
      .eq('profile_id', profile.id)
      .is('answer', null)

    // Build stats
    const stats: JobHuntDashboardStats = {
      total_applications: totalCount || 0,
      pending: pendingCount || 0,
      applied: appliedCount || 0,
      interviews: interviewsCount || 0,
      offers: offersCount || 0,
      rejected: rejectedCount || 0,
      last_activity: lastActivity?.created_at || null,
      active_platforms: activePlatforms as any,
    }

    return NextResponse.json({
      profile,
      stats,
      recent_activities: recentActivities || [],
      pending_questions: pendingQuestions || [],
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/job-hunt/dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
