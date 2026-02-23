/**
 * REQ-10: Browser Job Queue API
 * POST /api/automation/job — Validates intent and queues a browser job
 *
 * The Railway Node.js worker polls the `browser_jobs` table and executes
 * Puppeteer tasks, then updates status to 'completed'. The frontend listens
 * via Supabase Realtime.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ENV } from '@/lib/config/env'

export const dynamic = 'force-dynamic'

const ALLOWED_JOB_TYPES = [
    'screenshot',
    'scrape',
    'pdf',
    'form_fill',
    'social_post',
    'content_harvest'
] as const

type JobType = typeof ALLOWED_JOB_TYPES[number]

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            ENV.supabase.url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
            ENV.supabase.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(c) { c.forEach(({ name, value }) => cookieStore.set(name, value)) }
                }
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { jobType, payload, priority = 'normal' } = body

        // Validate job type against allowlist
        if (!ALLOWED_JOB_TYPES.includes(jobType as JobType)) {
            return NextResponse.json(
                { error: `Invalid job type. Allowed: ${ALLOWED_JOB_TYPES.join(', ')}` },
                { status: 400 }
            )
        }

        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )

        // Insert job into queue
        const { data: job, error: insertError } = await adminSupabase
            .from('browser_jobs')
            .insert({
                user_id: user.id,
                job_type: jobType,
                payload: payload || {},
                priority,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (insertError || !job) {
            console.error('[Automation/Job] Insert error:', insertError?.message)
            return NextResponse.json(
                { error: 'Failed to queue job' },
                { status: 500 }
            )
        }

        console.log(`[Automation/Job] Queued job ${job.id} (${jobType}) for user ${user.id}`)

        return NextResponse.json({
            success: true,
            job: {
                id: job.id,
                jobType: job.job_type,
                status: job.status,
                priority: job.priority,
                createdAt: job.created_at,
                message: 'Job queued. Subscribe to Supabase Realtime for completion updates.'
            }
        }, { status: 202 })

    } catch (error) {
        console.error('[Automation/Job] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/automation/job?jobId=xxx  — Poll job status
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            ENV.supabase.url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
            ENV.supabase.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(c) { c.forEach(({ name, value }) => cookieStore.set(name, value)) }
                }
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const jobId = searchParams.get('jobId')

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
        }

        const { data: job, error } = await supabase
            .from('browser_jobs')
            .select('id, job_type, status, priority, result, error_message, created_at, started_at, completed_at')
            .eq('id', jobId)
            .eq('user_id', user.id) // Enforce ownership
            .single()

        if (error || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        return NextResponse.json({ job })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
