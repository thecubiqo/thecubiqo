/**
 * Monitoring Dashboard API Endpoint
 * 
 * Provides aggregated monitoring data for dashboards and reporting.
 * Shows activity across staging, main, PRs, and Vercel deployments.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface DashboardData {
  summary: {
    total_events: number
    branch_pushes: number
    pr_activities: number
    deployments: number
    health_checks: number
  }
  recent_activity: Array<{
    type: string
    timestamp: string
    description: string
  }>
  branch_status: {
    main: {
      last_push: string | null
      last_deployment: string | null
    }
    staging: {
      last_push: string | null
      last_deployment: string | null
    }
  }
  pr_status: {
    open_prs: number
    merged_today: number
    closed_today: number
  }
}

/**
 * GET /api/monitoring/dashboard
 * 
 * Returns monitoring dashboard data (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    // Get time range for queries
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    // Check if monitoring_events table exists
    const { error: tableCheckError } = await supabase
      .from('monitoring_events')
      .select('id')
      .limit(1)
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      // Table doesn't exist, return placeholder data
      return NextResponse.json({
        message: 'Monitoring table pending migration',
        dashboard: getPlaceholderDashboard(),
      })
    }
    
    // Fetch event counts by type
    const { data: eventCounts } = await supabase
      .from('monitoring_events')
      .select('event_type')
      .gte('created_at', last7d)
    
    const summary = {
      total_events: eventCounts?.length || 0,
      branch_pushes: eventCounts?.filter(e => e.event_type === 'branch_push').length || 0,
      pr_activities: eventCounts?.filter(e => e.event_type === 'pr_activity').length || 0,
      deployments: eventCounts?.filter(e => e.event_type === 'deployment').length || 0,
      health_checks: eventCounts?.filter(e => e.event_type === 'health_check').length || 0,
    }
    
    // Fetch recent activity
    const { data: recentEvents } = await supabase
      .from('monitoring_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    const recent_activity = (recentEvents || []).map(event => ({
      type: event.event_type,
      timestamp: event.created_at,
      description: formatEventDescription(event),
    }))
    
    // Fetch branch status
    const { data: mainPushes } = await supabase
      .from('monitoring_events')
      .select('created_at, event_data')
      .eq('event_type', 'branch_push')
      .contains('event_data', { branch: 'main' })
      .order('created_at', { ascending: false })
      .limit(1)
    
    const { data: stagingPushes } = await supabase
      .from('monitoring_events')
      .select('created_at, event_data')
      .eq('event_type', 'branch_push')
      .contains('event_data', { branch: 'staging' })
      .order('created_at', { ascending: false })
      .limit(1)
    
    const { data: mainDeployments } = await supabase
      .from('monitoring_events')
      .select('created_at, event_data')
      .eq('event_type', 'deployment')
      .contains('event_data', { environment: 'production' })
      .order('created_at', { ascending: false })
      .limit(1)
    
    const { data: stagingDeployments } = await supabase
      .from('monitoring_events')
      .select('created_at, event_data')
      .eq('event_type', 'deployment')
      .contains('event_data', { environment: 'preview' })
      .order('created_at', { ascending: false })
      .limit(1)
    
    const branch_status = {
      main: {
        last_push: mainPushes?.[0]?.created_at || null,
        last_deployment: mainDeployments?.[0]?.created_at || null,
      },
      staging: {
        last_push: stagingPushes?.[0]?.created_at || null,
        last_deployment: stagingDeployments?.[0]?.created_at || null,
      },
    }
    
    // Fetch PR status
    const { data: prEvents } = await supabase
      .from('monitoring_events')
      .select('event_data')
      .eq('event_type', 'pr_activity')
      .gte('created_at', last24h)
    
    const pr_status = {
      open_prs: prEvents?.filter((e: { event_data: MonitoringEventData }) => e.event_data?.action === 'opened').length || 0,
      merged_today: prEvents?.filter((e: { event_data: MonitoringEventData }) => e.event_data?.merged === true).length || 0,
      closed_today: prEvents?.filter((e: { event_data: MonitoringEventData }) => e.event_data?.action === 'closed' && !e.event_data?.merged).length || 0,
    }
    
    const dashboardData: DashboardData = {
      summary,
      recent_activity,
      branch_status,
      pr_status,
    }
    
    return NextResponse.json({
      dashboard: dashboardData,
      generated_at: now.toISOString(),
    })
  } catch (error) {
    console.error('Error generating dashboard:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

interface MonitoringEventData {
  branch?: string
  actor?: string
  pr_number?: number
  author?: string
  action?: string
  environment?: string
  state?: string
  [key: string]: unknown
}

interface MonitoringEvent {
  event_type: string
  event_data: MonitoringEventData
  created_at: string
}

/**
 * Format event data into human-readable description
 */
function formatEventDescription(event: MonitoringEvent): string {
  const data = event.event_data
  
  switch (event.event_type) {
    case 'branch_push':
      return `Push to ${data.branch || 'unknown'} by ${data.actor || 'unknown'}`
    case 'pr_activity':
      return `PR #${data.pr_number || '?'} ${data.action || 'updated'} by ${data.author || 'unknown'}`
    case 'deployment':
      return `Deployment to ${data.environment || 'unknown'}: ${data.state || 'unknown'}`
    case 'health_check':
      return 'Periodic health check completed'
    default:
      return `${event.event_type} event`
  }
}

/**
 * Get placeholder dashboard data when monitoring table doesn't exist
 */
function getPlaceholderDashboard(): DashboardData {
  return {
    summary: {
      total_events: 0,
      branch_pushes: 0,
      pr_activities: 0,
      deployments: 0,
      health_checks: 0,
    },
    recent_activity: [],
    branch_status: {
      main: {
        last_push: null,
        last_deployment: null,
      },
      staging: {
        last_push: null,
        last_deployment: null,
      },
    },
    pr_status: {
      open_prs: 0,
      merged_today: 0,
      closed_today: 0,
    },
  }
}
