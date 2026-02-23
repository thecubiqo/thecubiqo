/**
 * Emergent Studio — Deployment API
 * REQ-09: Executes the TODO to create real live Vercel URLs for generated apps.
 *
 * POST /api/emergent/deploy — Trigger a new deployment
 * GET  /api/emergent/deploy?deploymentId=xxx — Poll deployment status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const VERCEL_API_BASE = 'https://api.vercel.com'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getVercelToken(): string {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error('VERCEL_API_TOKEN is not configured')
  return token
}

function getVercelTeamId(): string | undefined {
  return process.env.VERCEL_TEAM_ID || undefined
}

/** Build query string that optionally injects teamId */
function vercelUrl(path: string): string {
  const teamId = getVercelTeamId()
  return teamId
    ? `${VERCEL_API_BASE}${path}?teamId=${teamId}`
    : `${VERCEL_API_BASE}${path}`
}

// ─── POST /api/emergent/deploy ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, files, projectName, framework = 'nextjs' } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    let token: string
    try {
      token = getVercelToken()
    } catch {
      // Graceful fallback: queue without actually deploying
      const deploymentId = `deploy-pending-${Date.now()}`
      return NextResponse.json({
        success: true,
        deployment: {
          id: deploymentId,
          projectId,
          status: 'queued',
          url: null,
          message: 'VERCEL_API_TOKEN not configured — deployment queued but not started'
        }
      }, { status: 202 })
    }

    // ── 1. Build the file payload Vercel expects ─────────────────────────────
    // Files can be passed as [{ name, content }] or we create a minimal scaffold
    const deployFiles = Array.isArray(files) && files.length > 0
      ? files
      : [
        {
          file: 'index.html',
          data: `<!DOCTYPE html><html><head><title>${projectName || 'Cubiqo App'}</title></head><body><h1>${projectName || 'Cubiqo App'}</h1><p>Deployed by Cubiqo Emergent Studio</p></body></html>`
        }
      ]

    const safeName = (projectName || `cubiqo-${projectId}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 52)

    // ── 2. POST to Vercel Deployments API ────────────────────────────────────
    const vercelRes = await fetch(vercelUrl('/v13/deployments'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: safeName,
        files: deployFiles,
        projectSettings: { framework },
        target: 'production'
      })
    })

    if (!vercelRes.ok) {
      const errBody = await vercelRes.text()
      console.error('[Emergent/Deploy] Vercel API error:', errBody)
      return NextResponse.json(
        { error: 'Vercel deployment failed', details: errBody },
        { status: vercelRes.status }
      )
    }

    const vercelData = await vercelRes.json()
    const deploymentUrl = vercelData.url ? `https://${vercelData.url}` : null

    // ── 3. Persist deployment record to Supabase ─────────────────────────────
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    await adminSupabase.from('emergent_projects').update({
      vercel_project_id: vercelData.id,
      deployment_url: deploymentUrl,
      status: 'deployed',
      updated_at: new Date().toISOString()
    }).eq('id', projectId)

    return NextResponse.json({
      success: true,
      deployment: {
        id: vercelData.id,
        projectId,
        status: vercelData.readyState || 'QUEUED',
        url: deploymentUrl,
        vercelInspectorUrl: vercelData.inspectorUrl || null,
        message: deploymentUrl
          ? `Deployed to ${deploymentUrl}`
          : 'Deployment initiated — URL will be available shortly'
      }
    }, { status: 202 })

  } catch (error) {
    console.error('[Emergent/Deploy] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── GET /api/emergent/deploy?deploymentId=xxx ───────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deploymentId = searchParams.get('deploymentId')

    if (!deploymentId) {
      return NextResponse.json({ error: 'Missing deploymentId' }, { status: 400 })
    }

    let token: string
    try {
      token = getVercelToken()
    } catch {
      return NextResponse.json({
        deployment: { id: deploymentId, status: 'VERCEL_NOT_CONFIGURED', url: null }
      })
    }

    const vercelRes = await fetch(vercelUrl(`/v13/deployments/${deploymentId}`), {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!vercelRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch deployment status' }, { status: vercelRes.status })
    }

    const vercelData = await vercelRes.json()

    return NextResponse.json({
      deployment: {
        id: vercelData.id,
        status: vercelData.readyState,
        url: vercelData.url ? `https://${vercelData.url}` : null,
        createdAt: vercelData.createdAt,
        ready: vercelData.readyState === 'READY'
      }
    })

  } catch (error) {
    console.error('[Emergent/Deploy] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
