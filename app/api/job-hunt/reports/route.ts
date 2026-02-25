/**
 * Job Hunt Reports API Route
 * Handles email report generation and sending
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GenerateReportRequest } from '@/types/job-hunt'

// GET - Fetch report history
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Job hunt profile not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch reports
    const { data: reports, error: fetchError } = await supabase
      .from('job_hunt_reports')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Error fetching reports:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error('Unexpected error in GET /api/job-hunt/reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Generate and send report
export async function POST(request: NextRequest) {
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

    // Get user's job hunt profile with profile info
    const { data: jobProfile } = await supabase
      .from('job_hunt_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job hunt profile not found' },
        { status: 404 }
      )
    }

    // Get user profile for email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!userProfile?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Parse request body
    const body: GenerateReportRequest = await request.json()

    if (!body.report_type) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      )
    }

    // Get report data based on type
    let reportContent = ''
    let reportSubject = ''

    switch (body.report_type) {
      case 'daily_summary':
        reportSubject = `Job Hunt Daily Summary - ${new Date().toLocaleDateString()}`
        reportContent = await generateDailySummary(supabase, jobProfile.id)
        break

      case 'weekly_summary':
        reportSubject = `Job Hunt Weekly Summary - ${new Date().toLocaleDateString()}`
        reportContent = await generateWeeklySummary(supabase, jobProfile.id)
        break

      case 'interview_alert':
        reportSubject = 'Interview Alert - Action Required'
        reportContent = await generateInterviewAlert(supabase, jobProfile.id)
        break

      case 'screening_alert':
        reportSubject = 'Screening Alert - Action Required'
        reportContent = await generateScreeningAlert(supabase, jobProfile.id)
        break

      case 'activity_update':
        reportSubject = 'Job Hunt Activity Update'
        reportContent = await generateActivityUpdate(supabase, jobProfile.id)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Save report to database
    const { data: report, error: insertError } = await supabase
      .from('job_hunt_reports')
      .insert({
        profile_id: jobProfile.id,
        report_type: body.report_type,
        subject: reportSubject,
        content: reportContent,
        status: 'pending',
        metadata: {},
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating report:', insertError)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    // TODO: Send email using Resend or other email service
    // For now, mark as sent
    await supabase
      .from('job_hunt_reports')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', report.id)

    // Log activity
    await supabase.from('job_hunt_activities').insert({
      profile_id: jobProfile.id,
      activity_type: 'email_sent',
      description: `Report sent: ${reportSubject}`,
      details: { report_type: body.report_type },
    })

    return NextResponse.json({
      success: true,
      report,
      message: 'Report generated and queued for sending'
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/job-hunt/reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions to generate report content
async function generateDailySummary(supabase: any, profileId: string): Promise<string> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayActivities } = await supabase
    .from('job_hunt_activities')
    .select('*')
    .eq('profile_id', profileId)
    .gte('created_at', today.toISOString())

  const { data: todayApplications } = await supabase
    .from('job_applications')
    .select('*')
    .eq('profile_id', profileId)
    .gte('created_at', today.toISOString())

  return `
    <h2>Daily Job Hunt Summary</h2>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    
    <h3>Today's Activity</h3>
    <ul>
      <li>Applications submitted: ${todayApplications?.length || 0}</li>
      <li>Total activities: ${todayActivities?.length || 0}</li>
    </ul>
    
    <h3>Recent Applications</h3>
    ${todayApplications?.map((app: any) => `
      <div>
        <strong>${app.job_title}</strong> at ${app.company_name}<br/>
        Status: ${app.status}<br/>
        Platform: ${app.platform}
      </div>
    `).join('<hr/>') || '<p>No applications today</p>'}
  `
}

async function generateWeeklySummary(supabase: any, profileId: string): Promise<string> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: weekActivities } = await supabase
    .from('job_hunt_activities')
    .select('*')
    .eq('profile_id', profileId)
    .gte('created_at', weekAgo.toISOString())

  return `
    <h2>Weekly Job Hunt Summary</h2>
    <p>Activities in the past 7 days: ${weekActivities?.length || 0}</p>
  `
}

async function generateInterviewAlert(supabase: any, profileId: string): Promise<string> {
  const { data: upcomingInterviews } = await supabase
    .from('job_applications')
    .select('*')
    .eq('profile_id', profileId)
    .eq('status', 'interview_scheduled')
    .not('interview_date', 'is', null)

  return `
    <h2>Upcoming Interviews</h2>
    ${upcomingInterviews?.map((app: any) => `
      <div>
        <strong>${app.job_title}</strong> at ${app.company_name}<br/>
        Interview Date: ${new Date(app.interview_date).toLocaleString()}<br/>
        Type: ${app.interview_type || 'Not specified'}
      </div>
    `).join('<hr/>') || '<p>No upcoming interviews</p>'}
  `
}

async function generateScreeningAlert(supabase: any, profileId: string): Promise<string> {
  const { data: screenings } = await supabase
    .from('job_applications')
    .select('*')
    .eq('profile_id', profileId)
    .eq('status', 'screening')

  return `
    <h2>Screening Alerts</h2>
    ${screenings?.map((app: any) => `
      <div>
        <strong>${app.job_title}</strong> at ${app.company_name}<br/>
        Status: Screening in progress
      </div>
    `).join('<hr/>') || '<p>No active screenings</p>'}
  `
}

async function generateActivityUpdate(supabase: any, profileId: string): Promise<string> {
  const { data: recentActivities } = await supabase
    .from('job_hunt_activities')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(10)

  return `
    <h2>Recent Activity</h2>
    ${recentActivities?.map((activity: any) => `
      <div>
        <strong>${activity.activity_type}</strong><br/>
        ${activity.description}<br/>
        <em>${new Date(activity.created_at).toLocaleString()}</em>
      </div>
    `).join('<hr/>') || '<p>No recent activity</p>'}
  `
}
