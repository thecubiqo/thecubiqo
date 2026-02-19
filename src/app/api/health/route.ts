/**
 * Health Check API Endpoint
 * Monitors system health, Supabase connectivity, database schema, and AI API availability
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Track server start time
const SERVER_START_TIME = Date.now();

// Required tables for the app to function
const REQUIRED_TABLES = ['profiles', 'sessions', 'conversations', 'messages']

export async function GET() {
  const startTime = Date.now()
  const uptimeSeconds = Math.floor((startTime - SERVER_START_TIME) / 1000);

  const health: Record<string, unknown> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds),
    },
    environment: process.env.NODE_ENV || 'unknown',
    memory: process.memoryUsage ? {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    } : undefined,
    checks: {
      server: 'ok',
      supabase_connection: 'unknown',
      database_schema: 'unknown',
      env_vars: 'unknown',
      ai_apis: 'unknown',
    }
  }

  const checks = health.checks as Record<string, unknown>

  // Check required environment variables
  const envStatus: Record<string, boolean> = {
    NEXT_PUBLIC_SUPABASE_URL: !!(process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: !!(process.env.SUPABASE_SERVICE_ROLE_KEY1 || process.env.SUPABASE_SERVICE_ROLE_KEY),
  }

  const missingEnvVars = Object.entries(envStatus).filter(([, v]) => !v).map(([k]) => k)
  if (missingEnvVars.length > 0) {
    checks.env_vars = { status: 'missing', missing: missingEnvVars }
    health.status = 'degraded'
  } else {
    checks.env_vars = 'ok'
  }

  // Check Supabase connectivity
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY1 || process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    checks.supabase_connection = 'not_configured'
    checks.database_schema = 'not_configured'
    health.status = 'degraded'
  } else {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': supabaseAnonKey },
        signal: AbortSignal.timeout(3000),
      })
      checks.supabase_connection = response.ok ? 'ok' : 'degraded'
      if (!response.ok) health.status = 'degraded'
    } catch {
      checks.supabase_connection = 'error'
      health.status = 'degraded'
    }

    // Check database schema — verify required tables exist
    if (supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const tableResults: Record<string, string> = {}

        for (const table of REQUIRED_TABLES) {
          const { error } = await supabase.from(table).select('*').limit(0)
          tableResults[table] = error ? `missing (${error.message})` : 'ok'
        }

        const missingTables = Object.entries(tableResults)
          .filter(([, status]) => status !== 'ok')
          .map(([name]) => name)

        if (missingTables.length > 0) {
          checks.database_schema = {
            status: 'missing_tables',
            tables: tableResults,
            action: 'Run migrations from supabase/migrations/ in your Supabase SQL Editor'
          }
          health.status = 'critical'
        } else {
          checks.database_schema = { status: 'ok', tables: tableResults }
        }
      } catch (err) {
        checks.database_schema = {
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error checking schema'
        }
        health.status = 'degraded'
      }
    } else {
      checks.database_schema = 'skipped (no service role key)'
    }
  }

  // Check AI API keys are configured
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasMiniMax = !!process.env.MINIMAX_API_KEY
  const hasMistral = !!process.env.MISTRAL_API_KEY
  const hasTogether = !!process.env.TOGETHER_API_KEY

  if (hasAnthropic || hasMiniMax || hasMistral || hasTogether) {
    checks.ai_apis = 'ok'
  } else {
    checks.ai_apis = 'no_keys_configured'
    if (process.env.NODE_ENV === 'production') {
      health.status = 'degraded'
    }
  }

  const responseTime = Date.now() - startTime

  return NextResponse.json({
    ...health,
    responseTime: `${responseTime}ms`,
  }, {
    // 200 for degraded: monitoring tools expect 200 for partial availability
    // 503 only for critical (missing tables = app cannot function at all)
    status: health.status === 'healthy' ? 200 : health.status === 'critical' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}
