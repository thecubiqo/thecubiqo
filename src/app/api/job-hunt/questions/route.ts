/**
 * Job Hunt Questions API Route
 * Handles questionnaire for job hunt setup
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SubmitQuestionnaireRequest } from '@/types/job-hunt'

// GET - Fetch questions for a profile
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
    
    // Fetch questions
    const { data: questions, error: fetchError } = await supabase
      .from('job_hunt_questions')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      console.error('Error fetching questions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ questions: questions || [] })
  } catch (error) {
    console.error('Unexpected error in GET /api/job-hunt/questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Submit questionnaire answers
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
    const body: SubmitQuestionnaireRequest = await request.json()
    
    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json(
        { error: 'Questions are required' },
        { status: 400 }
      )
    }
    
    // Upsert questions (insert or update)
    const questionsToUpsert = body.questions.map(q => ({
      profile_id: profile.id,
      question_key: q.question_key,
      question_text: q.question_key,
      answer: q.answer,
      answer_type: 'text' as const,
      metadata: {},
    }))
    
    const { data: savedQuestions, error: upsertError } = await supabase
      .from('job_hunt_questions')
      .upsert(questionsToUpsert, {
        onConflict: 'profile_id,question_key'
      })
      .select()
    
    if (upsertError) {
      console.error('Error saving questions:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save questions' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      questions: savedQuestions 
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/job-hunt/questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
