/**
 * Health Check API Endpoint
 * Monitors system health, Supabase connectivity, and AI API availability
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const startTime = Date.now()
  
  // Check if staging environment is requested via query param
  const { searchParams } = new URL(request.url)
  const envParam = searchParams.get('env')
  const isStaging = envParam === 'staging' || process.env.NODE_ENV === 'staging'
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    environment: isStaging ? 'staging' : (process.env.NODE_ENV || 'unknown'),
    staging_mode: isStaging,
    checks: {
      server: 'ok',
      supabase: 'unknown',
      ai_apis: 'unknown',
      migrations: 'unknown',
    }
  }
  
  // Check Supabase connectivity (with staging support)
  try {
    const supabaseUrl = isStaging 
      ? (process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL)
      : process.env.NEXT_PUBLIC_SUPABASE_URL
    
    const supabaseKey = isStaging
      ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl) {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey || '',
        },
        signal: AbortSignal.timeout(3000),
      })
      health.checks.supabase = response.ok ? 'ok' : 'degraded'
      
      // Check if critical tables exist (migration validation)
      if (response.ok) {
        try {
          const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count&limit=1`, {
            method: 'HEAD',
            headers: {
              'apikey': supabaseKey || '',
            },
            signal: AbortSignal.timeout(2000),
          })
          health.checks.migrations = tablesResponse.ok ? 'ok' : 'missing_tables'
        } catch {
          health.checks.migrations = 'unable_to_verify'
        }
      }
    } else {
      health.checks.supabase = 'not_configured'
    }
  } catch {
    health.checks.supabase = 'error'
    health.status = 'degraded'
  }
  
  // Check AI API keys are configured
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasMiniMax = !!process.env.MINIMAX_API_KEY
  const hasMistral = !!process.env.MISTRAL_API_KEY
  const hasTogether = !!process.env.TOGETHER_API_KEY
  
  if (hasAnthropic || hasMiniMax || hasMistral || hasTogether) {
    health.checks.ai_apis = 'ok'
  } else {
    health.checks.ai_apis = 'no_keys_configured'
    health.status = 'degraded'
  }
  
  const responseTime = Date.now() - startTime
  
  return NextResponse.json({
    ...health,
    responseTime: `${responseTime}ms`,
  }, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}
