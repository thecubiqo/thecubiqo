import { NextRequest, NextResponse } from 'next/server';
import { listAgents } from '@/lib/engine/agent';
import { createAdminClient } from '@/lib/supabase/admin';
import '@/lib/engine/init';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const healthChecks: {
    supabase: { status: string; message?: string; latency?: number };
    agents: { status: string; message?: string; totalAgents?: number; activeAgents?: number };
    memory: { status: string; message?: string; heapUsedMB?: number; heapTotalMB?: number; rssMB?: number };
    uptime: { status: string; message?: string; uptimeSeconds?: number; uptimeHuman?: string };
  } = {
    supabase: { status: 'unknown' },
    agents: { status: 'unknown' },
    memory: { status: 'unknown' },
    uptime: { status: 'unknown' },
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  try {
    // Check Supabase connection
    const supabaseStart = Date.now();
    try {
      const supabase = createAdminClient();
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id')
        .limit(1);

      const latency = Date.now() - supabaseStart;

      if (error) {
        healthChecks.supabase = {
          status: 'unhealthy',
          message: `Database error: ${error.message}`,
          latency,
        };
        overallStatus = 'unhealthy';
      } else {
        healthChecks.supabase = {
          status: 'healthy',
          message: 'Connected',
          latency,
        };
      }
    } catch (error) {
      healthChecks.supabase = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
      overallStatus = 'unhealthy';
    }

    // Check Agent engine status
    try {
      const agents = listAgents();
      const activeAgents = agents.filter(a => a.status === 'running').length;

      if (agents.length === 0) {
        healthChecks.agents = {
          status: 'degraded',
          message: 'No agents initialized',
          totalAgents: 0,
          activeAgents: 0,
        };
        if (overallStatus === 'healthy') overallStatus = 'degraded';
      } else {
        healthChecks.agents = {
          status: 'healthy',
          message: `${activeAgents}/${agents.length} agents active`,
          totalAgents: agents.length,
          activeAgents,
        };
      }
    } catch (error) {
      healthChecks.agents = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Engine error',
      };
      overallStatus = 'unhealthy';
    }

    // Check Memory usage
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(memUsage.rss / 1024 / 1024);

      // Flag if memory usage is high (> 90% of heap)
      const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

      if (heapUsagePercent > 90) {
        healthChecks.memory = {
          status: 'degraded',
          heapUsedMB,
          heapTotalMB,
          rssMB,
        };
        if (overallStatus === 'healthy') overallStatus = 'degraded';
      } else {
        healthChecks.memory = {
          status: 'healthy',
          heapUsedMB,
          heapTotalMB,
          rssMB,
        };
      }
    } catch (error) {
      healthChecks.memory = {
        status: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to read memory',
      };
    }

    // Check Uptime
    try {
      const uptimeSeconds = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      const uptimeHuman = `${hours}h ${minutes}m ${seconds}s`;

      healthChecks.uptime = {
        status: 'healthy',
        uptimeSeconds,
        uptimeHuman,
      };
    } catch (error) {
      healthChecks.uptime = {
        status: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to read uptime',
      };
    }

    return NextResponse.json({
      status: overallStatus,
      services: healthChecks,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Admin health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        services: healthChecks,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
