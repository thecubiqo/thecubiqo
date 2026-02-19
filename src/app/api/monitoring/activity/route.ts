/**
 * Monitoring Activity API Endpoint
 * 
 * Receives and processes activity events from GitHub Actions workflows.
 * Tracks branch pushes, PR activity, deployments, and health checks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ActivityEvent {
  type: 'branch_push' | 'pr_activity' | 'deployment' | 'health_check'
  timestamp: string
  repository: string
  [key: string]: unknown
}

/**
 * POST /api/monitoring/activity
 * 
 * Receives activity events from GitHub Actions workflows
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const monitoringSecret = process.env.MONITORING_SECRET
    
    if (!monitoringSecret) {
      console.warn('MONITORING_SECRET not configured')
      return NextResponse.json(
        { error: 'Monitoring not configured' },
        { status: 503 }
      )
    }
    
    if (!authHeader || authHeader !== `Bearer ${monitoringSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse event data
    const event = await request.json() as ActivityEvent
    
    if (!event.type || !event.timestamp || !event.repository) {
      return NextResponse.json(
        { error: 'Invalid event data: missing required fields' },
        { status: 400 }
      )
    }
    
    // Store event in database
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('monitoring_events')
      .insert({
        event_type: event.type,
        event_data: event,
        repository: event.repository,
        created_at: new Date(event.timestamp).toISOString(),
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to store monitoring event:', error)
      
      // If table doesn't exist, log to console but don't fail
      if (error.code === '42P01') {
        console.log('Monitoring event (table not found):', JSON.stringify(event, null, 2))
        return NextResponse.json({
          success: true,
          message: 'Event logged (database table pending migration)',
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to store event', details: error.message },
        { status: 500 }
      )
    }
    
    // Log significant events to console
    logEventToConsole(event)
    
    return NextResponse.json({
      success: true,
      event_id: data?.id,
      message: 'Event recorded successfully',
    })
  } catch (error) {
    console.error('Error processing monitoring event:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/monitoring/activity
 * 
 * Retrieves recent monitoring events (admin only)
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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    // Query monitoring events
    let query = supabase
      .from('monitoring_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (type) {
      query = query.eq('event_type', type)
    }
    
    const { data, error } = await query
    
    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({
          events: [],
          message: 'Monitoring table pending migration',
        })
      }
      
      console.error('Failed to fetch monitoring events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      events: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching monitoring events:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to log significant events to console
 */
function logEventToConsole(event: ActivityEvent): void {
  const timestamp = new Date(event.timestamp).toISOString()
  
  switch (event.type) {
    case 'branch_push':
      console.log(`[MONITORING] Branch push to ${event.branch} by ${event.actor} at ${timestamp}`)
      break
    case 'pr_activity':
      console.log(`[MONITORING] PR #${event.pr_number} ${event.action} by ${event.author} at ${timestamp}`)
      break
    case 'deployment':
      console.log(`[MONITORING] Deployment to ${event.environment}: ${event.state} at ${timestamp}`)
      break
    case 'health_check':
      console.log(`[MONITORING] Health check completed at ${timestamp}`)
      break
    default:
      console.log(`[MONITORING] Event: ${event.type} at ${timestamp}`)
  }
}
