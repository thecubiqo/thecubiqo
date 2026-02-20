/**
 * Job Hunt Profile API Route
 * Handles CRUD operations for job hunt profiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateJobHuntProfileRequest, UpdateJobHuntProfileRequest } from '@/types/job-hunt'

// GET - Fetch user's job hunt profile
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

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('job_hunt_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching job hunt profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: profile || null })
  } catch (error) {
    console.error('Unexpected error in GET /api/job-hunt/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new job hunt profile
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

    // Parse request body
    const body = (await request.json()) as any

    // Validate required fields
    if (!body.target_roles || body.target_roles.length === 0) {
      return NextResponse.json(
        { error: 'Target roles are required' },
        { status: 400 }
      )
    }

    if (!body.skills || body.skills.length === 0) {
      return NextResponse.json(
        { error: 'Skills are required' },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('job_hunt_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists. Use PATCH to update.' },
        { status: 400 }
      )
    }

    // Create profile
    const { data: profile, error: insertError } = await supabase
      .from('job_hunt_profiles')
      .insert({
        user_id: user.id,
        target_roles: body.target_roles,
        target_companies: body.target_companies || [],
        target_locations: body.target_locations || [],
        work_type: body.work_type || [],
        job_types: body.job_types || [],
        salary_min: body.salary_min || null,
        salary_max: body.salary_max || null,
        skills: body.skills,
        years_of_experience: body.years_of_experience || null,
        linkedin_profile: body.linkedin_profile || null,
        github_profile: body.github_profile || null,
        portfolio_url: body.portfolio_url || null,
        is_active: true,
        preferences: {},
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating job hunt profile:', insertError)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('job_hunt_activities').insert({
      profile_id: profile.id,
      activity_type: 'search_performed',
      description: 'Job hunt profile created',
      details: { target_roles: body.target_roles },
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/job-hunt/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update existing job hunt profile
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = (await request.json()) as any

    // Fetch existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('job_hunt_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found. Use POST to create.' },
        { status: 404 }
      )
    }

    // Update profile
    const updateData: any = {}

    if (body.target_roles !== undefined) updateData.target_roles = body.target_roles
    if (body.target_companies !== undefined) updateData.target_companies = body.target_companies
    if (body.target_locations !== undefined) updateData.target_locations = body.target_locations
    if (body.work_type !== undefined) updateData.work_type = body.work_type
    if (body.job_types !== undefined) updateData.job_types = body.job_types
    if (body.salary_min !== undefined) updateData.salary_min = body.salary_min
    if (body.salary_max !== undefined) updateData.salary_max = body.salary_max
    if (body.skills !== undefined) updateData.skills = body.skills
    if (body.years_of_experience !== undefined) updateData.years_of_experience = body.years_of_experience
    if (body.linkedin_profile !== undefined) updateData.linkedin_profile = body.linkedin_profile
    if (body.github_profile !== undefined) updateData.github_profile = body.github_profile
    if (body.portfolio_url !== undefined) updateData.portfolio_url = body.portfolio_url

    const { data: profile, error: updateError } = await supabase
      .from('job_hunt_profiles')
      .update(updateData)
      .eq('id', existingProfile.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating job hunt profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('job_hunt_activities').insert({
      profile_id: profile.id,
      activity_type: 'resume_updated',
      description: 'Job hunt profile updated',
      details: { updated_fields: Object.keys(updateData) },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/job-hunt/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete job hunt profile
export async function DELETE(request: NextRequest) {
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

    // Delete profile (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('job_hunt_profiles')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting job hunt profile:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/job-hunt/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
