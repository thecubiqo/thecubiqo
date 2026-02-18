/**
 * Health Check API Endpoint
 * Monitors system health, Supabase connectivity, AI API availability, and memory usage
 * Critical for production monitoring and uptime checks
 */

import { NextResponse } from 'next/server';

// Track server start time
const SERVER_START_TIME = Date.now();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const now = Date.now();
    const uptimeSeconds = Math.floor((now - SERVER_START_TIME) / 1000);
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryInMB = {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || '2.0.0',
      uptime: {
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds),
        processUptime: process.uptime(),
      },
      memory: memoryInMB,
      environment: process.env.NODE_ENV || 'development',
      checks: {
        server: 'ok',
        supabase: 'unknown',
        ai_apis: 'unknown',
      },
      responseTime: 0
    };
    
    // Check Supabase connectivity
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          signal: AbortSignal.timeout(3000),
        });
        health.checks.supabase = response.ok ? 'ok' : 'degraded';
      } else {
        health.checks.supabase = 'not_configured';
      }
    } catch {
      health.checks.supabase = 'error';
      health.status = 'degraded';
    }
    
    // Check AI API keys are configured
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasMiniMax = !!process.env.MINIMAX_API_KEY;
    const hasMistral = !!process.env.MISTRAL_API_KEY;
    const hasTogether = !!process.env.TOGETHER_API_KEY;
    
    if (hasAnthropic || hasMiniMax || hasMistral || hasTogether) {
      health.checks.ai_apis = 'ok';
    } else {
      health.checks.ai_apis = 'no_keys_configured';
      health.status = 'degraded';
    }
    
    const responseTime = Date.now() - startTime;
    health.responseTime = responseTime;
    
    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
      },
      { status: 503 }
    );
  }
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
