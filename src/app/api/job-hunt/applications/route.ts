/**
 * Job Hunt Applications API Route
 * Handles CRUD operations for job applications
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateJobApplicationRequest, UpdateApplicationStatusRequest } from '@/types/job-hunt'

// GET - Fetch user's job applications
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
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('job_applications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (platform) {
      query = query.eq('platform', platform)
    }
    
    const { data: applications, error: fetchError } = await query
    
    if (fetchError) {
      console.error('Error fetching applications:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Unexpected error in GET /api/job-hunt/applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new job application
export async function POST(request: NextRequest) {
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
    
    // Parse request body
    const body: CreateJobApplicationRequest = await request.json()
    
    // Validate required fields
    if (!body.job_title || !body.company_name || !body.platform) {
      return NextResponse.json(
        { error: 'Job title, company name, and platform are required' },
        { status: 400 }
      )
    }
    
    // Create application
    const { data: application, error: insertError } = await supabase
      .from('job_applications')
      .insert({
        profile_id: profile.id,
        job_title: body.job_title,
        company_name: body.company_name,
        job_url: body.job_url || null,
        job_description: body.job_description || null,
        platform: body.platform,
        status: 'pending',
        custom_cover_letter: body.custom_cover_letter || null,
        metadata: {},
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating application:', insertError)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }
    
    // Log activity
    await supabase.from('job_hunt_activities').insert({
      profile_id: profile.id,
      application_id: application.id,
      activity_type: 'application_submitted',
      description: `Application submitted for ${body.job_title} at ${body.company_name}`,
      details: { 
        job_title: body.job_title, 
        company: body.company_name,
        platform: body.platform 
      },
    })
    
    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/job-hunt/applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update application status
export async function PATCH(request: NextRequest) {
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
    
    // Parse request body
    const body: UpdateApplicationStatusRequest & { application_id: string } = await request.json()
    
    if (!body.application_id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }
    
    // Get current application data before update
    const { data: currentApp } = await supabase
      .from('job_applications')
      .select('status, company_name')
      .eq('id', body.application_id)
      .eq('profile_id', profile.id)
      .single()
    
    // Build update data
    const updateData: any = {
      last_updated_at: new Date().toISOString(),
    }
    
    if (body.status) updateData.status = body.status
    if (body.interview_date) updateData.interview_date = body.interview_date
    if (body.interview_type) updateData.interview_type = body.interview_type
    if (body.interview_notes) updateData.interview_notes = body.interview_notes
    
    // Update application
    const { data: application, error: updateError } = await supabase
      .from('job_applications')
      .update(updateData)
      .eq('id', body.application_id)
      .eq('profile_id', profile.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }
    
    // Log activity
    await supabase.from('job_hunt_activities').insert({
      profile_id: profile.id,
      application_id: application.id,
      activity_type: 'status_updated',
      description: `Application status updated to ${body.status}`,
      details: { 
        previous_status: currentApp?.status || 'unknown',
        new_status: body.status,
        company: currentApp?.company_name || application.company_name 
      },
    })
    
    return NextResponse.json({ application })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/job-hunt/applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
