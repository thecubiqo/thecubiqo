/**
 * Job Hunt Resume Upload API Route
 * Handles resume file uploads
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Upload resume
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

    // Get user's job hunt profile
    const { data: profile } = await supabase
      .from('job_hunt_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Job hunt profile not found. Create a profile first.' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `resume_${user.id}_${timestamp}.${fileExtension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('job-hunt-resumes')
      .upload(filename, file, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('job-hunt-resumes')
      .getPublicUrl(filename)

    // Update profile with resume URL
    const { error: updateError } = await supabase
      .from('job_hunt_profiles')
      .update({
        resume_url: publicUrl,
        resume_filename: file.name,
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('job_hunt_activities').insert({
      profile_id: profile.id,
      activity_type: 'resume_updated',
      description: 'Resume uploaded',
      details: { filename: file.name },
    })

    return NextResponse.json({
      success: true,
      resume_url: publicUrl,
      resume_filename: file.name,
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/job-hunt/resume:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
