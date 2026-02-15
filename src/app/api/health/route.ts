/**
 * Health Check Endpoint
 * Returns system status, uptime, and memory usage
 * Critical for production monitoring and uptime checks
 */

import { NextResponse } from 'next/server';

// Track server start time
const SERVER_START_TIME = Date.now();

export const dynamic = 'force-dynamic';

export async function GET() {
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

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds),
      },
      memory: memoryInMB,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '2.0.0',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
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
